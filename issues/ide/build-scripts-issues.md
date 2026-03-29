# Tauri Desktop App — Build Scripts & Miscellaneous Issues

> Package: `packages/desktop/scripts/`, `packages/desktop/src-tauri/src/`
> Generated: 2026-03-28
> Verified: 2026-03-28
> Scope: Build scripts (predev, prepare, copy-bundles, finalize-latest-json, utils), logging, constants, markdown parser

---

## Critical

| #   | Issue                                             | File                              | Line(s) | Details                                                                                                                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------- | --------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Wrong variable checked for version validation** | `scripts/finalize-latest-json.ts` | 24      | `const version = process.env.OPENCODE_VERSION` then `if (!releaseId) throw new Error("OPENCODE_VERSION is required")`. Checks `!releaseId` (already validated on line 21) instead of `!version`. If `OPENCODE_VERSION` is unset, passes silently and `version` is `undefined` — URLs generated with `"vundefined"`. **Fix:** Change to `if (!version) throw ...`. |

## High

| #   | Issue                             | File                      | Line(s) | Details                                                                                                                                                                                                                                  |
| --- | --------------------------------- | ------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2   | **`cp -r` not cross-platform**    | `scripts/copy-bundles.ts` | 12      | `await $\`cp -r ${BUNDLE*DIR}/*/OpenCode\_ ${BUNDLES_OUT_DIR}\``— Unix-only command. Fails on Windows (current dev platform).`scripts/utils.ts:52`already uses`node:fs/promises`correctly. **Fix:** Use Bun's`copyFile`or`node:fs` APIs. |
| 3   | **`mkdir -p` not cross-platform** | `scripts/prepare.ts`      | 16      | `await $\`mkdir -p ${dir}\``— same Unix-only issue. **Fix:** Use`mkdir`from`node:fs/promises`(already done in`utils.ts`).                                                                                                                |

## Medium

| #   | Issue                                          | File                        | Line(s) | Details                                                                                                                                                                                                                                                                       |
| --- | ---------------------------------------------- | --------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4   | **Error message uses wrong variable**          | `scripts/utils.ts`          | 40      | `getCurrentSidecar(target = RUST_TARGET)` — when `target` is explicitly passed, error still references `RUST_TARGET` (module-level env var). If `RUST_TARGET` is undefined but `target` was passed, error reads `'undefined'`. **Fix:** Change error message to use `target`. |
| 5   | **`tail()` reads entire log file into memory** | `src-tauri/src/logging.rs`  | 54      | `BufReader::new(file).lines().map_while(Result::ok).collect()` collects all lines before slicing. A 7-day-old multi-MB log file causes memory spike. **Fix:** Use ring buffer or read backwards from end of file.                                                             |
| 6   | **Log filename still `opencode-desktop`**      | `src-tauri/src/logging.rs`  | 18      | `format!("opencode-desktop_{timestamp}.log")` — should be `kilo-desktop`. Makes debugging confusing for users.                                                                                                                                                                |
| 7   | **Log filter references `opencode_lib`**       | `src-tauri/src/logging.rs`  | 30-32   | `EnvFilter::new("opencode_lib=debug,opencode_desktop=debug,sidecar=debug")` — library crate is `kilo_lib`.                                                                                                                                                                    |
| 8   | **XSS via markdown `unsafe=true`**             | `src-tauri/src/markdown.rs` | 20, 50  | `options.render.r#unsafe = true` bypasses `dangerous_url` check. See security-issues.md #5.                                                                                                                                                                                   |

## Low

| #   | Issue                              | File                              | Line(s) | Details                                                                                                                                                                              |
| --- | ---------------------------------- | --------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 9   | **Import used before declaration** | `scripts/finalize-latest-json.ts` | 6-15    | `parseArgs` used on line 6, imported on line 15. Bun hoists imports but confusing under other runtimes. **Fix:** Move import to top of file.                                         |
| 10  | **Hardcoded `/tmp` fallback**      | `scripts/finalize-latest-json.ts` | 146-147 | `const dir = process.env.RUNNER_TEMP ?? "/tmp"` — `/tmp` doesn't exist on Windows. **Fix:** Use `os.tmpdir()` or `Bun.env.TEMP`.                                                     |
| 11  | **Stale sidecar on build failure** | `scripts/predev.ts`               | 11-13   | If `bun run build` fails, script exits without copying new binary. Old sidecar remains. Next invocation may launch mismatched version. **Fix:** Clean sidecar dir before build step. |
| 12  | **Constants are acceptable**       | `src-tauri/src/constants.rs`      | —       | No issues found. Constants properly organized with clear naming. `UPDATER_ENABLED` correctly uses `option_env!`.                                                                     |

## Summary

| Severity  | Count  |
| --------- | ------ |
| Critical  | 1      |
| High      | 2      |
| Medium    | 5      |
| Low       | 4      |
| **Total** | **12** |
