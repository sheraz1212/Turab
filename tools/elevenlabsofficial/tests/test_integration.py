"""Offline tests for the ElevenLabsOfficial integration. No network, no paid calls.

Run: python3 -m unittest discover -s tools/elevenlabsofficial/tests -v
"""
import io
import json
import logging
import os
import re
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))

from client import (ALLOWED_OPERATIONS, ApiError, Client, ClientConfig, ConfigError, Response,  # noqa: E402
                    TransportError, path_param, redact_headers)
from service import MAX_UPLOAD_BYTES, Service, is_latin_text, parse_credits  # noqa: E402
from store import Deferred, RateBudget, Store  # noqa: E402

FAKE_KEY = "test-key-0123456789abcdef"  # dummy, not a real secret
BASE = "https://elevenlabsofficial.com"

ME = {"username": "owner", "plan": "pro", "credits": 5000, "chars_per_generation": 50, "concurrent_jobs": 2,
      "rate_limit_per_min": 60, "history_kept": 30,
      "engines": [{"engine": "el", "name": "Eleven", "unlocked": True}, {"engine": "elpro", "name": "Eleven Pro", "unlocked": True},
                  {"engine": "hailuo", "name": "Hailuo", "unlocked": False}, {"engine": "cartesia", "name": "Cartesia", "unlocked": True}]}


class FakeTransport:
    """Scripted upstream. routes: list of (method, path_regex, [responses...]) consumed in order."""

    def __init__(self):
        self.routes = []
        self.calls = []

    def on(self, method, pattern, *responses):
        self.routes.append([method, re.compile(pattern), list(responses)])
        return self

    def __call__(self, method, url, headers, body, timeout):
        self.calls.append({"method": method, "url": url, "headers": dict(headers), "body": body})
        path = url[len(BASE):]
        for r in self.routes:
            if r[0] == method and r[1].match(path):
                if not r[2]:
                    raise AssertionError(f"no scripted response left for {method} {path}")
                resp = r[2].pop(0) if len(r[2]) > 1 else r[2][0]
                if isinstance(resp, Exception):
                    raise resp
                status, payload = resp[0], resp[1]
                hdrs = resp[2] if len(resp) > 2 else {}
                return Response(status, hdrs, json.dumps(payload).encode() if not isinstance(payload, bytes) else payload)
        raise AssertionError(f"unexpected call {method} {path}")


def j(status, payload, headers=None):
    return (status, payload, headers or {})


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.t = FakeTransport()
        self.sleeps = []
        self.now = [1000.0]

        def sleep(s):
            self.sleeps.append(s)
            self.now[0] += s

        self.clock = lambda: self.now[0]
        self.client = Client(ClientConfig(base_url=BASE, api_key=FAKE_KEY), transport=self.t, sleep=sleep,
                             clock=self.clock, rand=lambda: 0.5)
        self.store = Store(self.tmp.name, clock=self.clock)
        self.svc = Service(self.client, self.store, sleep=sleep, clock=self.clock)

    def tearDown(self):
        self.tmp.cleanup()

    def with_me(self, me=None):
        self.t.on("GET", r"^/v1/me$", j(200, me or ME))
        return self


# ---------------------------------------------------------------- client
class ClientTests(Base):
    def test_bearer_header_and_no_key_in_url_or_logs(self):
        self.with_me()
        with self.assertLogs("elevenlabsofficial", level="INFO") as logs:
            self.svc.me(refresh=True)
        call = self.t.calls[0]
        self.assertEqual(call["headers"]["Authorization"], f"Bearer {FAKE_KEY}")
        self.assertNotIn(FAKE_KEY, call["url"])
        self.assertNotIn(FAKE_KEY, "\n".join(logs.output))
        self.assertNotIn(FAKE_KEY, repr(self.client))
        self.assertEqual(redact_headers(call["headers"])["Authorization"], "[REDACTED]")

    def test_config_from_env(self):
        with self.assertRaises(ConfigError):
            ClientConfig.from_env({})
        with self.assertRaises(ConfigError):
            ClientConfig.from_env({"ELEVENLABSOFFICIAL_API_KEY": "x", "ELEVENLABSOFFICIAL_BASE_URL": "http://evil.example"})
        c = ClientConfig.from_env({"ELEVENLABSOFFICIAL_API_KEY": "x"})
        self.assertEqual(c.base_url, BASE)

    def test_error_message_never_contains_key(self):
        self.t.on("POST", r"^/v1/tts$", j(400, {"error": f"bad header Bearer {FAKE_KEY}"}))
        with self.assertRaises(ApiError) as cm:
            self.client.post_json("/v1/tts", {"input": "x", "voice_id": "v"})
        self.assertNotIn(FAKE_KEY, cm.exception.message)

    def test_status_mapping(self):
        expected = {400: "bad_request", 401: "unauthorized", 402: "insufficient_credits", 403: "forbidden", 404: "not_found",
                    409: "sample_missing", 413: "too_large", 429: "rate_limited", 502: "upstream_failed", 503: "unavailable",
                    418: "upstream_error"}
        for status, code in expected.items():
            self.t.routes.clear()
            self.t.on("POST", r"^/v1/carry$", j(status, {"error": "nope"}))
            with self.assertRaises(ApiError) as cm:
                self.client.post_json("/v1/carry", {"voice": "v", "target": "el"})
            self.assertEqual((cm.exception.status, cm.exception.code), (status, code))
            if status == 401:
                self.assertIn("ELEVENLABSOFFICIAL_API_KEY", cm.exception.message)
        # a POST is never retried, whatever the status
        self.assertEqual(len([c for c in self.t.calls if c["method"] == "POST"]), len(expected))

    def test_get_retries_on_503_then_succeeds(self):
        self.t.on("GET", r"^/v1/me$", j(503, {"error": "busy"}), j(502, {"error": "x"}), j(200, ME))
        self.assertEqual(self.client.get("/v1/me")["plan"], "pro")
        self.assertEqual(len(self.t.calls), 3)
        self.assertEqual(self.sleeps, [0.75, 1.5])  # exp backoff with jitter factor 0.75

    def test_get_retry_cap(self):
        self.t.on("GET", r"^/v1/history$", j(503, {"error": "down"}))
        with self.assertRaises(ApiError) as cm:
            self.client.get("/v1/history")
        self.assertEqual(cm.exception.status, 503)
        self.assertEqual(len(self.t.calls), self.client.config.max_get_attempts)

    def test_retry_after_honored(self):
        self.t.on("GET", r"^/v1/me$", j(429, {"error": "slow down"}, {"retry-after": "7"}), j(200, ME))
        self.client.get("/v1/me")
        self.assertEqual(self.sleeps, [7.0])

    def test_jitter_range(self):
        c = Client(ClientConfig(base_url=BASE, api_key=FAKE_KEY), rand=lambda: 0.0)
        self.assertEqual(c._backoff(3, None), 2.0)
        c.rand = lambda: 1.0
        self.assertEqual(c._backoff(3, None), 4.0)
        self.assertEqual(c._backoff(20, None), c.config.backoff_cap)

    def test_total_elapsed_cap(self):
        self.client.config.max_retry_elapsed = 5
        self.t.on("GET", r"^/v1/me$", j(429, {"error": "x"}, {"retry-after": "30"}), j(200, ME))
        with self.assertRaises(ApiError):
            self.client.get("/v1/me")
        self.assertEqual(self.sleeps, [])  # Retry-After beyond the cap: stop instead of retrying early

    def test_no_retry_after_uncertain_post(self):
        self.t.on("POST", r"^/v1/tts$", TransportError("timeout"))
        with self.assertRaises(ApiError) as cm:
            self.client.post_json("/v1/tts", {"input": "x", "voice_id": "v"})
        self.assertTrue(cm.exception.uncertain)
        self.assertEqual(len(self.t.calls), 1)

    def test_get_network_error_retried(self):
        self.t.on("GET", r"^/v1/me$", TransportError("reset"), j(200, ME))
        self.assertEqual(self.client.get("/v1/me")["plan"], "pro")

    def test_only_documented_operations(self):
        for bad in (("GET", "/api/internal"), ("POST", "/v1/me"), ("GET", "/v2/tts")):
            with self.assertRaises(ApiError):
                self.client.request(*bad)
        self.assertEqual(self.t.calls, [])

    def test_path_param_encoding_preserves_value(self):
        vid = "lib:Ab+c/d e?#%"
        enc = path_param(vid)
        self.assertNotIn("/", enc)
        from urllib.parse import unquote
        self.assertEqual(unquote(enc), vid)


# ---------------------------------------------------------------- account
class AccountTests(Base):
    def test_credits_variants(self):
        self.assertEqual(parse_credits(1234), 1234)
        self.assertEqual(parse_credits("unlimited"), "unlimited")
        self.assertEqual(parse_credits("Unlimited"), "unlimited")
        self.assertEqual(parse_credits(" UNLIMITED "), "unlimited")
        self.assertIsNone(parse_credits(True))
        self.assertIsNone(parse_credits("lots"))
        for v in (5000, "unlimited", "Unlimited"):
            self.t.routes.clear()
            self.with_me({**ME, "credits": v})
            self.assertEqual(self.svc.check_connection()["credits"], parse_credits(v))

    def test_engines_and_cache(self):
        self.with_me()
        info = self.svc.check_connection()
        self.assertEqual(info["engines_unlocked"], ["cartesia", "el", "elpro"])
        self.svc.me()
        self.svc.me()
        self.assertEqual(len(self.t.calls), 1)  # cached
        self.now[0] += 61
        self.svc.me()
        self.assertEqual(len(self.t.calls), 2)  # TTL expired


# ---------------------------------------------------------------- voices
class VoiceTests(Base):
    def test_library_pagination_and_id_preservation(self):
        weird = "  lib_Ab:+/=é%20x  "
        self.t.on("GET", r"^/v1/library", j(200, {"page": 2, "pages": 5, "total": 410, "voices": [
            {"voice_id": weird, "name": "Narrator", "tags": ["calm"], "preview_url": "https://x/p.mp3", "engine": "el"}]}))
        out = self.svc.library(q="calm", page=2, per=500)
        self.assertIn("per=100", self.t.calls[0]["url"])
        self.assertIn("page=2", self.t.calls[0]["url"])
        self.assertEqual(out["voices"][0]["voice_id"], weird)  # byte-for-byte
        self.assertEqual((out["page"], out["pages"], out["total"]), (2, 5, 410))
        self.svc.library(q="calm", page=2, per=500)
        self.assertEqual(len(self.t.calls), 1)  # cached catalog

    def test_my_voices(self):
        self.t.on("GET", r"^/v1/voices\?type=my_all$", j(200, {"voices": [{"voice_id": "c-1", "name": "Me", "engine": "elpro"}]}))
        self.assertEqual(self.svc.my_voices()[0]["engine"], "elpro")


# ---------------------------------------------------------------- tts
class TtsTests(Base):
    def test_sync(self):
        self.with_me().t.on("POST", r"^/v1/tts$", j(200, {"task_id": "t1", "direct_url": "https://cdn/a.mp3", "credits_left": "Unlimited"}))
        self.t.on("GET", r"^/v1/history$", j(200, {"history": []}))
        res = self.svc.tts("Hello world", "lib:x/1", "el")
        self.assertEqual(res, {"task_id": "t1", "status": "completed", "audio_url": "https://cdn/a.mp3", "credits_left": "unlimited"})
        body = json.loads(self.t.calls[-1]["body"])
        self.assertEqual(body, {"input": "Hello world", "voice_id": "lib:x/1", "engine": "el"})

    def test_locked_engine_and_limits(self):
        self.with_me()
        with self.assertRaises(ApiError) as cm:
            self.svc.tts("hi", "v", "hailuo")
        self.assertEqual(cm.exception.code, "engine_locked")
        with self.assertRaises(ApiError) as cm:
            self.svc.tts("x" * 51, "v", "el")
        self.assertEqual(cm.exception.code, "too_long")
        with self.assertRaises(ApiError) as cm:
            self.svc.tts("Привет мир", "v", "cartesia")
        self.assertEqual(cm.exception.code, "unsupported_script")
        with self.assertRaises(ApiError):
            self.svc.tts("hi", "v", "el", speed=2.5)
        with self.assertRaises(ApiError):
            self.svc.tts("hi", "v", "el", stability=0.5)  # el does not take advanced fields
        self.assertTrue(is_latin_text("Café, naïve! 123"))
        self.assertEqual([c for c in self.t.calls if c["method"] == "POST"], [])

    def test_advanced_fields(self):
        self.with_me().t.on("POST", r"^/v1/tts$", j(200, {"task_id": "t2", "queued": True}))
        self.svc.tts("hi", "v", "elpro", speed=1.2, async_=True, stability=0.4, model="m1")
        body = json.loads(self.t.calls[-1]["body"])
        self.assertEqual(body["advanced"], 1)
        self.assertEqual(body["model"], "m1")
        self.assertTrue(body["async"])

    def test_async_flow_states(self):
        self.with_me().t.on("POST", r"^/v1/tts$", j(200, {"task_id": "a1", "queued": True}))
        self.t.on("GET", r"^/v1/tts/result/a1$", j(200, {"status": "processing"}), j(200, {"status": "processing"}),
                  j(200, {"status": "completed", "audio_url": "https://cdn/a1.mp3", "credits_left": 4990}))
        self.t.on("GET", r"^/v1/history$", j(200, {"history": [{"task_id": "a1", "ts": "now"}]}))
        res = self.svc.tts("hello", "v", "el", async_=True)
        self.assertEqual(res["status"], "processing")
        self.assertEqual(self.store.get_task("a1")["status"], "processing")  # saved before polling
        done = self.svc.poll_tts("a1")
        self.assertEqual((done["status"], done["credits_left"]), ("completed", 4990))
        self.assertTrue(self.store.get_task("a1")["in_history"])
        self.assertEqual(self.sleeps, [2.5, 2.5])

    def test_async_failed_refreshes_balance(self):
        self.with_me().t.on("POST", r"^/v1/tts$", j(200, {"task_id": "f1", "queued": True}))
        self.t.on("GET", r"^/v1/tts/result/f1$", j(200, {"status": "failed", "error": "engine"}))
        self.svc.tts("hello", "v", "el", async_=True)
        self.assertEqual(self.svc.poll_tts("f1")["status"], "failed")
        self.assertEqual(len([c for c in self.t.calls if c["url"].endswith("/v1/me")]), 2)

    def test_deadline_then_resume(self):
        self.with_me().t.on("POST", r"^/v1/tts$", j(200, {"task_id": "d1", "queued": True}))
        self.t.on("GET", r"^/v1/tts/result/d1$", j(200, {"status": "processing"}))
        self.svc.tts("hello", "v", "el", async_=True)
        res = self.svc.poll_tts("d1", deadline_s=6)
        self.assertEqual(res["status"], "processing")
        self.assertTrue(res["resumable"])
        # a fresh process (new Service on the same state dir) resumes the task
        self.t.routes.clear()
        self.t.on("GET", r"^/v1/tts/result/d1$", j(200, {"status": "completed", "audio_url": "https://cdn/d1.mp3", "credits_left": 1}))
        self.t.on("GET", r"^/v1/history$", j(200, {"history": []}))
        svc2 = Service(self.client, Store(self.tmp.name, clock=self.clock), sleep=lambda s: None, clock=self.clock)
        self.assertEqual(svc2.poll_tts("d1")["status"], "completed")

    def test_unknown_status_is_not_success(self):
        self.with_me().t.on("POST", r"^/v1/tts$", j(200, {"task_id": "u1", "queued": True}))
        self.t.on("GET", r"^/v1/tts/result/u1$", j(200, {"status": "weird"}))
        self.svc.tts("hello", "v", "el", async_=True)
        res = self.svc.poll_tts("u1", once=True)
        self.assertEqual(res["status"], "unknown")

    def test_duplicate_submission_blocked(self):
        self.with_me().t.on("POST", r"^/v1/tts$", j(200, {"task_id": "p1", "queued": True}))
        self.svc.tts("same text", "v", "el", async_=True)
        with self.assertRaises(ApiError) as cm:
            self.svc.tts("same text", "v", "el", async_=True)
        self.assertEqual(cm.exception.code, "duplicate")

    def test_uncertain_post_blocks_resubmit(self):
        self.with_me().t.on("POST", r"^/v1/tts$", TransportError("timeout"))
        with self.assertRaises(ApiError) as cm:
            self.svc.tts("text", "v", "el")
        self.assertTrue(cm.exception.uncertain)
        with self.assertRaises(ApiError) as cm:
            self.svc.tts("text", "v", "el")
        self.assertEqual(cm.exception.code, "duplicate")
        self.assertEqual(len([c for c in self.t.calls if c["method"] == "POST"]), 1)

    def test_402_refreshes_credits(self):
        self.with_me().t.on("POST", r"^/v1/tts$", j(402, {"error": "Not enough credits"}))
        with self.assertRaises(ApiError) as cm:
            self.svc.tts("text", "v", "el")
        self.assertEqual(cm.exception.code, "insufficient_credits")
        self.assertEqual(len([c for c in self.t.calls if c["url"].endswith("/v1/me")]), 2)

    def test_concurrency_limit(self):
        self.with_me({**ME, "concurrent_jobs": 1}).t.on("POST", r"^/v1/tts$", j(200, {"task_id": "c1", "queued": True}))
        self.svc.tts("one", "v", "el", async_=True)
        with self.assertRaises(ApiError) as cm:
            self.svc.tts("two", "v", "el", async_=True)
        self.assertEqual(cm.exception.code, "concurrency")

    def test_404_voice(self):
        self.with_me().t.on("POST", r"^/v1/tts$", j(404, {"error": "Voice not found"}))
        with self.assertRaises(ApiError) as cm:
            self.svc.tts("text", "gone", "el")
        self.assertEqual(cm.exception.message, "Voice not found")


# ---------------------------------------------------------------- upload + clone
class CloneTests(Base):
    def sample(self, name="s.mp3", size=10):
        p = os.path.join(self.tmp.name, name)
        with open(p, "wb") as f:
            f.write(b"\x00" * size)
        return p

    def test_upload_rejections(self):
        with self.assertRaises(ApiError) as cm:
            self.svc.upload(self.sample("x.txt"))
        self.assertEqual(cm.exception.code, "unsupported_type")
        big = self.sample("big.wav", 1)
        os.truncate(big, MAX_UPLOAD_BYTES + 1)
        with self.assertRaises(ApiError) as cm:
            self.svc.upload(big)
        self.assertEqual(cm.exception.status, 413)
        self.assertEqual(self.t.calls, [])

    def test_upload_413_from_server(self):
        self.t.on("POST", r"^/v1/upload$", j(413, {"error": "Over 100 MB"}))
        with self.assertRaises(ApiError) as cm:
            self.svc.upload(self.sample())
        self.assertEqual(cm.exception.code, "too_large")

    def test_upload_to_clone_flow(self):
        self.with_me()
        self.t.on("POST", r"^/v1/upload$", j(200, {"r2_url": "https://r2/sample-1.mp3"}))
        self.t.on("POST", r"^/v1/clone$", j(202, {"task_id": "k1", "status": "queued"}))
        self.t.on("GET", r"^/v1/clone/status/k1$", j(200, {"status": "queued"}), j(200, {"status": "processing"}),
                  j(200, {"status": "completed", "voice_id": "clone:K1/=="}))
        up = self.svc.upload(self.sample())
        mp = [c for c in self.t.calls if c["url"].endswith("/v1/upload")][0]
        self.assertIn(b'name="file"; filename="s.mp3"', mp["body"])
        self.assertTrue(mp["headers"]["Content-Type"].startswith("multipart/form-data; boundary="))
        res = self.svc.clone(up["r2_url"], "Narrator", "elpro")
        self.assertEqual(res["task_id"], "k1")
        with self.assertRaises(ApiError):  # duplicate/overlapping clone blocked
            self.svc.clone(up["r2_url"], "Narrator", "elpro")
        done = self.svc.poll_clone("k1")
        self.assertEqual(done["voice_id"], "clone:K1/==")
        self.assertIn("clone:K1/==", self.store.voices())

    def test_clone_rejects_unknown_sample_url(self):
        self.with_me()
        with self.assertRaises(ApiError):
            self.svc.clone("https://attacker.example/x.mp3", "N", "el")
        self.assertEqual([c for c in self.t.calls if c["method"] == "POST"], [])

    def _started(self, statuses):
        self.with_me()
        self.store.add_upload("https://r2/s.mp3", "s.mp3")
        self.t.on("POST", r"^/v1/clone$", j(200, {"task_id": "k2", "status": "queued"}))
        self.t.on("GET", r"^/v1/clone/status/k2$", *[j(200, s) for s in statuses])
        self.svc.clone("https://r2/s.mp3", "N", "el")

    def test_clone_failed(self):
        self._started([{"status": "failed", "error": "bad sample"}])
        self.assertEqual(self.svc.poll_clone("k2")["status"], "failed")

    def test_clone_cancelled_terminal(self):
        self._started([{"status": "cancelled"}])
        self.assertEqual(self.svc.poll_clone("k2")["status"], "cancelled")

    def test_clone_unknown_never_success(self):
        self._started([{"status": "mystery"}])
        res = self.svc.poll_clone("k2", once=True)
        self.assertEqual(res["status"], "unknown")
        self.assertEqual(self.store.voices(), {})

    def test_clone_completed_without_voice_id_is_unknown(self):
        self._started([{"status": "completed"}])
        self.assertEqual(self.svc.poll_clone("k2", once=True)["status"], "unknown")

    def test_clone_429_surfaces_message(self):
        self.with_me()
        self.store.add_upload("https://r2/s.mp3", "s.mp3")
        self.t.on("POST", r"^/v1/clone$", j(429, {"error": "Daily clone limit reached for your plan"}))
        with self.assertRaises(ApiError) as cm:
            self.svc.clone("https://r2/s.mp3", "N", "el")
        self.assertEqual(cm.exception.message, "Daily clone limit reached for your plan")


# ---------------------------------------------------------------- management
class ManageTests(Base):
    def voices(self, *ids):
        self.t.on("GET", r"^/v1/voices\?type=my_all$", j(200, {"voices": [{"voice_id": i, "engine": "el", "name": "n"} for i in ids]}))

    def test_delete_requires_confirmation_and_ownership(self):
        self.voices("c/1")
        with self.assertRaises(ApiError) as cm:
            self.svc.delete_voice("c/1")
        self.assertEqual(cm.exception.code, "confirmation_required")
        with self.assertRaises(ApiError) as cm:
            self.svc.delete_voice("someone-else", confirm=True)
        self.assertEqual(cm.exception.status, 404)
        self.t.on("DELETE", r"^/v1/voices/c%2F1$", j(200, {"success": True}))
        self.assertTrue(self.svc.delete_voice("c/1", confirm=True)["success"])

    def test_rename_uses_voice_engine(self):
        self.t.on("GET", r"^/v1/voices\?type=my_all$", j(200, {"voices": [{"voice_id": "c1", "engine": "cartesia"}]}))
        self.t.on("POST", r"^/v1/voices/rename$", j(200, {"ok": True, "name": "New"}))
        self.svc.rename("c1", "New")
        self.assertEqual(json.loads(self.t.calls[-1]["body"]), {"voice_id": "c1", "name": "New", "engine": "cartesia"})
        with self.assertRaises(ApiError):
            self.svc.rename("c1", "x" * 61)

    def test_carry_ready_and_cloning(self):
        self.with_me()
        self.voices("c1")
        self.t.on("POST", r"^/v1/carry$", j(200, {"ok": True, "status": "cloning", "tid": "tc"}),
                  j(200, {"ok": True, "status": "ready", "voice_id": "cp:1", "engine": "elpro"}))
        self.t.on("GET", r"^/v1/clone/status/tc$", j(200, {"status": "completed", "voice_id": "tmp"}))
        res = self.svc.carry("c1", "elpro")
        self.assertEqual(res, {"status": "ready", "voice_id": "cp:1", "engine": "elpro"})

    def test_carry_409(self):
        self.with_me()
        self.voices("c1")
        self.t.on("POST", r"^/v1/carry$", j(409, {"error": "Original sample missing"}))
        with self.assertRaises(ApiError) as cm:
            self.svc.carry("c1", "elpro")
        self.assertEqual(cm.exception.code, "sample_missing")

    def test_carry_requires_ownership(self):
        self.voices("c1")
        with self.assertRaises(ApiError):
            self.svc.carry("not-mine", "el")


# ---------------------------------------------------------------- history
class HistoryTests(Base):
    def test_reconcile_and_filter(self):
        self.store.save_task({"task_id": "mine", "kind": "tts", "status": "completed"})
        self.t.on("GET", r"^/v1/history$", j(200, {"history": [{"task_id": "mine"}, {"task_id": "other"}]}))
        self.assertEqual([r["task_id"] for r in self.svc.history(mine_only=True)], ["mine"])
        self.assertEqual(len(self.svc.history()), 2)
        self.assertIsNotNone(self.svc.reconcile_history("mine"))
        self.assertIsNone(self.svc.reconcile_history("missing"))  # no fake row created


# ---------------------------------------------------------------- rate budget
class BudgetTests(Base):
    def test_shared_budget_reserves_poll_capacity(self):
        b = RateBudget(self.store, lambda: 8, sleep=lambda s: None, max_wait=0)
        for _ in range(6):  # 8 - reserve(2)
            self.assertEqual(b.try_acquire("submit"), 0)
        self.assertGreater(b.try_acquire("submit"), 0)
        self.assertEqual(b.try_acquire("poll"), 0)  # polls still allowed
        self.assertEqual(b.try_acquire("poll"), 0)
        self.assertGreater(b.try_acquire("poll"), 0)
        with self.assertRaises(Deferred):
            b.acquire("submit")
        # a second process on the same state dir sees the same budget
        b2 = RateBudget(Store(self.tmp.name, clock=self.clock), lambda: 8, sleep=lambda s: None, max_wait=0)
        self.assertGreater(b2.try_acquire("poll"), 0)
        self.now[0] += 61
        self.assertEqual(b2.try_acquire("submit"), 0)


# ---------------------------------------------------------------- contract
class ContractTests(unittest.TestCase):
    def test_every_used_operation_exists_in_pinned_spec(self):
        with open(os.path.join(HERE, "fixtures", "openapi.json")) as f:
            spec = json.load(f)
        for method, path in ALLOWED_OPERATIONS:
            self.assertIn(path, spec["paths"], path)
            self.assertIn(method.lower(), spec["paths"][path], f"{method} {path}")
        self.assertEqual(spec["components"]["securitySchemes"]["bearerAuth"]["scheme"], "bearer")


# ---------------------------------------------------------------- optional live smoke tests
LIVE = os.environ.get("ELEVENLABSOFFICIAL_LIVE_TESTS") == "1"


@unittest.skipUnless(LIVE, "set ELEVENLABSOFFICIAL_LIVE_TESTS=1 to run live read-only checks")
class LiveSmokeTests(unittest.TestCase):
    def test_live_openapi_matches_used_paths(self):
        import urllib.request
        base = os.environ.get("ELEVENLABSOFFICIAL_BASE_URL", BASE).rstrip("/")
        req = urllib.request.Request(base + "/v1/openapi.json", headers={"User-Agent": "turab-pipeline/1.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            spec = json.load(r)
        for method, path in ALLOWED_OPERATIONS:
            self.assertIn(method.lower(), spec["paths"].get(path, {}), f"{method} {path}")

    @unittest.skipUnless(os.environ.get("ELEVENLABSOFFICIAL_API_KEY"), "no server-side key configured")
    def test_live_me(self):
        with tempfile.TemporaryDirectory() as d:
            svc = Service(Client(ClientConfig.from_env()), Store(d))
            info = svc.check_connection()  # read-only, free
        self.assertTrue(info["connected"])
        self.assertIsInstance(info["engines_unlocked"], list)


if __name__ == "__main__":
    logging.basicConfig(level=logging.WARNING)
    unittest.main()
