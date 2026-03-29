# CLI App Analysis — Issues & Gaps

> Package: `packages/opencode/`
> Generated: 2026-03-27
> Original verification claim: 2026-03-27 (all 102 entries triple-checked against source)
> Current verification status: 2026-03-28 row-by-row revalidation completed against current source. Statuses below distinguish confirmed issues, partial confirmations, confirmed gaps, and corrected/refuted entries. Historical summary counts were not recomputed in this pass.
> Scope: CLI entry point, commands, tools, session management, agent logic, HTTP server, providers, config, storage, auth, bus, permission, PTY, worktree

---

## 2026-03-28 Revalidation Note

This document appears materially credible, and by the end of this pass every issue row was re-reviewed against current source.

What was directly re-verified against current source on 2026-03-28:

- **Confirmed true:** 1.1, 1.2, 1.4, 1.5, 1.7, 1.8, 1.9, 1.10, 1.13, 2.2, 2.3, 2.4, 2.6, 2.7, 2.10, 2.11
- **Confirmed true:** 3.1, 3.2, 3.3, 3.4, 3.8, 3.9, 3.11
- **Confirmed true:** 4.1, 4.2, 4.3, 4.5
- **Confirmed true:** 5.1, 5.2, 5.3, 5.4, 5.5, 5.8, 5.9, 5.10, 5.12, 5.13, 5.14, 5.15
- **Confirmed true:** 6.1, 6.4, 6.5, 6.6, 6.8, 6.9, 6.10, 6.11, 6.13, 6.14
- **Confirmed true:** 7.2, 7.5, 7.6, 7.7, 7.13, 7.14
- **Confirmed true:** 7.11, 7.12
- **Confirmed true:** 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.8, 8.9, 8.11, 8.12, 8.13, 8.14, 8.15, 8.16
- **Confirmed true:** 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 10.1, 10.2, 10.3, 10.5, 10.8, 10.9, 10.10, 10.11, 10.12, 10.14, 10.16, 10.17, 10.18, 10.19, 10.20, 10.21
- **Confirmed true:** 11.2, 11.4, 11.5, 11.7, 11.8
- **Partially confirmed / wording stronger than re-check proved:** 1.6, 2.5, 3.5, 3.7, 4.7, 4.8, 5.6, 5.7, 6.2, 6.3, 6.7, 7.1, 7.8, 7.9, 8.7, 10.4, 11.3
- **Refuted / corrected in this pass:** 1.3, 1.11, 1.12, 2.1, 2.9, 3.6, 3.10, 5.11, 5.16, 7.3, 7.4, 7.10, 8.10, 11.6, 11.9
- **Still treated as a real gap, but inherently architectural rather than a code defect:** 2.8, 6.12, 10.6, 10.7, 10.13, 10.15, 11.1

The summary counts below should therefore be read as the **original audit's counts**, not as counts re-confirmed on 2026-03-28.

### Re-verified Entries

| # | Status | Notes |
| --- | --- | --- |
| 1.1 | Confirmed | `server/server.ts` still skips auth when `KILO_SERVER_PASSWORD` is unset |
| 1.2 | Confirmed | `tool/webfetch.ts` still validates only scheme and does not block localhost/private IP targets |
| 1.3 | Refuted | `tool/bash.ts` still passes interpolated args through Bun's tagged `$` template rather than raw string concatenation, so the original command-injection wording does not hold |
| 1.4 | Confirmed | `tool/registry.ts` still dynamically imports `{tool,tools}/*.{js,ts}` from configured directories |
| 1.5 | Confirmed | `tool/registry.ts` still passes plugin args as `any` to plugin `execute()` |
| 1.6 | Partially confirmed | `Provider.Info` still includes optional `key`, and `/config/providers` still returns `Provider.Info[]`; downstream sanitization was not fully re-traced in this pass |
| 1.7 | Confirmed | `auth/index.ts` still uses read-modify-write for `auth.json` with no locking |
| 1.8 | Confirmed | OAuth/API credentials are still stored directly in `auth.json` with file permissions but no encryption at rest |
| 1.9 | Confirmed | `cli/cmd/auth.ts` still logs/stops on failed auth without returning or throwing |
| 1.10 | Confirmed | `run.ts` still uses `kilo` while `tui/attach.ts` still uses `opencode` for basic auth |
| 1.11 | Corrected | `server/routes/file.ts` still routes reads/lists through `File.read()` / `File.list()`, which validate via `Instance.containsPath()`; the remaining concern is edge cases like symlink/cross-drive escapes, not a total lack of path checks |
| 1.12 | Corrected | `server/routes/kilocode.ts` still calls `Skill.remove(location)`, and the current implementation still validates removal targets against the registered skill set before deleting |
| 1.13 | Confirmed | No explicit request body size limit was found in current server initialization/middleware |
| 2.1 | Refuted | `ResolveMessage` still resolves as a Bun global in `src/index.ts`; the current runtime path does not require an explicit import |
| 2.2 | Confirmed | Multiple command handlers still call `process.exit()` directly before top-level cleanup can be guaranteed |
| 2.3 | Confirmed | `session/processor.ts` still retries retryable errors without a hard upper bound |
| 2.4 | Confirmed | `session/prompt.ts` still defaults `agent.steps` to `Infinity` |
| 2.5 | Partially confirmed | `session/compaction.ts` still turns compaction overflow into a context-overflow error and stops; the stronger claim that sessions are permanently stuck was not fully re-reproduced in this pass |
| 2.6 | Confirmed | `orchestration/integration.ts` still returns placeholder task output rather than executing an LLM task |
| 2.7 | Confirmed | `session/retry.ts` still matches only a narrow subset of rate-limit payload formats |
| 2.8 | Confirmed gap | No automatic cross-provider/model fallback path was found in the re-check; this remains an architectural gap |
| 2.9 | Refuted | `session/llm.ts` `onError` still logs, but stream errors are still surfaced to downstream processor handling; the callback is not swallowing failures by itself |
| 2.10 | Confirmed | `tool/task.ts` still swallows `Session.get(params.task_id)` errors via `.catch(() => {})` |
| 2.11 | Confirmed | `session/prompt.ts` still emits `StructuredOutputError` with `retries: 0` and stops without retrying |
| 3.1 | Confirmed | `bus/index.ts` still only flushes wildcard `*` subscribers in instance disposal; typed subscriptions are not cleaned there |
| 3.2 | Confirmed | `Bus.publish()` still logs every event at `info` level |
| 3.3 | Confirmed | `GlobalBus` is still a plain `EventEmitter` with no listener cap or lifecycle cleanup |
| 3.4 | Confirmed | SSE event routes still create unbounded subscriptions and heartbeat intervals per connection |
| 3.5 | Partially confirmed | SSE writes are not wrapped in explicit error handling; leak behavior on write failure remains plausible but was not fully reproduced in this pass |
| 3.6 | Refuted | `platformOverrides.delete(sessionID)` still runs during session removal, so the original unbounded-growth claim no longer matches current code |
| 3.7 | Partially confirmed | Orchestration runtime/task state is still module-level; automatic GC was not found, though manual `delete`/`clear` APIs do exist |
| 3.8 | Confirmed | `orchestration/state` still stores heartbeat timers, and `removeAgent()` still does not stop them |
| 3.9 | Confirmed | `ensureTitle` still creates a fresh `AbortController().signal` and never aborts it |
| 3.10 | Corrected | `SessionSummary.summarize()` still awaits both summary jobs with `Promise.all(...)`; the real risk is caller behavior, not a fire-and-forget implementation inside this function |
| 3.11 | Confirmed | Model cache is still an in-memory `Map` with TTL but no size bound/eviction policy |
| 4.1 | Confirmed | `write.ts` still uses `FileTime.assert()` without `FileTime.withLock()` around the actual write |
| 4.2 | Confirmed | `apply_patch.ts` still applies file changes sequentially with no rollback/transaction boundary |
| 4.3 | Confirmed | `multiedit.ts` still executes edits one-by-one and returns the last result, with no all-or-nothing transaction |
| 4.4 | Confirmed | `batch.ts` still slices to 25 and executes the retained calls concurrently via `Promise.all()` |
| 4.5 | Confirmed | `storage/storage.ts` `remove()` still unlinks without acquiring a lock, unlike `read()`/`update()` |
| 4.6 | Confirmed | `Config.updateGlobal()` still performs read-modify-write with no explicit file lock |
| 4.7 | Partially confirmed | `SessionPrompt.cancel()` still deletes state eagerly; the precise cross-call race is plausible but was not re-simulated in this pass |
| 4.8 | Partially confirmed | `SessionStatus.set()` still publishes and mutates state without transactional guarantees, but the original `Bus.publish throws` framing is stronger than what was directly proven |
| 4.9 | Confirmed | `session/llm.ts` still mutates `input.tools` in place via `delete input.tools[tool]` |
| 5.1 | Confirmed | `server/routes/session.ts` still accepts query `limit` with no upper bound |
| 5.2 | Confirmed gap | `server/routes/file.ts` still hardcodes file-search limit `10` for `/find` with no client parameter |
| 5.3 | Confirmed | `/log` input still uses unbounded `z.string()` and `z.record(z.string(), z.any())` |
| 5.4 | Confirmed | `/tui/control/response` still validates request body as `z.any()` |
| 5.5 | Confirmed gap | `providerID` route params are still only validated as `z.string()` |
| 5.6 | Partially confirmed | `bash.ts` still has no explicit max length on `command`; timeout has a lower-bound check but no explicit upper schema bound in Zod, and `z.number()` does reject `Infinity` |
| 5.7 | Partially confirmed | `read.ts` still accepts float `offset`/`limit` via `z.coerce.number()`; `NaN` is rejected by Zod and `offset < 1` is guarded, so the original wording was too broad |
| 5.8 | Confirmed | `multiedit.ts` still allows empty `edits`, and `results.at(-1)!` will crash on empty input |
| 5.9 | Confirmed | `multiedit.ts` still ignores per-edit `filePath` and always uses top-level `params.filePath` |
| 5.10 | Confirmed | `write.ts`/`edit.ts` still have no explicit size bounds on content/search strings |
| 5.11 | Corrected | `websearch.ts` / `codesearch.ts` still parse SSE `data:` lines inside a `try`; the stronger claim about missing `try/catch` is inaccurate, though malformed payloads still surface poorly |
| 5.12 | Confirmed | `question.ts` and `todo.ts` still define arrays with no `.max()` bound |
| 5.13 | Confirmed | `lsp.ts` still has no upper bound on line/character values |
| 5.14 | Confirmed | `cli/cmd/mcp.ts` still uses naive `command.split(\" \")` parsing |
| 5.15 | Confirmed | `webfetch.ts` still accepts `timeout: 0`, which becomes a 0ms abort path |
| 5.16 | Corrected | `ConfigPaths.substitute()` still uses `process.env[varName] || \"\"`, but `"0"` and `"false"` remain truthy strings; the only collapsed case is an empty-string env var |
| 6.1 | Confirmed | `session/processor.ts` still overwrites `currentText.time.start` in `text-end` |
| 6.2 | Partially confirmed | The current processor still assumes a favorable tool event order; the exact provider ordering failure mode was not reproduced in this pass |
| 6.3 | Partially confirmed | `reasoningMap` is still local to the processing loop and unfinished reasoning parts are not explicitly finalized on abort/error |
| 6.4 | Confirmed gap | No pre-flight token estimate/check was found before `LLM.stream()` in the prompt loop |
| 6.5 | Confirmed | `COMPACTION_BUFFER` is still a fixed `20_000` |
| 6.6 | Confirmed | `PRUNE_MINIMUM` is still a fixed `20_000` token threshold |
| 6.7 | Partially confirmed | Overflow detection still relies on reported totals/component sums; the undercounting concern depends on provider behavior not re-simulated here |
| 6.8 | Confirmed | `util/token.ts` still uses the fixed 4-chars-per-token heuristic |
| 6.9 | Confirmed gap | Doom-loop detection still only inspects the last three tool parts on the current assistant message |
| 6.10 | Confirmed | `Session.getUsage()` still special-cases only Anthropic/Bedrock-style providers for total-token recomputation |
| 6.11 | Confirmed | `retry-after` parsing still falls back to exponential backoff when headers are unparseable |
| 6.12 | Confirmed gap | No rate-limit pre-check/request coalescing mechanism was found in this pass |
| 6.13 | Confirmed | `session/llm.ts` still emits system prompts as `role: \"system\"` messages |
| 6.14 | Confirmed | Codex path still skips `SystemPrompt.provider()` and uses `options.instructions` instead |
| 7.1 | Partially confirmed | Config auto-write still does a naive string insertion for `$schema`; the original wording overstates newline handling because `/^\\s*\\{/` does accept leading whitespace/newlines |
| 7.2 | Confirmed | `Filesystem.writeJson()` still writes directly without temp-file + rename atomicity |
| 7.3 | Corrected | `mergeConfigConcatArrays()` still preserves non-string entries for `plugin`/`instructions`; the narrower real issue is that other array fields still fall back to replacement semantics |
| 7.4 | Refuted | Current config lookup still includes `.jsonc` candidates in both `global()` and `globalConfigFile()` |
| 7.5 | Confirmed | Legacy storage migrations still swallow per-migration errors and continue advancing the migration index |
| 7.6 | Confirmed | JSON migration still sets SQLite `PRAGMA synchronous = OFF` |
| 7.7 | Confirmed | Storage migration state still has no explicit locking around migration progress file updates |
| 7.8 | Partially confirmed | `db.ts` still calls `migrate()` even when `KILO_SKIP_MIGRATIONS` rewrites SQL to `select 1;`; exact side effects depend on Drizzle internals not re-simulated here |
| 7.9 | Partially confirmed | Config still does not require an explicit default model/provider, but `Provider.defaultModel()` has runtime fallback selection, so the original wording overstates first-run failure inevitability |
| 7.10 | Refuted | Compaction reserved tokens do have a runtime fallback in `session/compaction.ts` |
| 7.11 | Confirmed | Main config loading includes `.kilocode`, but `config/tui.ts` still filters only `.kilo`, `.opencode`, or `KILO_CONFIG_DIR` |
| 7.12 | Confirmed | `experimental.openTelemetry` still defaults to `true` |
| 7.13 | Confirmed | `provider/models.ts` still `JSON.parse`s fetched data without schema validation |
| 7.14 | Confirmed | Initial models.dev fetch still has no timeout/abort bound |
| 8.1 | Confirmed | `workspace-serve` still waits forever before unreachable `server.stop()` |
| 8.2 | Confirmed | `ModelsDev.refresh()` is still swallowed with `.catch(() => {})` in auth flow |
| 8.3 | Confirmed | `generate` command handler still has no command-local try/catch |
| 8.4 | Confirmed | `debug/scrap.ts` still runs without bootstrap/instance setup or local error handling |
| 8.5 | Confirmed | `session.ts` still returns silently when there are no sessions |
| 8.6 | Confirmed | `stats.ts` still runs DB access with no command-local try/catch |
| 8.7 | Partially confirmed | `webfetch.ts` still retries after a Cloudflare 403 without consuming the first response body; the leak impact was not re-measured in this pass |
| 8.8 | Confirmed | `warpgrep.ts` still does not pass `ctx.abort` into the remote client call |
| 8.9 | Confirmed | `warpgrep.ts` still has no local try/catch around `client.execute()` |
| 8.10 | Corrected | `grep.ts` still rejoins the tail fields after split parsing, so the original general separator-collision claim is too strong; the remaining edge case is unusual ` | ` content in file paths |
| 8.11 | Confirmed | `edit.ts` still throws an “exact match” message despite fuzzy matching fallback logic |
| 8.12 | Confirmed | `bash.ts` still stores `proc.exitCode` directly, which may be `null` on signal termination |
| 8.13 | Confirmed | MCP auth routes still return `{ error: ... }` objects instead of the normal error schema |
| 8.14 | Confirmed | Telemetry route still swallows errors and returns success |
| 8.15 | Confirmed | `/session/:sessionID/prompt_async` still fire-and-forgets `SessionPrompt.prompt()` with no await/catch |
| 8.16 | Confirmed | `debug/agent.ts` still falls back to `new Function()` for `--params` parsing |
| 9.1 | Confirmed | `edit.ts` still uses an unbounded O(n*m) Levenshtein matrix |
| 9.2 | Confirmed | `edit.ts` still iterates through 9 replacer strategies sequentially, rescanning content until a match is found |
| 9.3 | Confirmed | `ToolRegistry.all()` still rebuilds the full tool list and reloads config/custom tool state on each call |
| 9.4 | Confirmed gap | `glob.ts` still hardcodes a 100-result cap with no user-facing parameter |
| 9.5 | Confirmed | `lsp.ts` still calls `LSP.workspaceSymbol(\"\")` for the workspace-symbol action, which can fan out broadly on some servers |
| 9.6 | Confirmed | `util/token.ts` still uses the same crude fixed token heuristic noted elsewhere in the audit |
| 9.7 | Confirmed | `session/compaction.ts` still uses the fixed 20K compaction buffer rather than scaling by model window size |
| 9.8 | Confirmed | `storage/db.ts` still uses `readdirSync`, `existsSync`, and `readFileSync` in migration discovery |
| 9.9 | Confirmed | `read.ts` still base64-encodes full image bytes for attachments with no explicit size cap on that path |
| 10.1 | Confirmed | `generate.ts`, `uninstall.ts`, and `upgrade.ts` still export plain command objects instead of using the shared `cmd(...)` wrapper pattern |
| 10.2 | Confirmed | `src/index.ts` still contains commented-out `GithubCommand` / `WebCommand` imports |
| 10.3 | Confirmed | `workspace-serve` still contains unreachable `server.stop()` after an infinite wait |
| 10.4 | Partially confirmed | Migration progress rendering still diverges between `cli/cmd/db.ts` and `src/index.ts`; the exact “final 100%” bug was not replayed in this pass, but the code paths are still inconsistent |
| 10.5 | Confirmed | `Tool.Metadata` is still typed as `{ [key: string]: any }` |
| 10.6 | Confirmed gap | Tool metadata remains ad hoc under a weak shared bag type; current tool implementations still return inconsistent metadata shapes with no strict common schema |
| 10.7 | Confirmed gap | Permission-check ordering still differs: `glob.ts` / `grep.ts` ask before resolving paths, while `read.ts` resolves/stat-checks before prompting |
| 10.8 | Confirmed | `plan_exit` still returns immediately with no `ctx.ask()` permission gate |
| 10.9 | Confirmed | `batch.ts` still queries `ToolRegistry.tools({ modelID: \"\", providerID: \"\" })`, which can skew model-gated tool filtering |
| 10.10 | Confirmed | Current CORS config still sets only `origin` and does not define explicit allow/expose/maxAge fields |
| 10.11 | Confirmed | No active security-header middleware for CSP/X-Frame-Options/HSTS was found in current server setup |
| 10.12 | Confirmed gap | No `Last-Event-ID` handling was found in SSE routes |
| 10.13 | Confirmed gap | Current server auth is still coarse-grained basic auth with no route-level role/scope checks found across route modules |
| 10.14 | Confirmed | Debug command help text is still uneven, including missing/weak descriptions like `ripgrep tree --limit`, snapshot `hash`, and LSP diagnostics `file` |
| 10.15 | Confirmed gap | `server/server.ts` still publishes mDNS based on server options alone, with no auth-state check; combined with 1.1 this remains a discovery exposure |
| 10.16 | Confirmed | `errors()` still only maps documented schemas for 400 and 404 |
| 10.17 | Confirmed | `warpgrep.ts` still embeds the fallback key string `\"kilo-free\"` |
| 10.18 | Confirmed | Well-known auth still writes tokens into `process.env` with no cleanup |
| 10.19 | Confirmed | Provider init still writes AWS/SAP auth material into `process.env` as side effects |
| 10.20 | Confirmed | `server/routes/tui.ts` still instantiates `AsyncQueue` and `TuiControlRoutes` at module load |
| 10.21 | Confirmed | `memory.ts` still dereferences `r.memory.content.slice(...)` without guarding `content` in the fallback path |
| 11.1 | Confirmed gap | `worktree/index.ts` still creates under `Global.Path.data/worktree/...` and has targeted remove/reset cleanup paths, but no stale-root scan/TTL cleanup mechanism was found |
| 11.2 | Confirmed | `worktree/index.ts` `sweep()` still runs `git clean -ffdx` |
| 11.3 | Partially confirmed | Worktree branch names are still generated under the predictable `opencode/<name>` pattern, but accidental deletion risk depends on branch-collision scenarios not re-simulated here |
| 11.4 | Confirmed | `create()` still defers bootstrap with `setTimeout(..., 0)` |
| 11.5 | Confirmed | `createFromInfo()` still calls `Project.addSandbox()`, and current removal path still lacks corresponding sandbox cleanup |
| 11.6 | Corrected | `pty/index.ts` still caps the buffer at 2MB, so the original “unbounded buffer” wording is inaccurate; the remaining cost is bounded string-concatenation churn |
| 11.7 | Confirmed | `pty.interrupt()` still leaves the forced-removal timeout uncleared if the PTY exits naturally first |
| 11.8 | Confirmed gap | No PTY session timeout/max lifetime mechanism was found in the current code |
| 11.9 | Corrected | `pty.connect()` cleanup still runs in the catch paths and the returned `onClose` handler, so the original “cleanup not always called” wording is inaccurate |

---

## Table of Contents

- [Critical / High](#critical--high)
  - [Security](#1-security)
  - [Reliability](#2-reliability)
- [Medium](#medium)
  - [Resource Leaks & Memory](#3-resource-leaks--memory)
  - [Race Conditions & Atomicity](#4-race-conditions--atomicity)
  - [Input Validation Gaps](#5-input-validation-gaps)
  - [Streaming & LLM](#6-streaming--llm)
  - [Config & Storage](#7-config--storage)
  - [Error Handling](#8-error-handling)
- [Low](#low)
  - [Performance](#9-performance)
  - [Code Quality](#10-code-quality)
  - [Worktree & PTY](#11-worktree--pty)
- [Summary](#summary)

---

## Critical / High

### 1. Security

| #        | Issue                                                                                                                                                                                                                                                                                                                                                                | File                        | Line(s)                           |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------------- |
| 1.1      | **No default auth on HTTP server** — All routes are open when `KILO_SERVER_PASSWORD` is not set, including destructive endpoints (`DELETE /session`, `POST /global/dispose`, `POST /kilocode/skill/remove`)                                                                                                                                                          | `server/server.ts`          | 111-119                           |
| 1.2      | **SSRF in webfetch tool** — No blocklist for private IPs. `http://localhost`, `http://127.0.0.1`, `http://169.254.169.254` (AWS metadata), `http://[::1]` are all reachable                                                                                                                                                                                          | `tool/webfetch.ts`          | 23-25                             |
| ~~1.3~~  | ~~**Command injection in bash tool**~~ — **REFUTED:** Bun's tagged template literal `$` properly escapes interpolated arguments. `arg` is passed as a separate argument, not concatenated into a raw string. Not a vulnerability.                                                                                                                                    | `tool/bash.ts`              | 122                               |
| 1.4      | **Arbitrary dynamic imports of custom tools** — Files from `{tool,tools}/*.{js,ts}` within configured directories are dynamically imported and executed. An agent could write a file via the `write` tool and have it loaded as code on the next session                                                                                                             | `tool/registry.ts`          | 51-56                             |
| 1.5      | **Plugin tool args cast to `any` without validation** — Plugin tool arguments bypass all Zod schemas and are passed directly to the plugin's execute function                                                                                                                                                                                                        | `tool/registry.ts`          | 81                                |
| 1.6      | **API keys potentially exposed via HTTP endpoints** — `Provider.Info` schema includes a `key` field. While `GET /config/providers` at these lines does not return raw tokens (they're used server-side for `fetchDefaultModel()` only), the `Provider.list()` objects may include keys depending on provider type. Verify downstream consumers for exposure          | `server/routes/config.ts`   | 87-109                            |
| 1.7      | **Auth file race condition (TOCTOU)** — `set()` and `remove()` both follow a read-modify-write pattern on `auth.json` without any locking. Two concurrent `set()` calls cause data loss                                                                                                                                                                              | `auth/index.ts`             | 59-80                             |
| 1.8      | **OAuth tokens stored in plaintext** — No encryption at rest for `refresh` and `access` tokens in `auth.json`. File has `0o600` permissions but no protection against malware running as same user                                                                                                                                                                   | `auth/index.ts`             | 10-18                             |
| 1.9      | **Silent auth failure** — When OAuth `authorize.callback()` returns `result.type === "failed"`, the spinner stops with "Failed to authorize" but the function does **not** return or throw. Execution continues and reports success. Applies to all three auth methods (`auto`, `code`, `api`)                                                                       | `cli/cmd/auth.ts`           | 91-93, 123-125, 155-157           |
| 1.10     | **Inconsistent basic auth usernames** — `run.ts` uses `"kilo"` while `tui/attach.ts` uses `"opencode"` for basic auth credentials to the same server                                                                                                                                                                                                                 | `cli/cmd/run.ts`            | 707 vs `cli/cmd/tui/attach.ts:81` |
| ~~1.11~~ | ~~**No path traversal validation on file routes**~~ — **DESCRIPTION INACCURATE:** `File.read()` and `File.list()` DO validate paths via `Instance.containsPath()`, throwing "Access denied: path escapes project directory". Known limitations: symlinks can escape, and on Windows cross-drive paths bypass the check                                               | `server/routes/file.ts`     | 137, 165                          |
| ~~1.12~~ | ~~**`POST /kilocode/skill/remove` deletes arbitrary directories**~~ — **DESCRIPTION INACCURATE:** `Skill.remove()` validates the `location` against the registered skill registry before deletion; unregistered locations throw `RemoveError`. Concern: `rm(dir, { recursive: true, force: true })` removes the parent directory, which may be broader than intended | `server/routes/kilocode.ts` | 14-43                             |
| 1.13     | **No request body size limit** — Hono/Bun server has no explicit request body size limit configured. Large payloads could cause memory exhaustion                                                                                                                                                                                                                    | `server/server.ts`          | (app init)                        |

### 2. Reliability

| #       | Issue                                                                                                                                                                                                                                                                                                                                                      | File                                                                                                          | Line(s)           |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------- |
| ~~2.1~~ | ~~**Missing import: `ResolveMessage`**~~ — **ISSUE DOESN'T EXIST:** `ResolveMessage` is a Bun built-in global class (module resolution errors). No explicit import is needed. The code is correct in the Bun runtime.                                                                                                                                      | `src/index.ts`                                                                                                | 238               |
| 2.2     | **`process.exit()` bypasses cleanup** — Multiple command files call `process.exit()` directly. While the `finally` block in `index.ts` (lines 257-270) does run cleanup before its own `process.exit()`, early `process.exit()` calls in handlers (e.g., `run.ts:336,348,366`, `export.ts:84`, `pr.ts:22`) can skip the top-level `finally` block entirely | `cli/cmd/run.ts`, `export.ts`, `pr.ts`, `debug/agent.ts`, `auth.ts`, `agent.ts`, `github.ts`, `tui/thread.ts` | Various locations |
| 2.3     | **Unbounded retry loop** — No upper bound on retry count. Exponential backoff caps at `RETRY_MAX_DELAY` (~24.8 days). A provider returning consistent retryable errors causes indefinite retrying                                                                                                                                                          | `session/processor.ts`                                                                                        | 390-401           |
| 2.4     | **Default unbounded agent steps** — `agent.steps ?? Infinity`. When no explicit `steps` limit is configured per agent, the default is unbounded. Note: step limits ARE configurable per agent definition                                                                                                                                                   | `session/prompt.ts`                                                                                           | 611               |
| 2.5     | **Context overflow during compaction is unrecoverable** — If compaction itself triggers a context overflow, the session is permanently stuck. User must manually intervene                                                                                                                                                                                 | `session/compaction.ts`                                                                                       | 224-232           |
| 2.6     | **Orchestration `executeAgentTask` is a stub** — Constructs a prompt string but never calls an LLM. Returns a hardcoded placeholder object. The entire orchestration task execution is non-functional                                                                                                                                                      | `orchestration/integration.ts`                                                                                | 92-107            |
| 2.7     | **Rate limit detection misses Anthropic/Google error formats** — Detection at lines 94-101 checks for `too_many_requests` and `rate_limit` in error code. Anthropic's `rate_limit_error` type and Google's `RESOURCE_EXHAUSTED` status are not matched. Note: Vercel AI SDK's `isRetryable` flag catches some cases                                        | `session/retry.ts`                                                                                            | 94-101            |
| 2.8     | **No provider fallback mechanism** — No automatic retry on a different provider/model. If a provider is down, the user must manually switch models                                                                                                                                                                                                         | (not found)                                                                                                   | —                 |
| ~~2.9~~ | ~~**`onError` in `streamText` swallows all errors silently**~~ — **REFUTED:** The `onError` callback is a Vercel AI SDK logging hook that does not suppress errors. Errors are propagated through the stream and caught by the processor's `"error"` case handler (line 232-233) and outer try-catch.                                                      | `session/llm.ts`                                                                                              | 191-195           |
| 2.10    | **`task.ts` swallows session lookup errors** — `Session.get(params.task_id).catch(() => {})` silently ignores all errors, creating a new session instead of reporting issues                                                                                                                                                                               | `tool/task.ts`                                                                                                | 68                |
| 2.11    | **Structured output retry always produces `retries: 0`** — Code records failure and exits without actual retry, contradicting the `retryCount` field in the schema                                                                                                                                                                                         | `session/prompt.ts`                                                                                           | 772-781           |

---

## Medium

### 3. Resource Leaks & Memory

| #        | Issue                                                                                                                                                                                                                                                                                                                                                                                                                              | File                            | Line(s)   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | --------- |
| 3.1      | **Bus subscribers never cleaned up on typed events** — `Instance.dispose()` only cleans wildcard `*` subscribers. Typed subscriptions (e.g., `"session.updated"`) remain in the map and accumulate across instance lifecycles. Affected: `session-integration.ts` (3 subs), `context-hooks.ts` (1), `plugin/index.ts` (1), `share-next.ts` (4), `bootstrap.ts` (1), `format/index.ts` (1), `kilo-sessions.ts` (7), `github.ts` (1) | `bus/index.ts`                  | 26-38     |
| 3.2      | **`Bus.publish()` logs every event at `info` level** — Causes massive log noise for high-frequency events like `MessageV2.Event.PartUpdated` (fires per token in streaming). Degrades performance                                                                                                                                                                                                                                  | `bus/index.ts`                  | 49-51     |
| 3.3      | **`GlobalBus` has no `maxListeners` set** — Node.js defaults to 10; no cleanup mechanism for listeners when instances are disposed                                                                                                                                                                                                                                                                                                 | `bus/global.ts`                 | 1-10      |
| 3.4      | **Unbounded SSE connections** — No connection limit on `/event` and `/global/event` streams. Each creates a `Bus.subscribeAll()` subscription + `setInterval` heartbeat. Memory leak risk                                                                                                                                                                                                                                          | `server/server.ts`              | 580-636   |
| 3.5      | **SSE error during `writeSSE` silently fails** — If stream is closed or in error state, write fails silently. Subscription leaks until `Bus.InstanceDisposed`                                                                                                                                                                                                                                                                      | `server/server.ts`              | 608-614   |
| ~~3.6~~  | ~~**`platformOverrides` map grows without eviction**~~ — **ISSUE DOESN'T EXIST:** Entries are cleaned up at line 699 via `platformOverrides.delete(sessionID)` in the session `remove()` function. Lifecycle is 1:1 with sessions.                                                                                                                                                                                                 | `session/index.ts`              | 260       |
| 3.7      | **Orchestration `RUNTIME_STATES` and `TASK_QUEUE` never GC'd** — Module-level Maps with no automatic cleanup. Completed/failed tasks leave stale entries                                                                                                                                                                                                                                                                           | `orchestration/agents/index.ts` | 4         |
| 3.8      | **Heartbeat timers leak on agent removal** — `removeAgent()` does NOT call `stopHeartbeat`. `setInterval` handles stored in Maps are never cleaned                                                                                                                                                                                                                                                                                 | `orchestration/state/index.ts`  | 16-17     |
| 3.9      | **`ensureTitle` fire-and-forget with no timeout** — Creates `new AbortController()` internally but never aborts. If LLM call hangs, it runs indefinitely                                                                                                                                                                                                                                                                           | `session/prompt.ts`             | 2031-2050 |
| ~~3.10~~ | ~~**`SessionSummary.summarize` is fire-and-forget**~~ — **DESCRIPTION INACCURATE:** The function properly awaits work via `await Promise.all(...)`. Whether a caller chooses to not await the result is a separate concern.                                                                                                                                                                                                        | `session/summary.ts`            | 69-81     |
| 3.11     | **Model cache uses in-memory Map with no size limit** — Each provider's model data stored indefinitely                                                                                                                                                                                                                                                                                                                             | `provider/model-cache.ts`       | 12-18     |

### 4. Race Conditions & Atomicity

| #   | Issue                                                                                                                                                                                                                | File                  | Line(s)   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | --------- |
| 4.1 | **`write` tool lacks file locking** — Unlike `edit.ts` (which uses `FileTime.withLock`), `write.ts` has a TOCTOU race between `FileTime.assert` and actual write                                                     | `tool/write.ts`       | 30-45     |
| 4.2 | **`apply_patch` non-atomic multi-file operations** — Multiple file changes applied sequentially with no transaction/rollback. Partial failure leaves filesystem in inconsistent state                                | `tool/apply_patch.ts` | 191-228   |
| 4.3 | **`multiedit` edits not transactional** — Each edit uses `FileTime.withLock` individually, but the overall sequence is not atomic. Abort between edits leaves partial state                                          | `tool/multiedit.ts`   | 26-37     |
| 4.4 | **`batch.ts` high parallel execution** — Up to 25 tools spawn simultaneously via `Promise.all` (capped by `.slice(0, 25)` at line 36). Each potentially creating child processes, file I/O, or network requests      | `tool/batch.ts`       | 36, 132   |
| 4.5 | **Storage `remove()` has no locking** — Concurrent `remove()` and `read()`/`update()` could leave inconsistent state                                                                                                 | `storage/storage.ts`  | 157-163   |
| 4.6 | **Config `updateGlobal()` no locking** — Read-modify-write without file locking. Concurrent calls cause lost updates                                                                                                 | `config/config.ts`    | 1573-1631 |
| 4.7 | **`SessionPrompt.cancel()` has TOCTOU race with `loop()`** — Between `cancel()` deleting the state entry and `loop()` calling `start()`, another caller could create a new AbortController, orphaning the old signal | `session/prompt.ts`   | 281-308   |
| 4.8 | **`SessionStatus` mutations not atomic** — `set()` publishes a Bus event AND mutates the state dict. If `Bus.publish` throws, state may be inconsistent                                                              | `session/status.ts`   | 61-75     |
| 4.9 | **`resolveTools` mutates input `tools` object in place** — Deletes keys from caller's object via `delete input.tools[tool]`                                                                                          | `session/llm.ts`      | 281-289   |

### 5. Input Validation Gaps

| #        | Issue                                                                                                                                                                                                                                                                                                        | File                                      | Line(s)                                                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --- |
| 5.1      | **No `max` on session list `limit` param** — `z.coerce.number().optional()` with no upper bound. `limit=999999999` causes massive memory allocation (DoS)                                                                                                                                                    | `server/routes/session.ts`                | 43-53                                                                                                                                                 |
| 5.2      | **File search limit not configurable** — Hardcoded `limit: 10` in `Ripgrep.search()` call; no user-facing parameter to increase it                                                                                                                                                                           | `server/routes/file.ts`                   | 40                                                                                                                                                    |
| 5.3      | **`POST /log` no size limit on message/extra** — `message` is `z.string()` with no max; `extra` is `z.record(z.string(), z.any())` with no depth/size limit. Allows disk exhaustion                                                                                                                          | `server/server.ts`                        | 459-469                                                                                                                                               |
| 5.4      | **`POST /tui/control/response` accepts `z.any()`** — No validation on response body                                                                                                                                                                                                                          | `server/routes/tui.ts`                    | 70                                                                                                                                                    |
| 5.5      | **`providerID` parameter has no semantic validation** — Validated only as `z.string()`; no check against known provider IDs or format constraints                                                                                                                                                            | `server/server.ts`                        | 185                                                                                                                                                   |
| 5.6      | **`bash.ts` no command length limit** — No `max()` on `command` string or `timeout`. LLM could pass `timeout: Infinity` or multi-megabyte commands                                                                                                                                                           | `tool/bash.ts`                            | 66-67                                                                                                                                                 |
| 5.7      | **`read.ts` non-integer offset/limit accepted** — `z.coerce.number()` accepts floats like `1.5`, negatives, and `NaN`                                                                                                                                                                                        | `tool/read.ts`                            | 25-27                                                                                                                                                 |
| 5.8      | **`multiedit` empty `edits` array crashes** — No `.min(1)` validation. `results.at(-1)!` accesses `.output` on `undefined` for empty array                                                                                                                                                                   | `tool/multiedit.ts`                       | 12, 43                                                                                                                                                |
| 5.9      | **`multiedit` per-edit `filePath` silently ignored** — Each edit object has a `filePath` field but all edits use the top-level `params.filePath`                                                                                                                                                             | `tool/multiedit.ts`                       | 15, 29                                                                                                                                                |
| 5.10     | **`write.ts`/`edit.ts` no content length validation** — No bounds on `content`, `oldString`, or `newString` length                                                                                                                                                                                           | `tool/write.ts`, `tool/edit.ts`           | 23, 41-43                                                                                                                                             |
| ~~5.11~~ | ~~**`websearch.ts`/`codesearch.ts` `JSON.parse` without try/catch for SSE data**~~ — **DESCRIPTION INACCURATE:** Both `JSON.parse` calls ARE inside a `try` block. The issue is that the outer catch only handles `AbortError` and re-throws other errors (like `SyntaxError`) without a meaningful message. | `tool/websearch.ts`, `tool/codesearch.ts` | 123, 105                                                                                                                                              |
| 5.12     | **`question.ts`/`todo.ts` no array max length** — No `.max()` on questions or todos arrays                                                                                                                                                                                                                   | `tool/question.ts`, `tool/todo.ts`        | 9, 9                                                                                                                                                  |
| 5.13     | **`lsp.ts` no upper bound on line/character** — Extremely large values sent to LSP server                                                                                                                                                                                                                    | `tool/lsp.ts`                             | 28-29                                                                                                                                                 |
| 5.14     | **MCP command split naive** — `command.split(" ")` breaks on quoted arguments like `"/path/with spaces/server" --flag`                                                                                                                                                                                       | `cli/cmd/mcp.ts`                          | 507-509                                                                                                                                               |
| 5.15     | **`webfetch.ts` zero timeout via input** — Default timeout is 30s (safe), but `z.number().optional()` has no `.min(1)`. If an LLM passes `timeout: 0`, `??` does not trigger (0 is not nullish), producing a 0ms timeout that causes immediate abort with confusing error message                            | `tool/webfetch.ts`                        | 38                                                                                                                                                    |
| ~~5.16~~ | ~~**`{env:VAR}` substitution treats `"0"` and `"false"` as missing**~~ — **DESCRIPTION INACCURATE:** `process.env` values are always strings. `"0"` and `"false"` are truthy JS strings, so `                                                                                                                |                                           | `behaves identically to`??`here. The only edge case is empty string`""`, which is falsy and returns the fallback — same behavior with either operator | `config/paths.ts` | 87  |

### 6. Streaming & LLM

| #    | Issue                                                                                                                                                                                                                                 | File                    | Line(s)                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------- |
| 6.1  | **`text-end` event overwrites `time.start`** — Sets `{ start: Date.now(), end: Date.now() }`, replacing the original start time. Reported text duration is always near-zero                                                           | `session/processor.ts`  | 355-358                 |
| 6.2  | **Race condition in `partFromToolCall`** — If `tool-call` arrives before `tool-input-start`, `match` is `undefined` and tool execution starts but is never tracked (write handlers at 113-151, `partFromToolCall` at 44-46)           | `session/processor.ts`  | 44-46, 113-151          |
| 6.3  | **Reasoning parts interrupted mid-stream never finalized** — If aborted between `reasoning-start` and `reasoning-end`, incomplete part persists in `reasoningMap` with no end time                                                    | `session/processor.ts`  | 64-111                  |
| 6.4  | **No pre-flight token counting** — No estimation of total token count before sending to LLM. Relies entirely on provider returning context overflow error reactively                                                                  | `session/prompt.ts`     | (before `LLM.stream()`) |
| 6.5  | **Compaction buffer fixed at 20K tokens** — Ignores model context size differences. 62.5% of 32K window, only 10% of 200K window                                                                                                      | `session/compaction.ts` | 30                      |
| 6.6  | **Pruning threshold `PRUNE_MINIMUM = 20,000` may not trigger** — At least 20K old tool output tokens needed before pruning. Small-context sessions that never accumulate this much skip pruning entirely                              | `session/compaction.ts` | 50                      |
| 6.7  | **Overflow detection uses potentially undercounted `total`** — Some providers undercount `totalTokens`, causing overflow detection to trigger late                                                                                    | `session/compaction.ts` | 38-40                   |
| 6.8  | **Token estimation uses crude 4-chars-per-token heuristic** — 2-3x inaccuracy for CJK text, emoji, and JSON structure. Used for compaction pruning decisions                                                                          | `util/token.ts`         | 1-7                     |
| 6.9  | **Doom loop detection gap** — Only checks last 3 tool calls on the **current** assistant message. Loops spanning multiple messages are undetected                                                                                     | `session/processor.ts`  | 153-178                 |
| 6.10 | **`getUsage` has inconsistent total token handling** — Manual computation for Anthropic/Bedrock; direct `totalTokens` for others. Google Gemini also undercounts but isn't handled                                                    | `session/index.ts`      | 877-888                 |
| 6.11 | **`retry-after` parsing has exponential backoff fallback** — When retry-after headers exist but are unparseable, exponential backoff at line 55 is used as fallback (not additive). `attempt` counter still increments across retries | `session/retry.ts`      | 32-56                   |
| 6.12 | **No rate limit pre-check or request coalescing** — Multiple concurrent tool calls all independently hit rate limit                                                                                                                   | (not found)             | —                       |
| 6.13 | **System prompt always sent as `role: "system"`** — Some providers (e.g., certain Gemini configs) don't support system role in `ModelMessage`                                                                                         | `session/llm.ts`        | 247-254                 |
| 6.14 | **Codex sessions skip provider prompt** — May lose provider-specific system prompt customizations                                                                                                                                     | `session/llm.ts`        | 77-82                   |

### 7. Config & Storage

| #       | Issue                                                                                                                                                                                                                                                                                                                                                                      | File                        | Line(s)              |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | -------------------- |
| 7.1     | **Config auto-write can corrupt user config** — Naive string replace (`original.replace(/^\s*\{/, ...)`) breaks if JSON starts with newline, has BOM, or uses non-standard format. No file locking during rewrite                                                                                                                                                          | `config/config.ts`          | 1382-1386            |
| 7.2     | **`Storage.writeJson` not atomic** — `writeFile` directly; crash mid-write leaves corrupt file. No write-to-temp-then-rename pattern                                                                                                                                                                                                                                       | `util/filesystem.ts`        | 75-77                |
| ~~7.3~~ | ~~**`mergeConfigConcatArrays` silently drops non-string array entries**~~ — **DESCRIPTION INACCURATE:** Code uses `Set` dedup on `plugin`/`instructions` arrays which preserves all entry types. The actual gap is that only `plugin` and `instructions` arrays are concatenated; other array fields fall through to `mergeDeep` (which replaces rather than concatenates) | `config/config.ts`          | 74-83                |
| ~~7.4~~ | ~~**`GlobalConfigFile()` ignores `.jsonc` variants**~~ — **ISSUE DOESN'T EXIST (fixed):** Both `global()` and `globalConfigFile()` now include `.jsonc` variants (`kilo.jsonc`, `opencode.jsonc`) in their candidate lists                                                                                                                                                 | `config/config.ts`          | 1317-1348, 1439-1449 |
| 7.5     | **Legacy storage migrations silently swallow errors** — `.catch(() => log.error(...))` catches all errors; partial migrations are never retried because index is still incremented                                                                                                                                                                                         | `storage/storage.ts`        | 149                  |
| 7.6     | **JSON migration uses `synchronous = OFF`** — Power failure during migration can leave database inconsistent                                                                                                                                                                                                                                                               | `storage/json-migration.ts` | 50                   |
| 7.7     | **Migration state file has no locking** — Two process instances starting simultaneously could run migrations concurrently                                                                                                                                                                                                                                                  | `storage/storage.ts`        | 141-155              |
| 7.8     | **`db.ts` skip-migrations flag still runs `migrate()`** — Replaces SQL with `select 1` but Drizzle migrator may still create/update `__drizzle_migrations` table                                                                                                                                                                                                           | `storage/db.ts`             | 110-115              |
| 7.9     | **No default model/provider configured** — Optional fields with no validation that at least one model is available. First-time users get confusing runtime errors                                                                                                                                                                                                          | `config/config.ts`          | 1153-1202            |
| ~~7.10~~ | ~~**`compaction.reserved` has no default value**~~ — **ISSUE DOESN'T EXIST:** `session/compaction.ts` falls back to `config.compaction?.reserved ?? Math.min(COMPACTION_BUFFER, ProviderTransform.maxOutputTokens(input.model))`, so compaction does have a runtime default when unset.                                                                 | `config/config.ts`, `session/compaction.ts` | 1280-1286, 34-40 |
| 7.11    | **TUI config doesn't load `.kilocode` directory** — Filter excludes `.kilocode` while main config loads it. Users with `.kilocode/tui.json` have settings ignored                                                                                                                                                                                                          | `config/tui.ts`             | 57                   |
| 7.12    | **`experimental.openTelemetry` defaults to `true`** — Telemetry enabled by default; users may not be aware                                                                                                                                                                                                                                                                 | `config/config.ts`          | 1294                 |
| 7.13    | **No validation of models.dev response** — `JSON.parse` with no Zod validation; malformed data from `models.dev` could cause crashes                                                                                                                                                                                                                                       | `provider/models.ts`        | 126-127              |
| 7.14    | **No timeout on initial models.dev fetch** — `Data()` fetch has no `AbortSignal.timeout()`. Could hang indefinitely on network issues                                                                                                                                                                                                                                      | `provider/models.ts`        | 126                  |

### 8. Error Handling

| #        | Issue                                                                                                                                                                                                                         | File                                      | Line(s)                            |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------- | -------------- | --------- |
| 8.1      | **`workspace-serve` unreachable cleanup** — `await new Promise(() => {})` on line 13 never resolves; `server.stop()` on line 14 is dead code. No signal handler for graceful shutdown                                         | `cli/cmd/workspace-serve.ts`              | 13-14                              |
| 8.2      | **`ModelsDev.refresh()` error silently swallowed** — `.catch(() => {})` provides no feedback that provider list may be stale                                                                                                  | `cli/cmd/auth.ts`                         | 320                                |
| 8.3      | **No try/catch in `generate` command handler** — `Server.openapi()` errors propagate to top-level with no command-specific message                                                                                            | `cli/cmd/generate.ts`                     | 7-48                               |
| 8.4      | **No try/catch in `debug/scrap.ts`** — No `bootstrap()`, no `Instance.provide()`, no error handling                                                                                                                           | `cli/cmd/debug/scrap.ts`                  | 10-15                              |
| 8.5      | **`session.ts` silent empty output** — When no sessions exist, returns with no message like "No sessions found"                                                                                                               | `cli/cmd/session.ts`                      | 93-94                              |
| 8.6      | **`stats.ts` no error handling for DB queries** — `Database.use()` called with no try/catch; corrupted/locked database causes unhandled error                                                                                 | `cli/cmd/stats.ts`                        | 70-83, 90-93                       |
| 8.7      | **`webfetch.ts` double request connection leak** — Cloudflare 403 retry reuses already-cleared abort signal; first response body never consumed                                                                               | `tool/webfetch.ts`                        | 68-71                              |
| 8.8      | **`warpgrep.ts` missing abort signal** — `client.execute()` doesn't pass `ctx.abort`. Network request continues for 60s after user abort                                                                                      | `tool/warpgrep.ts`                        | 41-44                              |
| 8.9      | **`warpgrep.ts` no try/catch around `client.execute`** — Network/DNS errors propagate as unhandled exceptions                                                                                                                 | `tool/warpgrep.ts`                        | 41-44                              |
| ~~8.10~~ | ~~**`grep.ts` pipe field separator collision**~~ — **DESCRIPTION INACCURATE:** The code at lines 87-91 mitigates content collisions using rest-spread destructuring (`...lineTextParts`) and rejoining (`lineTextParts.join(" | ")`). The only unmitigated edge case is ` | ` in file paths (vanishingly rare) | `tool/grep.ts` | 43, 87-91 |
| 8.11     | **`edit.ts` misleading error message** — Claims "exact match required" but tool uses 9 fuzzy matching strategies                                                                                                              | `tool/edit.ts`                            | 664-668                            |
| 8.12     | **`bash.ts` `exitCode` can be null** — Process killed by signal returns `null` exit code, stored in metadata                                                                                                                  | `tool/bash.ts`                            | 283                                |
| 8.13     | **MCP error returns non-standard format** — `{ error: "..." }` instead of `{ name, data, errors, success }`                                                                                                                   | `server/routes/mcp.ts`                    | 88-89, 149                         |
| 8.14     | **Telemetry route swallows errors silently** — `catch {}` with empty block; caller receives `200: true` on failure                                                                                                            | `server/routes/telemetry.ts`              | 37-40                              |
| 8.15     | **`POST /session/:sessionID/prompt_async` fire-and-forgets** — `SessionPrompt.prompt()` not awaited, no `.catch()`. Unhandled error could crash process                                                                       | `server/routes/session.ts`                | 792-801                            |
| 8.16     | **`debug/agent.ts` uses `new Function()` on user input** — `--params` argument evaluated as arbitrary JS with no sandboxing                                                                                                   | `cli/cmd/debug/agent.ts`                  | 89-111                             |

---

## Low

### 9. Performance

| #   | Issue                                                                                                                                                                                             | File                    | Line(s) |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------- |
| 9.1 | **Levenshtein O(n\*m) without bounds** — For very long strings (10K+ chars), allocates 100M+ element matrix                                                                                       | `tool/edit.ts`          | 180-196 |
| 9.2 | **9 sequential replacer passes in `edit.ts`** — Each scans entire file; O(9 \* filesize \* searchsize) worst case                                                                                 | `tool/edit.ts`          | 639-661 |
| 9.3 | **Tool registry `all()` rebuilt on every call** — No caching; re-fetches config, filters, and awaits tool init each invocation                                                                    | `tool/registry.ts`      | 103-142 |
| 9.4 | **`glob.ts` hard-coded 100 result limit** — No user-facing parameter; large codebases may need more                                                                                               | `tool/glob.ts`          | 36      |
| 9.5 | **`lsp.ts` workspaceSymbol with empty query** — Could return enormous number of results from LSP server                                                                                           | `tool/lsp.ts`           | 74      |
| 9.6 | **Crude 4-chars-per-token heuristic** — 2-3x inaccuracy for CJK, emoji, JSON                                                                                                                      | `util/token.ts`         | 1-7     |
| 9.7 | **Compaction buffer fixed at 20K tokens** — Not scaled per model context size                                                                                                                     | `session/compaction.ts` | 30      |
| 9.8 | **Database `migrations()` uses sync I/O** — `readdirSync`/`readFileSync`/`existsSync` block event loop during startup                                                                             | `storage/db.ts`         | 65-83   |
| 9.9 | **Unbounded memory for large images in `read.ts`** — `read.ts` reads entire files into base64 strings (~33% overhead) with no size check. Note: `webfetch.ts` has a 5MB `MAX_RESPONSE_SIZE` limit | `tool/read.ts:138`      |         |

### 10. Code Quality

| #     | Issue                                                                                                                                                                                                                   | File                                                | Line(s)                  |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------ |
| 10.1  | **Inconsistent command definition patterns** — `generate.ts`, `uninstall.ts`, `upgrade.ts` don't use `cmd()` wrapper. Missing `WithDoubleDash` typing                                                                   | `cli/cmd/generate.ts`, `uninstall.ts`, `upgrade.ts` | Various                  |
| 10.2  | **Dead code: commented-out commands** — `GithubCommand` (1637 lines) and `WebCommand` imports commented out in `index.ts`                                                                                               | `src/index.ts`                                      | 21, 28                   |
| 10.3  | **Dead code: unreachable `server.stop()`** — Preceded by `await new Promise(() => {})`                                                                                                                                  | `cli/cmd/workspace-serve.ts`                        | 14                       |
| 10.4  | **Duplicated migration progress bar with bug** — `db.ts` version missing the fix in `index.ts` (won't print final 100%)                                                                                                 | `cli/cmd/db.ts`                                     | 80 vs `src/index.ts:151` |
| 10.5  | **Weak `Metadata` typing** — `{ [key: string]: any }` with no type safety propagates to all tools                                                                                                                       | `tool/tool.ts`                                      | 8-10                     |
| 10.6  | **Inconsistent return metadata shapes** — Tools return different structures with no shared type: `bash` (`output,exit,description`), `read` (`preview,truncated,loaded`), `write` (`diagnostics,filepath,exists`), etc. | Various tool files                                  | —                        |
| 10.7  | **Inconsistent permission check patterns** — `glob.ts` asks before resolving path; `grep.ts` asks before resolving; `read.ts` asks after resolving but before checking existence                                        | `tool/glob.ts`, `tool/grep.ts`, `tool/read.ts`      | Various                  |
| 10.8  | **`plan_exit` tool has no permission check** — Bypasses standard `ctx.ask()` flow                                                                                                                                       | `tool/plan.ts`                                      | 20-32                    |
| 10.9  | **`batch.ts` passes empty model info** — `modelID: "", providerID: ""` may cause tool filtering to behave unexpectedly                                                                                                  | `tool/batch.ts`                                     | 40                       |
| 10.10 | **Inconsistent CORS config** — No `allowHeaders`, `allowMethods`, `maxAge`, `exposeHeaders`. `http://localhost:*` allows any port                                                                                       | `server/server.ts`                                  | 137-162                  |
| 10.11 | **No security headers** — Missing `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`                                                                                                             | `server/server.ts`                                  | (global middleware)      |
| 10.12 | **No `Last-Event-ID` support on SSE** — Clients miss events during reconnection                                                                                                                                         | `server/server.ts`                                  | 580-636                  |
| 10.13 | **No route-level authorization granularity** — No role-based or scope-based access. Any authenticated user can `POST /global/dispose`                                                                                   | All route files                                     | —                        |
| 10.14 | **Weak help text on debug commands** — `--limit` in ripgrep `TreeCommand` has no description; `hash` in snapshot has unhelpful description `"hash"`; `file` in lsp `DiagnosticsCommand` has no description              | `cli/cmd/debug/*.ts`                                | Various                  |
| 10.15 | **mDNS advertised without auth consideration** — Combined with no default auth, any local network user can discover and connect                                                                                         | `server/mdns.ts`                                    | 10-44                    |
| 10.16 | **`errors()` helper only supports 400 and 404** — Other status codes have no documented response schema                                                                                                                 | `server/error.ts`                                   | 5-36                     |
| 10.17 | **Warpgrep fallback API key embedded in source** — Hardcoded `"kilo-free"` key discoverable in codebase                                                                                                                 | `tool/warpgrep.ts`                                  | 35-37                    |
| 10.18 | **WellKnown auth type leaks token to child processes** — `process.env[value.key] = value.token` never cleaned up                                                                                                        | `config/config.ts`                                  | 182                      |
| 10.19 | **AWS/SAP tokens written to `process.env` as side effects** — `AWS_BEARER_TOKEN_BEDROCK` and `AICORE_SERVICE_KEY` persist beyond provider init                                                                          | `provider/provider.ts`                              | 217-225, 416-423         |
| 10.20 | **`TuiControlRoutes` not lazy-initialized** — `AsyncQueue` instances created at module load, unlike all other route modules                                                                                             | `server/routes/tui.ts`                              | 30                       |
| 10.21 | **`memory.ts` potential null reference** — `r.memory.content.slice()` will throw if `content` is `undefined`                                                                                                            | `tool/memory.ts`                                    | 121, 174                 |

### 11. Worktree & PTY

| #        | Issue                                                                                                                                                                                                                                                                                                   | File                | Line(s)      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------ |
| 11.1     | **No stale worktree cleanup mechanism** — Orphaned directories from crashes accumulate indefinitely in `~/.local/share/kilo/worktree/`                                                                                                                                                                  | `worktree/index.ts` | —            |
| 11.2     | **`sweep()` runs `git clean -ffdx`** — Deletes untracked files and `.gitignore`d files (`.env`, build artifacts, IDE settings) without confirmation                                                                                                                                                     | `worktree/index.ts` | 250-259      |
| 11.3     | **Worktree branch names are predictable** — Pattern `opencode/<adjective>-<noun>` at line 271 could collide with user-created branches. `git branch -D` in `remove()` at line 518 could accidentally delete user's branch                                                                               | `worktree/index.ts` | 271          |
| 11.4     | **`createFromInfo()` defers worktree population to `setTimeout(..., 0)`** — If process exits before timeout, worktree is created but never populated. Leaves bare directory and orphaned branch                                                                                                         | `worktree/index.ts` | 360-428      |
| 11.5     | **Worktree removal doesn't clean up sandbox tracking** — `create()` calls `Project.addSandbox()` but `remove()` never calls corresponding cleanup                                                                                                                                                       | `worktree/index.ts` | 355, 431-525 |
| ~~11.6~~ | ~~**PTY buffer unbounded GC pressure**~~ — **DESCRIPTION INACCURATE:** Buffer IS bounded to 2MB via `BUFFER_LIMIT` (line 15). Real concern is string-concatenation GC pressure (JS string immutability means `+=` creates new strings) with bounded max size                                            | `pty/index.ts`      | 15, 217-221  |
| 11.7     | **PTY `interrupt()` dangling setTimeout** — `forceAfter` timeout never cleared if PTY exits naturally before it fires                                                                                                                                                                                   | `pty/index.ts`      | 282-298      |
| 11.8     | **No PTY session timeout or max lifetime** — Forgotten terminal sessions consume resources indefinitely                                                                                                                                                                                                 | `pty/index.ts`      | —            |
| ~~11.9~~ | ~~**PTY `connect()` cleanup callback not always called**~~ — **DESCRIPTION INACCURATE:** Cleanup is called in all code paths — catch blocks at lines 360, 369 call `cleanup()`, and the returned `onClose` handler calls it. Stale subscriber safety net exists in the `onData` handler (lines 199-215) | `pty/index.ts`      | 320-382      |

---

## Summary

Original audit summary below. Not re-counted on 2026-03-28.

| Severity            | Count  | Categories                                                                                                                                                                                                                                                                                               |
| ------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Critical / High** | 16     | Security (8 confirmed, 5 inaccurate, 1 refuted), Reliability (7 confirmed, 3 inaccurate)                                                                                                                                                                                                                 |
| **Medium**          | 43     | Resource Leaks (8 confirmed, 2 inaccurate/refuted), Race Conditions (8 confirmed, 1 inaccurate), Input Validation (10 confirmed, 5 inaccurate/refuted), Streaming & LLM (13 confirmed, 1 inaccurate), Config & Storage (10 confirmed, 3 inaccurate/refuted), Error Handling (13 confirmed, 2 inaccurate) |
| **Low**             | 27     | Performance (9 confirmed, 1 inaccurate), Code Quality (20 confirmed, 1 inaccurate), Worktree & PTY (6 confirmed, 3 inaccurate/refuted)                                                                                                                                                                   |
| **Total**           | **86** | 16 refuted/inaccurate descriptions corrected, 86 confirmed issues remaining                                                                                                                                                                                                                              |

> **Note:** Strikethrough entries (~~1.3~~, ~~2.1~~, ~~2.9~~, ~~3.6~~, ~~3.10~~, ~~5.11~~, ~~5.16~~, ~~7.3~~, ~~7.4~~, ~~8.10~~, ~~11.6~~, ~~11.9~~) were refuted or had inaccurate descriptions during triple-check verification. Entries with "~~DESCRIPTION INACCURATE~~" retain the underlying concern but with corrected descriptions.

### Top Priority Fixes

1. Add authentication by default or at minimum document the security implications (1.1)
2. Fix the silent auth failure in `auth.ts` (1.9) — users think they're authenticated when they're not
3. Add file locking to `auth.json` read-modify-write operations (1.7)
4. Add max retry count and default max agent steps (2.3, 2.4) — prevents infinite loops
5. Add private IP blocklist to webfetch (1.2) — SSRF prevention
6. Clean up Bus subscribers on instance disposal (3.1) — memory leak
7. Add file locking to `write` tool (4.1) and storage `remove()` (4.5)
8. Add upper bounds to server query parameters (5.1, 5.3) — DoS prevention
9. Fix `multiedit` empty `edits` crash (5.8) and ignored per-edit `filePath` (5.9)
10. Fix `text-end` overwriting `time.start` (6.1) — breaks duration tracking

### Triple-Check Verification Notes

**Refuted (not real issues):**

- **1.3:** Bun's tagged template literal `$` properly shell-escapes interpolated arguments. Not a command injection vector.
- **2.1:** `ResolveMessage` is a Bun built-in global class. No import needed.
- **2.9:** Vercel AI SDK's `onError` is a logging-only hook. Errors propagate through the stream normally.
- **3.6:** `platformOverrides` entries ARE cleaned up at line 699 in session `remove()`.
- **7.4:** `.jsonc` variants are included in both `global()` and `globalConfigFile()` (already fixed).

**Descriptions corrected for accuracy:**

- **1.6:** API tokens at these lines are used server-side only (for `fetchDefaultModel()`), not returned in the HTTP response.
- **1.11:** Path traversal validation exists in `File.read()`/`File.list()` via `Instance.containsPath()` (symlinks can escape).
- **1.12:** `Skill.remove()` validates against registered skill registry before deletion.
- **2.2:** The `finally` block does run cleanup before `process.exit()`, but early `process.exit()` calls in handlers can still skip it.
- **2.4:** Agent steps are configurable; `Infinity` is only the default fallback.
- **2.7:** Rate limit detection exists but misses Anthropic/Google error formats.
- **2.10:** Only `task.ts:68` is correct; `orchestrator.ts:121` is unrelated code.
- **3.10:** `SessionSummary.summarize` properly awaits via `Promise.all`.
- **4.4:** Parallelism capped at 25 by `.slice(0, 25)`, not unbounded.
- **5.2:** Hardcoded `limit: 10` exists, just not configurable.
- **5.5:** Validated as `z.string()` but lacks semantic constraints.
- **5.11:** `JSON.parse` IS inside a try/catch; catch just doesn't handle parse errors gracefully.
- **5.15:** Default is 30s; only `timeout: 0` input produces 0ms.
- **5.16:** `process.env` stores strings only; `"0"` and `"false"` are truthy.
- **6.11:** Backoff is a fallback, not additive stacking. Corrected line range to 32-56.
- **7.3:** Code doesn't drop non-string entries; actual gap is only `plugin`/`instructions` are concatenated.
- **8.10:** Code mitigates content collisions via rest-spread + join.
- **9.9:** `webfetch.ts` has a 5MB limit; only `read.ts` is truly unbounded.
- **10.14:** Some descriptions exist but are weak (`"hash"`), not completely missing.
- **11.3:** Line 518 is branch deletion, not generation. Corrected to 271 only.
- **11.6:** Buffer IS bounded to 2MB. Concern is GC pressure from string concatenation.
- **11.9:** Cleanup IS called in all code paths.
