"""Local state for the single-owner integration: task records (resume after restart), uploads,
owned voices, a short-TTL cache and a shared per-minute request budget.

Everything lives in one JSON file guarded by an exclusive file lock, so several CLI processes on the
same machine share one account-level budget and never double-poll the same task. No secret is stored.
"""
from __future__ import annotations

import fcntl
import json
import os
import time
from contextlib import contextmanager
from typing import Any, Callable, Optional

DEFAULT_STATE_DIR = os.path.join(os.path.expanduser("~"), ".cache", "elevenlabsofficial")


class Deferred(Exception):
    """The shared rate budget is used up; try again after `wait` seconds."""

    def __init__(self, wait: float):
        super().__init__(f"rate budget exhausted, retry in {wait:.1f}s")
        self.wait = wait


class Store:
    def __init__(self, state_dir: Optional[str] = None, clock: Callable[[], float] = time.time):
        self.dir = state_dir or os.environ.get("ELEVENLABSOFFICIAL_STATE_DIR") or DEFAULT_STATE_DIR
        os.makedirs(self.dir, mode=0o700, exist_ok=True)
        self.path = os.path.join(self.dir, "state.json")
        self.lock_path = os.path.join(self.dir, "state.lock")
        self.clock = clock

    @contextmanager
    def tx(self):
        with open(self.lock_path, "a+") as lf:
            fcntl.flock(lf, fcntl.LOCK_EX)
            try:
                try:
                    with open(self.path) as f:
                        data = json.load(f)
                except (FileNotFoundError, ValueError):
                    data = {}
                for k in ("tasks", "uploads", "voices", "cache", "calls"):
                    data.setdefault(k, {} if k != "calls" else [])
                yield data
                tmp = self.path + ".tmp"
                with open(tmp, "w") as f:
                    json.dump(data, f, indent=1)
                os.replace(tmp, self.path)
            finally:
                fcntl.flock(lf, fcntl.LOCK_UN)

    # ---- tasks ----
    def save_task(self, task: dict) -> dict:
        with self.tx() as d:
            d["tasks"][task["task_id"]] = {**d["tasks"].get(task["task_id"], {}), **task, "updated": self.clock()}
            return dict(d["tasks"][task["task_id"]])

    def get_task(self, task_id: str) -> Optional[dict]:
        with self.tx() as d:
            t = d["tasks"].get(task_id)
            return dict(t) if t else None

    def tasks(self, kind: Optional[str] = None) -> list:
        with self.tx() as d:
            return [dict(t) for t in d["tasks"].values() if kind is None or t.get("kind") == kind]

    # ---- uploads / voices ----
    def add_upload(self, r2_url: str, filename: str) -> None:
        with self.tx() as d:
            d["uploads"][r2_url] = {"filename": filename, "ts": self.clock()}

    def has_upload(self, r2_url: str) -> bool:
        with self.tx() as d:
            return r2_url in d["uploads"]

    def add_voice(self, voice_id: str, engine: str, name: str = "", source_task: str = "") -> None:
        with self.tx() as d:
            d["voices"][voice_id] = {"engine": engine, "name": name, "source_task": source_task, "ts": self.clock()}

    def remove_voice(self, voice_id: str) -> None:
        with self.tx() as d:
            d["voices"].pop(voice_id, None)

    def voices(self) -> dict:
        with self.tx() as d:
            return dict(d["voices"])

    # ---- cache ----
    def cache_get(self, key: str, ttl: float) -> Any:
        with self.tx() as d:
            e = d["cache"].get(key)
            if e and self.clock() - e["ts"] <= ttl:
                return e["value"]
            return None

    def cache_put(self, key: str, value: Any, max_entries: int = 50) -> None:
        with self.tx() as d:
            d["cache"][key] = {"ts": self.clock(), "value": value}
            if len(d["cache"]) > max_entries:
                for k in sorted(d["cache"], key=lambda k: d["cache"][k]["ts"])[: len(d["cache"]) - max_entries]:
                    del d["cache"][k]

    def cache_drop(self, prefix: str) -> None:
        with self.tx() as d:
            for k in [k for k in d["cache"] if k.startswith(prefix)]:
                del d["cache"][k]


class RateBudget:
    """Account-level sliding-window budget shared by every process using the same state dir.

    Submissions may use at most `limit - reserve` calls per minute so result polls always have room.
    `limit_fn` returns the live rate_limit_per_min from /v1/me (or None when unknown).
    """

    def __init__(self, store: Store, limit_fn: Callable[[], Optional[int]], sleep: Callable[[float], None] = time.sleep,
                 max_wait: float = 65.0, default_limit: int = 10):
        self.store, self.limit_fn, self.sleep, self.max_wait, self.default_limit = store, limit_fn, sleep, max_wait, default_limit

    def _limit(self) -> int:
        try:
            v = self.limit_fn()
        except Exception:
            v = None
        return v if isinstance(v, int) and v > 0 else self.default_limit

    def try_acquire(self, kind: str) -> float:
        """Record a call and return 0, or return how long to wait without recording."""
        limit = self._limit()
        reserve = max(1, limit // 4) if limit > 2 else 0
        cap = limit if kind in ("poll", "read") else limit - reserve
        cap = max(1, cap)
        now = self.store.clock()
        with self.store.tx() as d:
            calls = [c for c in d["calls"] if now - c < 60.0]
            if len(calls) < cap:
                calls.append(now)
                d["calls"] = calls
                return 0.0
            d["calls"] = calls
            return max(0.05, 60.0 - (now - calls[len(calls) - cap]))

    def acquire(self, kind: str) -> None:
        waited = 0.0
        while True:
            w = self.try_acquire(kind)
            if w <= 0:
                return
            if waited + w > self.max_wait:
                raise Deferred(w)
            self.sleep(w)
            waited += w
