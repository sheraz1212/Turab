# ElevenLabsOfficial voice tool

Server-side Python tool (standard library only) for the ElevenLabsOfficial Developer API
(`https://elevenlabsofficial.com`, spec `/v1/openapi.json`, pinned copy in `tests/fixtures/openapi.json`).
It is a **single-owner** command-line tool for the Turab video pipeline: it turns a short's `script.txt`
into `voice.mp3`, searches voices, clones voices and shows credits/history. There is no browser or mobile
client, so the key never leaves the machine that runs the command.

## Configuration

| Variable | Required | Where to set it |
|---|---|---|
| `ELEVENLABSOFFICIAL_API_KEY` | yes | Server environment only (see below). Never in the repo, chat, URLs or CLI arguments. |
| `ELEVENLABSOFFICIAL_BASE_URL` | no (default `https://elevenlabsofficial.com`) | Same place. Must be a bare https origin. |
| `ELEVENLABSOFFICIAL_STATE_DIR` | no (default `~/.cache/elevenlabsofficial`) | Local task/ownership/cache state. |

Where to put the key:
- **Claude Code cloud session:** claude.ai → Code → environment **Turab** → Settings → environment variables:
  add `ELEVENLABSOFFICIAL_API_KEY`. (Or store it as a network secret for host `elevenlabsofficial.com`;
  then set the variable to any placeholder, the proxy injects the real header.)
- **Your own computer:** a shell profile or a git-ignored `.env` you `source` before running. `.env.example`
  in the repo root lists the names only.

Rotating the key: create a new key on the provider site, replace the value in the place above, run
`cli.py check`, then revoke the old key. Nothing in the repo changes.

## Commands

```
python3 tools/elevenlabsofficial/cli.py check                      # plan, credits, limits, unlocked engines
python3 tools/elevenlabsofficial/cli.py library --q calm --per 20  # shared Explore catalog (per <= 100)
python3 tools/elevenlabsofficial/cli.py voices                     # your clones
python3 tools/elevenlabsofficial/cli.py tts --voice VOICE_ID --file shorts/x/script.txt --async --out voice.mp3
python3 tools/elevenlabsofficial/cli.py tts-status TASK_ID --out voice.mp3   # resume after a timeout/restart
python3 tools/elevenlabsofficial/cli.py upload sample.wav           # -> r2_url
python3 tools/elevenlabsofficial/cli.py clone --sample R2_URL --name Narrator --engine el
python3 tools/elevenlabsofficial/cli.py clone-status TASK_ID
python3 tools/elevenlabsofficial/cli.py history --mine
python3 tools/elevenlabsofficial/cli.py carry VOICE_ID --target elpro
python3 tools/elevenlabsofficial/cli.py rename VOICE_ID --name "New name"
python3 tools/elevenlabsofficial/cli.py delete VOICE_ID --yes      # permanent, asks unless --yes
python3 tools/elevenlabsofficial/cli.py forget TASK_ID             # clear a stuck/uncertain record after checking history
```

`tts`, `clone`, `carry` cost credits and ask for confirmation (or `--yes`).

## Behaviour

- **Limits come from `/v1/me`** (cached 60 s): characters per generation, concurrent jobs, rate limit,
  history retention and which engines are unlocked. Nothing is hardcoded. Credits may be a number or
  `unlimited` (any case); the tool never calculates a balance, it shows `credits_left` / refreshes `/v1/me`.
- **Validation before paying:** engine unlocked, text length, Latin-only text for `cartesia`, speed 0.5–2.0,
  `stability/similarity/style` only on elpro/hailuo/cartesia (sent with `advanced=1`), `model` only on elpro.
- **voice_id is opaque:** stored and sent byte-for-byte; URL-encoded only inside a path.
- **Async jobs** are saved before polling, polled every 2.5 s through one shared per-minute budget
  (submissions leave ~25 % of `rate_limit_per_min` free for polls; the budget is shared by every process via
  a lock file). After the local deadline the job stays `processing`/`unknown` and is resumable with
  `tts-status` / `clone-status`; it is never marked failed locally.
- **Retries:** only GET requests are retried (network errors, 429, 502, 503), max 4 attempts / 45 s,
  `Retry-After` honoured, otherwise exponential backoff with jitter. POST/DELETE are never retried; an
  uncertain delivery is recorded and blocks an identical resubmit until you check history and `forget` it.
- **Clones:** only MP3/WAV/M4A/OGG/OPUS/FLAC/AAC up to 100 MB; only `r2_url`s returned by this tool's own
  upload can be cloned; one clone at a time locally, and the server's 429 message is shown as-is.
- **Errors** are normalised to `{status, code, message, retryable}`; messages never contain the key.
- **Downloads** of finished audio never send the API key (it only goes to the base URL).

## Tests

```
python3 -m unittest discover -s tools/elevenlabsofficial/tests -v        # offline, mocked, free
ELEVENLABSOFFICIAL_LIVE_TESTS=1 python3 -m unittest discover -s tools/elevenlabsofficial/tests -k Live
```
The live tests are read-only: they fetch the public OpenAPI spec and, only if the key is already set,
call `GET /v1/me`. No test generates audio, clones, deletes or deploys anything.
