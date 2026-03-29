# Tauri Desktop App — Frontend TypeScript Issues

> Package: `packages/desktop/src/`
> Generated: 2026-03-28
> Verified: 2026-03-28
> Scope: App entry, platform adapter, menu, updater, CLI management, webview zoom, loading screen, bindings

---

## High

| #   | Issue                                                | File              | Line(s) | Details                                                                                                                                                                                                                                                                            |
| --- | ---------------------------------------------------- | ----------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **`UPDATER_ENABLED` read at module evaluation time** | `updater.ts`      | 9       | `window.__KILO__?.updaterEnabled` read once at import time. If `__KILO__` isn't set yet (timing issue with Tauri's init script), silently defaults to `false`, permanently disabling the updater for the session. **Fix:** Defer to lazy evaluation inside `checkForUpdate()`.     |
| 2   | **Fire-and-forget `listenForDeepLinks()`**           | `index.tsx`       | 411     | `void listenForDeepLinks()` discards errors silently. `onOpenUrl` at line 59 uses `.catch(() => undefined)` — if deep-link plugin errors, fails silently with no retry or logging. **Fix:** Add error logging and user feedback.                                                   |
| 3   | **Server init failure silently swallowed**           | `loading.tsx`     | 37      | `commands.awaitInitialization(channel as any).catch(() => undefined)` — if server fails to start (port conflict, missing binary), error is swallowed. Loading screen shows indefinitely with no error state. User stuck. **Fix:** Add error state handling with retry/fallback UI. |
| 4   | **Fire-and-forget webview zoom invoke**              | `webview-zoom.ts` | 20-22   | `invoke("plugin:webview\|set_webview_zoom", ...)` not awaited, no error handling. If Tauri command fails, UI zoom signal updates but actual webview zoom doesn't — state desync. **Fix:** Await the invoke and handle errors; rollback zoom state on failure.                      |

## Medium

| #   | Issue                                                 | File          | Line(s) | Details                                                                                                                                                                                                                                                                                           |
| --- | ----------------------------------------------------- | ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5   | **`as any` type assertions in `handleWslPicker`**     | `index.tsx`   | 77, 79  | Both `Promise.all(...)` and single-value branch use `as any` to cast return type. Bypasses type safety entirely. **Fix:** Use proper generic cast or type guard.                                                                                                                                  |
| 6   | **Updater install silently swallows errors**          | `index.tsx`   | 296-300 | `update.install().catch(() => undefined)` returns no feedback on failure. Compare with `updater.ts:44` which properly shows error dialog. `Platform.update()` is a dead-end for error reporting. **Fix:** Show error dialog on install failure.                                                   |
| 7   | **`restart()` ignores `killSidecar` failure**         | `index.tsx`   | 302-305 | If sidecar kill fails, `relaunch()` still runs, potentially leaving zombie sidecar process. **Fix:** Check kill result before relaunching.                                                                                                                                                        |
| 8   | **Missing cleanup for visibility/pagehide listeners** | `index.tsx`   | 151-158 | Storage factory registers `visibilitychange` and `pagehide` listeners at module level (outside component lifecycle). Never cleaned up. Low risk in Tauri webview but violates best practice.                                                                                                      |
| 9   | **Double sidecar kill on Windows**                    | `updater.ts`  | 42, 49  | `commands.killSidecar()` called inside try block (Windows only) and again unconditionally after install succeeds. Second call is redundant. **Fix:** Remove duplicate kill.                                                                                                                       |
| 10  | **Error matching via string substring**               | `cli.ts`      | 6-30    | `String(error)` substring matching depends on exact strings from Rust backend. Any error message change silently breaks translation mapping. **Fix:** Use error codes or structured error objects.                                                                                                |
| 11  | **Non-null assertion on `document.getElementById`**   | `loading.tsx` | 13      | `document.getElementById("root")!` throws unhelpful error if element missing. Compare with `index.tsx:38-40` which has proper dev-mode check.                                                                                                                                                     |
| 12  | **`t()` called before `initI18n()` resolves**         | `loading.tsx` | 14-18   | `lines` array uses `t()` at module level, but `initI18n()` may not have resolved. Works by coincidence (synchronous English fallback). Fragile if initialization flow changes. **Fix:** Move `t()` calls inside component or after init promise.                                                  |
| 13  | **Channel created outside `onMount`**                 | `loading.tsx` | 35-37   | `Channel` and `awaitInitialization` at render function level, not inside `onMount`. Note: SolidJS render functions execute exactly once (not on re-renders), so the "every render cycle" concern is overstated. Code organization concern is still valid. **Fix:** Move into `onMount` lifecycle. |

## Low

| #   | Issue                                            | File              | Line(s) | Details                                                                                                                                                                                                                               |
| --- | ------------------------------------------------ | ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14  | **Module-level mutable `let update`**            | `index.tsx`       | 44      | Global `let update: Update \| null = null` shared across Platform singleton. Concurrent `checkUpdate` calls could race on overwrite. **Fix:** Use `useState` or ensure single-flight.                                                 |
| 15  | **Non-null assertion `window.__KILO__!.wsl`**    | `index.tsx`       | 345     | `!` assertion crashes if `__KILO__` undefined. Inconsistent with safe `?.` pattern on line 70 (`!window.__KILO__?.wsl`). **Fix:** Use optional chaining.                                                                              |
| 16  | **`channel as any` type assertion**              | `index.tsx`       | 501     | `Channel<InitStep>` cast to `any` at line 501 — suggests type mismatch in Specta bindings. **Fix:** Fix the type definition.                                                                                                          |
| 17  | **`menuTrigger` module-level mutable state**     | `index.tsx`       | 407-409 | Callback set inside render tree via `Inner` component. Stale closure risk if component mounts/unmounts.                                                                                                                               |
| 18  | **No error handling for failed dynamic imports** | `entry.tsx`       | 1-5     | If `./loading` or `./` fails to load, error is unhandled. **Fix:** Add `.catch()` or error boundary.                                                                                                                                  |
| 19  | **`createMenu` calls `initI18n()` redundantly**  | `menu.ts`         | 14      | `await initI18n()` at line 14; also called at top level in `index.tsx:42`. Idempotent but creates unnecessary dependency.                                                                                                             |
| 20  | **`.filter(Boolean)` is a no-op**                | `menu.ts`         | 62      | All items are `await`ed objects — always truthy. Filter does nothing.                                                                                                                                                                 |
| 21  | **Commented-out "Release Notes" menu item**      | `menu.ts`         | 172-174 | Dead code.                                                                                                                                                                                                                            |
| 22  | **Download error doesn't distinguish types**     | `updater.ts`      | 28-33   | Generic "download failed" message regardless of network timeout, disk full, or permission error. **Fix:** Differentiate error types.                                                                                                  |
| 23  | **`path` variable naming concern**               | `cli.ts`          | 36      | `const path = await commands.installCli()` — `path` module is not currently imported, so no actual shadowing occurs. But if `path` is imported later, this would shadow it. **Fix:** Rename to `installPath` as a defensive practice. |
| 24  | **Global keydown listener never cleaned up**     | `webview-zoom.ts` | 25-35   | `window.addEventListener("keydown", ...)` at module load with no `removeEventListener`. Acceptable in practice but violates cleanup principle.                                                                                        |
| 25  | **No input field guard on zoom shortcut**        | `webview-zoom.ts` | 25-35   | Zoom shortcut fires globally, including when typing in text inputs. **Fix:** Check `event.target` is not `<input>`, `<textarea>`, or `contentEditable`.                                                                               |
| 26  | **`!important` usage in styles**                 | `styles.css`      | 6       | One `!important` override for decorum styles on line 6 (`height: calc(var(--spacing) * 10) !important;`). Fragile if decorum library changes selectors. **Fix:** Use more specific selectors or CSS layers.                           |

## Info

| #   | Issue                                            | File          | Line(s) | Details                                                                                                                                                          |
| --- | ------------------------------------------------ | ------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 27  | **Complex `emit` type cast via `as unknown as`** | `bindings.ts` | 57, 63  | Conditional return type achieved via double cast — type safety escape hatch. Auto-generated file; fix should be in Specta generator or Rust command definitions. |

## Summary

| Severity  | Count  |
| --------- | ------ |
| High      | 4      |
| Medium    | 9      |
| Low       | 13     |
| Info      | 1      |
| **Total** | **27** |
