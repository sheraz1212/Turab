"""Business logic for the ElevenLabsOfficial integration (single owner).

Validation happens here before any paid request is sent. Upstream credits are the billing source of
truth: this module never adds or subtracts credits, it only shows what the API returns.
"""
from __future__ import annotations

import hashlib
import os
import time
import unicodedata
import urllib.parse
import urllib.request
from typing import Any, Callable, Optional

from client import ApiError, Client, path_param
from store import Store

ENGINES = ("el", "elpro", "hailuo", "cartesia")
ADVANCED_ENGINES = {"elpro", "hailuo", "cartesia"}  # stability / similarity / style
MODEL_ENGINES = {"elpro"}
AUDIO_TYPES = {".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".ogg": "audio/ogg",
               ".opus": "audio/opus", ".flac": "audio/flac", ".aac": "audio/aac"}
MAX_UPLOAD_BYTES = 100 * 1024 * 1024
ME_TTL, LIBRARY_TTL, VOICES_TTL = 60.0, 300.0, 60.0
TTS_ACTIVE = {"processing", "unknown"}
CLONE_ACTIVE = {"queued", "processing", "unknown"}
CLONE_TERMINAL = {"completed", "failed", "cancelled"}


class ValidationError(ApiError):
    def __init__(self, message: str, code: str = "invalid_input"):
        super().__init__(400, code, message, retryable=False)


def parse_credits(v: Any):
    """int for numeric balances, 'unlimited' for an unlimited plan, None when unknown."""
    if isinstance(v, bool):
        return None
    if isinstance(v, int):
        return v
    if isinstance(v, float) and v.is_integer():
        return int(v)
    if isinstance(v, str):
        s = v.strip()
        if s.lower() == "unlimited":
            return "unlimited"
        if s.isdigit():
            return int(s)
    return None


def is_latin_text(text: str) -> bool:
    for ch in text:
        if ch.isalpha() and not unicodedata.name(ch, "").startswith("LATIN"):
            return False
    return True


def _num(name: str, v: Any, lo: float, hi: float) -> float:
    if isinstance(v, bool) or not isinstance(v, (int, float)) or not (lo <= float(v) <= hi):
        raise ValidationError(f"{name} must be between {lo} and {hi}.")
    return float(v)


class Service:
    def __init__(self, client: Client, store: Store, sleep: Callable[[float], None] = time.sleep,
                 clock: Callable[[], float] = time.time):
        self.c, self.s, self.sleep, self.clock = client, store, sleep, clock

    # ---------------- account ----------------
    def me(self, refresh: bool = False) -> dict:
        if not refresh:
            hit = self.s.cache_get("me", ME_TTL)
            if hit is not None:
                return hit
        raw = self.c.get("/v1/me")
        info = {
            "username": raw.get("username"),
            "plan": raw.get("plan"),
            "credits": parse_credits(raw.get("credits")),
            "chars_per_generation": raw.get("chars_per_generation") if isinstance(raw.get("chars_per_generation"), int) else None,
            "concurrent_jobs": raw.get("concurrent_jobs") if isinstance(raw.get("concurrent_jobs"), int) else None,
            "rate_limit_per_min": raw.get("rate_limit_per_min") if isinstance(raw.get("rate_limit_per_min"), int) else None,
            "history_kept": raw.get("history_kept") if isinstance(raw.get("history_kept"), int) else None,
            "engines": [{"engine": e.get("engine"), "name": e.get("name"), "speed": e.get("speed"), "plans": e.get("plans"),
                         "unlocked": e.get("unlocked") is True} for e in raw.get("engines") or [] if isinstance(e, dict)],
        }
        self.s.cache_put("me", info)
        return info

    def cached_rate_limit(self) -> Optional[int]:
        hit = self.s.cache_get("me", 3600)
        return hit.get("rate_limit_per_min") if hit else None

    def unlocked_engines(self) -> set:
        return {e["engine"] for e in self.me()["engines"] if e["unlocked"]}

    def check_connection(self) -> dict:
        info = self.me(refresh=True)
        return {"connected": True, **{k: info[k] for k in ("plan", "credits", "chars_per_generation", "concurrent_jobs",
                                                          "rate_limit_per_min", "history_kept")},
                "engines_unlocked": sorted(self.unlocked_engines())}

    # ---------------- voices ----------------
    def library(self, q=None, lang=None, gender=None, age=None, category=None, page: int = 1, per: int = 50) -> dict:
        if not isinstance(page, int) or page < 1:
            raise ValidationError("page must be 1 or more.")
        if not isinstance(per, int) or per < 1:
            raise ValidationError("per must be 1 or more.")
        per = min(per, 100)
        params = {"q": q, "lang": lang, "gender": gender, "age": age, "category": category, "page": page, "per": per}
        key = "lib:" + urllib.parse.urlencode(sorted((k, str(v)) for k, v in params.items() if v not in (None, "")))
        hit = self.s.cache_get(key, LIBRARY_TTL)
        if hit is not None:
            return hit
        raw = self.c.get("/v1/library", params=params)
        out = {"page": raw.get("page"), "pages": raw.get("pages"), "total": raw.get("total"),
               "voices": [{"voice_id": v.get("voice_id"), "name": v.get("name"), "tags": v.get("tags") or [],
                           "preview_url": v.get("preview_url"), "engine": v.get("engine")}
                          for v in raw.get("voices") or [] if isinstance(v, dict) and isinstance(v.get("voice_id"), str)]}
        self.s.cache_put(key, out)
        return out

    def my_voices(self, refresh: bool = False) -> list:
        if not refresh:
            hit = self.s.cache_get("my_voices", VOICES_TTL)
            if hit is not None:
                return hit
        raw = self.c.get("/v1/voices", params={"type": "my_all"})
        out = [{"voice_id": v.get("voice_id"), "name": v.get("name"), "engine": v.get("engine"), "tags": v.get("tags") or [],
                "preview": v.get("preview"), "created_at": v.get("created_at")}
               for v in raw.get("voices") or [] if isinstance(v, dict) and isinstance(v.get("voice_id"), str)]
        self.s.cache_put("my_voices", out)
        return out

    def _owned_voice(self, voice_id: str) -> dict:
        for v in self.my_voices(refresh=True):
            if v["voice_id"] == voice_id:
                return v
        raise ApiError(404, "not_found", "That voice is not one of your clones.")

    # ---------------- text to speech ----------------
    def _validate_tts(self, text: str, voice_id: str, engine: str, speed, adv: dict) -> dict:
        if not isinstance(text, str) or not text.strip():
            raise ValidationError("Text is required.")
        if not isinstance(voice_id, str) or voice_id == "":
            raise ValidationError("voice_id is required.")
        if engine not in ENGINES:
            raise ValidationError(f"engine must be one of {', '.join(ENGINES)}.")
        info = self.me()
        if engine not in {e["engine"] for e in info["engines"] if e["unlocked"]}:
            raise ApiError(403, "engine_locked", f"The {engine} engine is locked on the current plan.")
        limit = info.get("chars_per_generation")
        if isinstance(limit, int) and len(text) > limit:
            raise ValidationError(f"Text is {len(text)} characters; the plan allows {limit} per generation.", "too_long")
        if engine == "cartesia" and not is_latin_text(text):
            raise ValidationError("The Cartesia engine only accepts Latin-script text.", "unsupported_script")
        payload = {"input": text, "voice_id": voice_id, "engine": engine}
        if speed is not None:
            payload["speed"] = _num("speed", speed, 0.5, 2.0)
        extra = {k: v for k, v in adv.items() if v is not None}
        if extra:
            for k in ("stability", "similarity", "style"):
                if k in extra:
                    if engine not in ADVANCED_ENGINES:
                        raise ValidationError(f"{k} is not supported on the {engine} engine.")
                    payload[k] = _num(k, extra[k], 0.0, 1.0)
            if "model" in extra:
                if engine not in MODEL_ENGINES or not isinstance(extra["model"], str) or not extra["model"]:
                    raise ValidationError("model is only supported on the elpro engine.")
                payload["model"] = extra["model"]
            unknown = set(extra) - {"stability", "similarity", "style", "model"}
            if unknown:
                raise ValidationError("Unsupported option: " + ", ".join(sorted(unknown)))
            payload["advanced"] = 1
        return payload

    @staticmethod
    def _fingerprint(payload: dict) -> str:
        return hashlib.sha256(repr(sorted(payload.items())).encode()).hexdigest()

    def _guard_duplicate(self, fp: str) -> None:
        for t in self.s.tasks("tts"):
            if t.get("fingerprint") == fp and t.get("status") in TTS_ACTIVE | {"submitting", "uncertain"}:
                raise ApiError(409, "duplicate", f"The same generation is already in progress or unconfirmed (task {t['task_id']}). "
                               "Check history, then run `forget` on it if you really want to resubmit.")

    def _guard_concurrency(self) -> None:
        cap = self.me().get("concurrent_jobs")
        active = [t for t in self.s.tasks() if t.get("status") in TTS_ACTIVE | CLONE_ACTIVE | {"submitting"}]
        if isinstance(cap, int) and cap > 0 and len(active) >= cap:
            raise ApiError(429, "concurrency", f"{len(active)} job(s) already running; the plan allows {cap} at once.", retryable=True)

    def tts(self, text: str, voice_id: str, engine: str = "el", speed=None, async_: bool = False, **adv) -> dict:
        payload = self._validate_tts(text, voice_id, engine, speed, adv)
        fp = self._fingerprint(payload)
        self._guard_duplicate(fp)
        self._guard_concurrency()
        if async_:
            payload["async"] = True
        pending_id = "pending-" + fp[:16]
        self.s.save_task({"task_id": pending_id, "kind": "tts", "status": "submitting", "fingerprint": fp,
                          "engine": engine, "voice_id": voice_id, "chars": len(text), "created": self.clock()})
        try:
            raw = self.c.post_json("/v1/tts", payload)
        except ApiError as e:
            # an uncertain delivery stays recorded so it is reconciled before anyone resubmits
            self.s.save_task({"task_id": pending_id, "status": "uncertain" if e.uncertain else "rejected", "error": e.message})
            if e.status == 402:
                self.me(refresh=True)
            raise
        task_id = raw.get("task_id")
        self.s.save_task({"task_id": pending_id, "status": "submitted", "upstream_task_id": task_id})
        credits = parse_credits(raw.get("credits_left"))
        if raw.get("direct_url"):
            rec = {"task_id": task_id or pending_id, "kind": "tts", "status": "completed", "fingerprint": fp, "engine": engine,
                   "voice_id": voice_id, "chars": len(text), "audio_url": raw["direct_url"], "credits_left": credits, "created": self.clock()}
            self.s.save_task(rec)
            self.s.cache_drop("me")
            return {"task_id": rec["task_id"], "status": "completed", "audio_url": raw["direct_url"], "credits_left": credits}
        if not isinstance(task_id, str) or not task_id:
            raise ApiError(502, "bad_response", "The voice service did not return a task id.")
        self.s.save_task({"task_id": task_id, "kind": "tts", "status": "processing", "fingerprint": fp, "engine": engine,
                          "voice_id": voice_id, "chars": len(text), "created": self.clock()})
        return {"task_id": task_id, "status": "processing"}

    def poll_tts(self, task_id: str, deadline_s: float = 600.0, interval: float = 2.5, once: bool = False) -> dict:
        task = self.s.get_task(task_id)
        if not task or task.get("kind") != "tts":
            raise ApiError(404, "not_found", "Unknown generation task.")
        if task["status"] in ("completed", "failed"):
            return self._public_task(task)
        end = self.clock() + deadline_s
        while True:
            raw = self.c.get("/v1/tts/result/" + path_param(task_id), budget_kind="poll")
            st = raw.get("status")
            if st == "completed" and raw.get("audio_url"):
                task = self.s.save_task({"task_id": task_id, "status": "completed", "audio_url": raw["audio_url"],
                                         "credits_left": parse_credits(raw.get("credits_left"))})
                self.s.cache_drop("me")
                self.reconcile_history(task_id)
                return self._public_task(task)
            if st == "failed":
                task = self.s.save_task({"task_id": task_id, "status": "failed", "error": str(raw.get("error") or "Generation failed.")[:300]})
                self.me(refresh=True)
                return self._public_task(task)
            task = self.s.save_task({"task_id": task_id, "status": "processing" if st == "processing" else "unknown"})
            if once or self.clock() + interval > end:
                out = self._public_task(task)
                out["resumable"] = True
                return out
            self.sleep(interval)

    @staticmethod
    def _public_task(t: dict) -> dict:
        return {k: t[k] for k in ("task_id", "kind", "status", "audio_url", "credits_left", "error", "voice_id", "engine") if k in t}

    def forget(self, task_id: str) -> None:
        """Deliberately clear a stuck/uncertain local record after checking history or voices."""
        t = self.s.get_task(task_id)
        if not t:
            raise ApiError(404, "not_found", "Unknown task.")
        self.s.save_task({"task_id": task_id, "status": "abandoned"})

    # ---------------- history ----------------
    def history(self, mine_only: bool = False) -> list:
        raw = self.c.get("/v1/history")
        rows = [r for r in raw.get("history") or [] if isinstance(r, dict)]
        if mine_only:
            known = {t["task_id"] for t in self.s.tasks("tts")}
            rows = [r for r in rows if r.get("task_id") in known]
        return rows

    def reconcile_history(self, task_id: str) -> Optional[dict]:
        try:
            for r in self.history():
                if r.get("task_id") == task_id:
                    self.s.save_task({"task_id": task_id, "history_ts": r.get("ts"), "in_history": True})
                    return r
        except ApiError:
            return None
        return None

    # ---------------- cloning ----------------
    def upload(self, path: str) -> dict:
        ext = os.path.splitext(path)[1].lower()
        if ext not in AUDIO_TYPES:
            raise ValidationError("Only MP3, WAV, M4A, OGG, OPUS, FLAC or AAC audio can be uploaded.", "unsupported_type")
        if not os.path.isfile(path):
            raise ValidationError("File not found.")
        size = os.path.getsize(path)
        if size == 0:
            raise ValidationError("The file is empty.")
        if size > MAX_UPLOAD_BYTES:
            raise ApiError(413, "too_large", "Upload exceeds the 100 MB limit.")
        with open(path, "rb") as f:
            data = f.read()
        raw = self.c.post_file("/v1/upload", "file", os.path.basename(path), data, AUDIO_TYPES[ext])
        url = raw.get("r2_url")
        if not isinstance(url, str) or not url:
            raise ApiError(502, "bad_response", "The upload did not return a file reference.")
        self.s.add_upload(url, os.path.basename(path))
        return {"r2_url": url}

    def clone(self, r2_url: str, name: str, engine: str = "el", gender=None, age=None, style=None, scenario=None) -> dict:
        if not self.s.has_upload(r2_url):
            raise ValidationError("Use a sample uploaded through this tool (unknown upload reference).")
        if not isinstance(name, str) or not name.strip():
            raise ValidationError("A voice name is required.")
        if engine not in ENGINES:
            raise ValidationError(f"engine must be one of {', '.join(ENGINES)}.")
        if engine not in self.unlocked_engines():
            raise ApiError(403, "engine_locked", f"The {engine} engine is locked on the current plan.")
        active = [t for t in self.s.tasks("clone") if t.get("status") in CLONE_ACTIVE | {"submitting", "uncertain"}]
        if active:
            raise ApiError(409, "duplicate", f"A clone is already in progress (task {active[0]['task_id']}).")
        payload = {"source_voice_file": r2_url, "name": name, "engine": engine}
        for k, v in (("gender", gender), ("age", age), ("style", style), ("scenario", scenario)):
            if v:
                payload[k] = v
        pending = "pending-clone-" + hashlib.sha256((r2_url + name + engine).encode()).hexdigest()[:12]
        self.s.save_task({"task_id": pending, "kind": "clone", "status": "submitting", "engine": engine, "name": name, "created": self.clock()})
        try:
            raw = self.c.post_json("/v1/clone", payload)
        except ApiError as e:
            self.s.save_task({"task_id": pending, "status": "uncertain" if e.uncertain else "rejected", "error": e.message})
            raise
        task_id = raw.get("task_id")
        if not isinstance(task_id, str) or not task_id:
            self.s.save_task({"task_id": pending, "status": "rejected", "error": "no task id"})
            raise ApiError(502, "bad_response", "The clone did not return a task id.")
        self.s.save_task({"task_id": pending, "status": "submitted", "upstream_task_id": task_id})
        self.s.save_task({"task_id": task_id, "kind": "clone", "status": "queued", "engine": engine, "name": name, "created": self.clock()})
        return {"task_id": task_id, "status": "queued"}

    def poll_clone(self, task_id: str, deadline_s: float = 900.0, interval: float = 2.5, once: bool = False) -> dict:
        task = self.s.get_task(task_id)
        if not task or task.get("kind") != "clone":
            raise ApiError(404, "not_found", "Unknown clone task.")
        if task["status"] in CLONE_TERMINAL:
            return self._public_task(task)
        end = self.clock() + deadline_s
        while True:
            raw = self.c.get("/v1/clone/status/" + path_param(task_id), budget_kind="poll")
            st = raw.get("status")
            if st == "completed":
                vid = raw.get("voice_id")
                if not isinstance(vid, str) or not vid:
                    task = self.s.save_task({"task_id": task_id, "status": "unknown"})
                else:
                    task = self.s.save_task({"task_id": task_id, "status": "completed", "voice_id": vid})
                    self.s.add_voice(vid, task.get("engine", ""), task.get("name", ""), task_id)
                    self.s.cache_drop("my_voices")
                    return self._public_task(task)
            elif st in ("failed", "cancelled"):
                task = self.s.save_task({"task_id": task_id, "status": st, "error": str(raw.get("error") or f"Clone {st}.")[:300]})
                return self._public_task(task)
            elif st in ("queued", "processing"):
                task = self.s.save_task({"task_id": task_id, "status": st})
            else:
                task = self.s.save_task({"task_id": task_id, "status": "unknown"})
            if once or self.clock() + interval > end:
                out = self._public_task(task)
                out["resumable"] = True
                return out
            self.sleep(interval)

    # ---------------- voice management ----------------
    def carry(self, voice_id: str, target: str, deadline_s: float = 900.0) -> dict:
        if target not in ENGINES:
            raise ValidationError(f"target must be one of {', '.join(ENGINES)}.")
        self._owned_voice(voice_id)
        if target not in self.unlocked_engines():
            raise ApiError(403, "engine_locked", f"The {target} engine is locked on the current plan.")
        for _ in range(2):
            raw = self.c.post_json("/v1/carry", {"voice": voice_id, "target": target})
            if raw.get("status") == "ready" and isinstance(raw.get("voice_id"), str):
                self.s.add_voice(raw["voice_id"], raw.get("engine") or target, source_task="carry")
                self.s.cache_drop("my_voices")
                return {"status": "ready", "voice_id": raw["voice_id"], "engine": raw.get("engine") or target}
            if raw.get("status") == "cloning" and isinstance(raw.get("tid"), str):
                self.s.save_task({"task_id": raw["tid"], "kind": "clone", "status": "queued", "engine": target, "name": "carry", "created": self.clock()})
                res = self.poll_clone(raw["tid"], deadline_s=deadline_s)
                if res["status"] != "completed":
                    return {"status": res["status"], "task_id": raw["tid"], "resumable": res.get("resumable", False)}
                continue
            raise ApiError(502, "bad_response", "Unexpected carry response.")
        return {"status": "unknown", "message": "Carry did not report ready; check your voices before trying again."}

    def rename(self, voice_id: str, name: str) -> dict:
        if not isinstance(name, str) or not name.strip() or len(name) > 60:
            raise ValidationError("Name must be 1-60 characters.")
        v = self._owned_voice(voice_id)
        payload = {"voice_id": voice_id, "name": name}
        if v.get("engine") in ENGINES:
            payload["engine"] = v["engine"]
        raw = self.c.post_json("/v1/voices/rename", payload)
        self.s.cache_drop("my_voices")
        return {"ok": raw.get("ok") is True, "name": raw.get("name", name)}

    def delete_voice(self, voice_id: str, confirm: bool = False) -> dict:
        if confirm is not True:
            raise ValidationError("Deleting a voice is permanent; confirm explicitly.", "confirmation_required")
        self._owned_voice(voice_id)
        raw = self.c.delete("/v1/voices/" + path_param(voice_id))
        self.s.remove_voice(voice_id)
        self.s.cache_drop("my_voices")
        return {"success": raw.get("success") is True}

    # ---------------- download (provider-returned URLs only, never sends the key) ----------------
    @staticmethod
    def download(task: dict, out_path: str, opener=urllib.request.urlopen, timeout: float = 120.0) -> str:
        url = task.get("audio_url")
        if not isinstance(url, str) or urllib.parse.urlparse(url).scheme != "https":
            raise ValidationError("No downloadable https audio for this task.")
        with opener(urllib.request.Request(url, headers={"User-Agent": "turab-pipeline/1.0"}), timeout=timeout) as r:
            data = r.read()
        with open(out_path, "wb") as f:
            f.write(data)
        return out_path
