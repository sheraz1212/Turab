"""Server-side HTTP client for the ElevenLabsOfficial Developer API (/v1 only).

The API key is read from the ELEVENLABSOFFICIAL_API_KEY environment variable and is only ever
sent to ELEVENLABSOFFICIAL_BASE_URL. It is never logged, never put in a URL and never included in
an error message. Only GET requests are retried automatically; POST/DELETE requests are never
retried after an uncertain failure because the first attempt may already have succeeded.
"""
from __future__ import annotations

import json
import logging
import os
import random
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

log = logging.getLogger("elevenlabsofficial")

ENV_BASE_URL = "ELEVENLABSOFFICIAL_BASE_URL"
ENV_API_KEY = "ELEVENLABSOFFICIAL_API_KEY"
DEFAULT_BASE_URL = "https://elevenlabsofficial.com"

# Every upstream operation this integration is allowed to call (documented in the OpenAPI spec).
ALLOWED_OPERATIONS = {
    ("GET", "/v1/me"),
    ("GET", "/v1/library"),
    ("GET", "/v1/voices"),
    ("POST", "/v1/tts"),
    ("GET", "/v1/tts/result/{task_id}"),
    ("POST", "/v1/upload"),
    ("POST", "/v1/clone"),
    ("GET", "/v1/clone/status/{task_id}"),
    ("GET", "/v1/history"),
    ("POST", "/v1/carry"),
    ("POST", "/v1/voices/rename"),
    ("DELETE", "/v1/voices/{voice_id}"),
}

ERROR_CODES = {
    400: "bad_request",
    401: "unauthorized",
    402: "insufficient_credits",
    403: "forbidden",
    404: "not_found",
    409: "sample_missing",
    413: "too_large",
    429: "rate_limited",
    502: "upstream_failed",
    503: "unavailable",
}
RETRYABLE_GET_STATUSES = {429, 502, 503}
SENSITIVE_HEADERS = {"authorization", "cookie", "set-cookie", "x-api-key", "proxy-authorization"}


class ConfigError(Exception):
    """The integration is not configured (missing/invalid environment variables)."""


@dataclass
class ApiError(Exception):
    """Safe, normalized failure. `message` never contains secrets or request details."""

    status: int
    code: str
    message: str
    retryable: bool = False
    retry_after: Optional[float] = None
    upstream_status: Optional[int] = None
    uncertain: bool = False  # request may have been delivered (do not resubmit blindly)

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"{self.code} ({self.status}): {self.message}"

    def to_dict(self) -> dict:
        return {"status": self.status, "code": self.code, "message": self.message, "retryable": self.retryable}


class TransportError(Exception):
    """Network failure or timeout: the request may or may not have reached the server."""


@dataclass
class Response:
    status: int
    headers: dict
    body: bytes


Transport = Callable[[str, str, dict, Optional[bytes], float], Response]


def redact_headers(headers: dict) -> dict:
    return {k: ("[REDACTED]" if k.lower() in SENSITIVE_HEADERS else v) for k, v in headers.items()}


def urllib_transport(method: str, url: str, headers: dict, body: Optional[bytes], timeout: float) -> Response:
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return Response(r.status, {k.lower(): v for k, v in r.headers.items()}, r.read())
    except urllib.error.HTTPError as e:
        return Response(e.code, {k.lower(): v for k, v in (e.headers or {}).items()}, e.read() or b"")
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise TransportError(type(e).__name__) from None


def _template_for(path: str) -> str:
    for pat, tpl in (
        (r"^/v1/tts/result/[^/]+$", "/v1/tts/result/{task_id}"),
        (r"^/v1/clone/status/[^/]+$", "/v1/clone/status/{task_id}"),
        (r"^/v1/voices/(?!rename$)[^/]+$", "/v1/voices/{voice_id}"),
    ):
        if re.match(pat, path):
            return tpl
    return path


def path_param(value: str) -> str:
    """URL-encode an opaque id for use in a path without altering the stored value."""
    if not isinstance(value, str) or value == "":
        raise ApiError(400, "bad_request", "A non-empty id is required.")
    return urllib.parse.quote(value, safe="")


def _parse_retry_after(v: Optional[str]) -> Optional[float]:
    if not v:
        return None
    try:
        return max(0.0, float(v))
    except ValueError:
        return None


def _safe_message(status: int, body: bytes, secret: str) -> str:
    if status == 401:
        return f"The API key is missing, invalid or revoked. Check {ENV_API_KEY} in the server environment."
    msg = ""
    try:
        data = json.loads(body.decode("utf-8") or "{}")
        if isinstance(data, dict) and isinstance(data.get("error"), str):
            msg = data["error"]
    except (ValueError, UnicodeDecodeError):
        msg = ""
    if not msg:
        msg = {402: "Not enough credits.", 403: "Not allowed on this plan or account.", 404: "Resource not found.",
               409: "The original clone sample is unavailable.", 413: "Upload exceeds the 100 MB limit.",
               429: "Rate, concurrency or clone limit reached. Try again later.", 502: "The engine failed; nothing was charged.",
               503: "The engine is temporarily unavailable."}.get(status, "The request failed.")
    if secret and secret in msg:
        msg = msg.replace(secret, "[REDACTED]")
    msg = re.sub(r"(?i)bearer\s+\S+", "Bearer [REDACTED]", msg)
    return msg[:300]


@dataclass
class ClientConfig:
    base_url: str
    api_key: str
    connect_timeout: float = 10.0
    read_timeout: float = 120.0
    max_get_attempts: int = 4
    max_retry_elapsed: float = 45.0
    backoff_base: float = 1.0
    backoff_cap: float = 15.0

    @classmethod
    def from_env(cls, env: Optional[dict] = None, **kw) -> "ClientConfig":
        env = os.environ if env is None else env
        key = env.get(ENV_API_KEY, "")
        base = (env.get(ENV_BASE_URL) or DEFAULT_BASE_URL).rstrip("/")
        if not key:
            raise ConfigError(f"{ENV_API_KEY} is not set in the server environment.")
        p = urllib.parse.urlparse(base)
        local = p.hostname in ("localhost", "127.0.0.1")
        if p.scheme != "https" and not (local and p.scheme == "http"):
            raise ConfigError(f"{ENV_BASE_URL} must be an https URL.")
        if p.path not in ("", "/") or p.query or p.fragment:
            raise ConfigError(f"{ENV_BASE_URL} must be a bare origin such as {DEFAULT_BASE_URL}.")
        return cls(base_url=base, api_key=key, **kw)


@dataclass
class Client:
    config: ClientConfig
    transport: Transport = urllib_transport
    sleep: Callable[[float], None] = time.sleep
    clock: Callable[[], float] = time.monotonic
    rand: Callable[[], float] = random.random
    budget: Any = None  # optional RateBudget-like object with acquire(kind) -> None

    def __repr__(self) -> str:  # never show the key
        return f"Client(base_url={self.config.base_url!r})"

    # ---------------- public helpers ----------------
    def get(self, path: str, params: Optional[dict] = None, budget_kind: str = "read") -> Any:
        return self.request("GET", path, params=params, budget_kind=budget_kind)

    def post_json(self, path: str, payload: dict, budget_kind: str = "submit") -> Any:
        return self.request("POST", path, json_body=payload, budget_kind=budget_kind)

    def delete(self, path: str) -> Any:
        return self.request("DELETE", path, budget_kind="submit")

    def post_file(self, path: str, field_name: str, filename: str, content: bytes, content_type: str) -> Any:
        boundary = "----elo" + uuid.uuid4().hex
        safe_name = re.sub(r'[\r\n"]', "_", filename)
        body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"{field_name}\"; filename=\"{safe_name}\"\r\n"
                f"Content-Type: {content_type}\r\n\r\n").encode() + content + f"\r\n--{boundary}--\r\n".encode()
        return self.request("POST", path, raw_body=body, content_type=f"multipart/form-data; boundary={boundary}", budget_kind="submit")

    # ---------------- core ----------------
    def request(self, method: str, path: str, *, params: Optional[dict] = None, json_body: Optional[dict] = None,
                raw_body: Optional[bytes] = None, content_type: Optional[str] = None, budget_kind: str = "read") -> Any:
        method = method.upper()
        if (method, _template_for(path)) not in ALLOWED_OPERATIONS:
            raise ApiError(400, "not_allowed", "This operation is not part of the integration.")
        url = self.config.base_url + path
        if params:
            q = {k: v for k, v in params.items() if v is not None and v != ""}
            if q:
                url += "?" + urllib.parse.urlencode(q)
        headers = {"Authorization": f"Bearer {self.config.api_key}", "Accept": "application/json",
                   "User-Agent": "turab-pipeline/1.0"}
        body = raw_body
        if json_body is not None:
            body = json.dumps(json_body).encode("utf-8")
            headers["Content-Type"] = "application/json"
        elif content_type:
            headers["Content-Type"] = content_type
        idempotent = method == "GET"
        attempts = self.config.max_get_attempts if idempotent else 1
        start = self.clock()
        timeout = self.config.connect_timeout + self.config.read_timeout
        attempt = 0
        while True:
            attempt += 1
            if self.budget is not None:
                self.budget.acquire(budget_kind)
            t0 = self.clock()
            try:
                resp = self.transport(method, url, headers, body, timeout)
            except TransportError:
                log.warning("upstream %s %s transport error (attempt %d)", method, _template_for(path), attempt)
                if idempotent and attempt < attempts and self.clock() - start < self.config.max_retry_elapsed:
                    self.sleep(self._backoff(attempt, None))
                    continue
                if idempotent:
                    raise ApiError(503, "network_error", "Could not reach the voice service. Try again shortly.", retryable=True)
                raise ApiError(0, "uncertain", "The request may or may not have been received. Check the task status or "
                               "history before submitting again.", retryable=False, uncertain=True)
            log.info("upstream %s %s -> %d in %.2fs", method, _template_for(path), resp.status, self.clock() - t0)
            if 200 <= resp.status < 300:
                if not resp.body:
                    return {}
                try:
                    return json.loads(resp.body.decode("utf-8"))
                except (ValueError, UnicodeDecodeError):
                    raise ApiError(502, "bad_response", "The voice service returned an unreadable response.", upstream_status=resp.status)
            retry_after = _parse_retry_after(resp.headers.get("retry-after"))
            err = ApiError(status=resp.status, code=ERROR_CODES.get(resp.status, "upstream_error"),
                           message=_safe_message(resp.status, resp.body, self.config.api_key),
                           retryable=resp.status in RETRYABLE_GET_STATUSES, retry_after=retry_after, upstream_status=resp.status)
            if idempotent and resp.status in RETRYABLE_GET_STATUSES and attempt < attempts:
                delay = self._backoff(attempt, retry_after)
                if self.clock() - start + delay <= self.config.max_retry_elapsed:
                    self.sleep(delay)
                    continue
            raise err

    def _backoff(self, attempt: int, retry_after: Optional[float]) -> float:
        if retry_after is not None:
            return retry_after  # honored exactly; the caller stops if it exceeds the elapsed cap
        exp = min(self.config.backoff_cap, self.config.backoff_base * (2 ** (attempt - 1)))
        return exp * (0.5 + 0.5 * self.rand())  # jitter in [exp/2, exp]
