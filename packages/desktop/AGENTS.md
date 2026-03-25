# Repository Guidelines

## Project Structure & Module Organization

`packages/desktop` is the Tauri desktop shell for OpenCode. Put SolidJS and browser-facing code in `src/`, with locale bundles in `src/i18n/`. Keep native Rust code in `src-tauri/src/`; Tauri config variants live beside it as `src-tauri/tauri*.conf.json`. Use `scripts/` for release and packaging helpers, and keep installer assets and icons under `src-tauri/assets/` and `src-tauri/icons/`.

## Build, Test, and Development Commands

Run commands from this directory unless noted otherwise.

- `bun run dev`: starts the Vite frontend only.
- `bun run tauri dev`: launches the full desktop app with Tauri.
- `bun run build`: runs TypeScript checks and creates the production web bundle.
- `bun run typecheck`: runs `tsgo -b` for this package.
- `bun run tauri build`: builds native desktop bundles.
- From the repo root, `bun run dev:desktop` is the shortest way to start desktop development.

Install dependencies once from the repo root with `bun install`. Tauri builds also require the Rust toolchain and platform prerequisites.

## Coding Style & Naming Conventions

Frontend code is TypeScript + SolidJS; native code is Rust. Follow the root Prettier settings: no semicolons and a 120-character line width. Use 2-space indentation in TS/CSS and 4 spaces in Rust, matching existing files. Prefer small, focused modules and keep imports grouped external -> workspace -> relative. Follow existing file naming patterns such as `webview-zoom.ts`, `loading.tsx`, and `window_customizer.rs`. Keep TypeScript strict and avoid `any`.

## Testing Guidelines

This package does not currently define a dedicated test script. Minimum validation for every change is:

- `bun run typecheck`
- `bun run build`
- a smoke test with `bun run tauri dev`

For native changes, manually verify the affected platform path, such as windowing, deep links, clipboard, or updater behavior.

## Commit & Pull Request Guidelines

Use Conventional Commit subjects, as seen in history: `fix(app): ...`, `refactor: ...`, `chore: ...`. Keep commits narrowly scoped to `packages/desktop`. PRs should explain user-visible impact, list platforms tested, link the issue when applicable, and include screenshots or GIFs for UI or windowing changes.

## Contributor Scope

Keep edits inside this package unless a change clearly requires a shared dependency update. Do not modify the main repo checkout from here.
