#!/usr/bin/env python3
"""ElevenLabsOfficial voice tool for the Turab pipeline (single owner, server-side only).

Examples (the key comes from ELEVENLABSOFFICIAL_API_KEY in the environment, never from arguments):
  python3 tools/elevenlabsofficial/cli.py check
  python3 tools/elevenlabsofficial/cli.py library --q documentary --per 20
  python3 tools/elevenlabsofficial/cli.py voices
  python3 tools/elevenlabsofficial/cli.py tts --voice VOICE_ID --file shorts/x/script.txt --async --out voice.mp3
  python3 tools/elevenlabsofficial/cli.py tts-status TASK_ID --out voice.mp3
  python3 tools/elevenlabsofficial/cli.py upload sample.mp3
  python3 tools/elevenlabsofficial/cli.py clone --sample R2_URL --name "Narrator" --engine el
  python3 tools/elevenlabsofficial/cli.py clone-status TASK_ID
  python3 tools/elevenlabsofficial/cli.py history --mine
  python3 tools/elevenlabsofficial/cli.py delete VOICE_ID --yes

Paid actions (tts, clone, carry) always ask for confirmation unless --yes is given.
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from client import ApiError, Client, ClientConfig, ConfigError  # noqa: E402
from service import ENGINES, Service  # noqa: E402
from store import Deferred, RateBudget, Store  # noqa: E402


def build_service() -> Service:
    store = Store()
    client = Client(ClientConfig.from_env())
    svc = Service(client, store)
    client.budget = RateBudget(store, svc.cached_rate_limit)
    return svc


def _confirm(msg: str, yes: bool) -> bool:
    if yes:
        return True
    if not sys.stdin.isatty():
        print("Refusing to run a paid/destructive action without --yes in a non-interactive shell.", file=sys.stderr)
        return False
    return input(f"{msg} [y/N] ").strip().lower() in ("y", "yes")


def _out(obj) -> None:
    print(json.dumps(obj, indent=2, ensure_ascii=False))


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-v", "--verbose", action="store_true")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("check", help="connection check: plan, credits, limits, engines (GET /v1/me)")
    p = sub.add_parser("library", help="search the shared Explore catalog")
    for k in ("q", "lang", "gender", "age", "category"):
        p.add_argument("--" + k)
    p.add_argument("--page", type=int, default=1)
    p.add_argument("--per", type=int, default=50)
    sub.add_parser("voices", help="your cloned voices")
    p = sub.add_parser("tts", help="generate speech (paid)")
    p.add_argument("--voice", required=True)
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--text")
    g.add_argument("--file")
    p.add_argument("--engine", default="el", choices=ENGINES)
    p.add_argument("--speed", type=float)
    for k in ("stability", "similarity", "style"):
        p.add_argument("--" + k, type=float)
    p.add_argument("--model")
    p.add_argument("--async", dest="async_", action="store_true")
    p.add_argument("--out", help="save the MP3 here when done")
    p.add_argument("--yes", action="store_true")
    p = sub.add_parser("tts-status", help="poll / resume a generation")
    p.add_argument("task_id")
    p.add_argument("--once", action="store_true")
    p.add_argument("--out")
    p = sub.add_parser("upload", help="upload a clone sample (audio, max 100 MB)")
    p.add_argument("path")
    p = sub.add_parser("clone", help="clone a voice from an uploaded sample (paid)")
    p.add_argument("--sample", required=True, help="r2_url returned by `upload`")
    p.add_argument("--name", required=True)
    p.add_argument("--engine", default="el", choices=ENGINES)
    for k in ("gender", "age", "style", "scenario"):
        p.add_argument("--" + k)
    p.add_argument("--yes", action="store_true")
    p = sub.add_parser("clone-status", help="poll / resume a clone")
    p.add_argument("task_id")
    p.add_argument("--once", action="store_true")
    p = sub.add_parser("history", help="recent completed generations")
    p.add_argument("--mine", action="store_true", help="only tasks started from this machine")
    p = sub.add_parser("carry", help="prepare one of your clones on another engine")
    p.add_argument("voice_id")
    p.add_argument("--target", required=True, choices=ENGINES)
    p.add_argument("--yes", action="store_true")
    p = sub.add_parser("rename")
    p.add_argument("voice_id")
    p.add_argument("--name", required=True)
    p = sub.add_parser("delete", help="permanently delete one of your voices")
    p.add_argument("voice_id")
    p.add_argument("--yes", action="store_true")
    p = sub.add_parser("forget", help="clear a stuck/uncertain local task after checking history")
    p.add_argument("task_id")
    a = ap.parse_args(argv)
    logging.basicConfig(level=logging.INFO if a.verbose else logging.WARNING, format="%(levelname)s %(message)s")

    try:
        svc = build_service()
        if a.cmd == "check":
            _out(svc.check_connection())
        elif a.cmd == "library":
            _out(svc.library(a.q, a.lang, a.gender, a.age, a.category, a.page, a.per))
        elif a.cmd == "voices":
            _out(svc.my_voices(refresh=True))
        elif a.cmd == "tts":
            text = a.text if a.text is not None else open(a.file, encoding="utf-8").read()
            if not _confirm(f"Generate {len(text)} characters with {a.engine} (uses credits)?", a.yes):
                return 1
            adv = {k: getattr(a, k) for k in ("stability", "similarity", "style", "model")}
            res = svc.tts(text, a.voice, a.engine, a.speed, async_=a.async_, **adv)
            if res["status"] != "completed":
                res = svc.poll_tts(res["task_id"])
            if res.get("status") == "completed" and a.out:
                svc.download(res, a.out)
                res["saved_to"] = a.out
            _out(res)
        elif a.cmd == "tts-status":
            res = svc.poll_tts(a.task_id, once=a.once)
            if res.get("status") == "completed" and a.out:
                svc.download(res, a.out)
                res["saved_to"] = a.out
            _out(res)
        elif a.cmd == "upload":
            _out(svc.upload(a.path))
        elif a.cmd == "clone":
            if not _confirm(f"Start cloning '{a.name}' on {a.engine}?", a.yes):
                return 1
            res = svc.clone(a.sample, a.name, a.engine, a.gender, a.age, a.style, a.scenario)
            _out(svc.poll_clone(res["task_id"]))
        elif a.cmd == "clone-status":
            _out(svc.poll_clone(a.task_id, once=a.once))
        elif a.cmd == "history":
            info = svc.me()
            rows = svc.history(mine_only=a.mine)
            _out({"history_kept": info.get("history_kept"), "rows": rows})
        elif a.cmd == "carry":
            if not _confirm(f"Prepare {a.voice_id} on {a.target}?", a.yes):
                return 1
            _out(svc.carry(a.voice_id, a.target))
        elif a.cmd == "rename":
            _out(svc.rename(a.voice_id, a.name))
        elif a.cmd == "delete":
            if not _confirm(f"Permanently delete voice {a.voice_id}?", a.yes):
                return 1
            _out(svc.delete_voice(a.voice_id, confirm=True))
        elif a.cmd == "forget":
            svc.forget(a.task_id)
            _out({"ok": True})
        return 0
    except ConfigError as e:
        print(f"Configuration error: {e}", file=sys.stderr)
        return 2
    except Deferred as e:
        print(f"Rate budget used up; try again in {e.wait:.0f}s.", file=sys.stderr)
        return 3
    except ApiError as e:
        _out({"error": e.to_dict()})
        return 4
    except OSError as e:  # audio download failed; the generation itself is saved and can be fetched again
        print(f"Download failed ({type(e).__name__}). The task is saved: run `tts-status TASK_ID --out FILE` to retry "
              "(check that the audio host is allowed by the network).", file=sys.stderr)
        return 5


if __name__ == "__main__":
    sys.exit(main())
