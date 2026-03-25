# AGENTS.md

Kilo CLI is an open source AI coding agent built as a Turborepo + Bun monorepo.

- **Default branch**: `main`
- **Run tests from `packages/opencode/`, NOT from root**
- All changes must be in your current working directory — never modify the main repo checkout

## Build, Test, Lint Commands

| Command               | Description                                      |
| --------------------- | ------------------------------------------------ |
| `bun run dev`         | Run dev server (from root)                       |
| `bun turbo typecheck` | Type-check all packages (uses `tsgo`, not `tsc`) |
| `bun run format`      | Run Prettier formatter                           |
| `bun run lint`        | Run ESLint                                       |

### Package-specific commands

**packages/opencode/**:

- `bun run dev` (runs `bun run --conditions=browser ./src/index.ts`)
- `bun run typecheck` (runs `tsgo --noEmit`)
- `bun test` (all tests, timeout 30s)
- `bun test test/tool/tool.test.ts` (single test file)

**packages/kilo-vscode/**:

- `bun run compile` (typecheck + lint + build)
- `bun run watch` (watch mode)
- `bun run test` (run tests)
- `bun run lint` / `bun run format`
- `bun script/local-bin.ts` (build CLI binary)

## Import Aliases

- `@/*` maps to `./src/*`
- `@tui/*` maps to `./src/cli/cmd/tui/*`

## Code Style Guidelines

### Naming (MANDATORY)

- Use **single word names** by default: `pid`, `cfg`, `err`, `opts`, `dir`, `state`
- Multi-word names only when single word is unclear
- Good: `const foo = condition ? 1 : 2`
- Bad: `const inputPID`, `existingClient`

### Variables and Control Flow

- Prefer `const` over `let`; use ternary or early returns
- Avoid `else` statements; use early returns
- Avoid `try`/`catch` where possible; if needed, never leave catch block empty

```ts
// Good
const foo = condition ? 1 : 2

function foo() {
  if (condition) return 1
  return 2
}

try {
  await save(data)
} catch (err) {
  log.error("save failed", { err })
}
```

### Imports

- Use named exports unless default is explicit
- Group imports: external → internal → relative
- ESLint enforces: camelCase/PascalCase for imports

### Types

- Avoid `any` type
- Rely on type inference; avoid explicit annotations unless needed for exports
- Use Zod schemas for input validation
- Use `z.infer<typeof Schema>` for type extraction

### Formatting

- Semicolons required
- No trailing commas
- Print width: 120 characters (from root prettier config)
- No padding in markdown table cells

### Other Rules

- Avoid unnecessary destructuring: use `obj.a` instead of `const { a } = obj`
- Use Bun APIs when possible: `Bun.file()`
- Keep things in one function unless composable/reusable
- ESLint enforces: curly braces, strict equality (`eqeqeq`), max 3000 lines per file

## Key Patterns (packages/opencode)

### Namespace Modules

Code is organized as TypeScript namespaces, not classes:

```ts
export namespace Session {
  export const Info = z.object({ ... })
  export type Info = z.infer<typeof Info>
  export const create = fn(z.object({ ... }), async (input) => { ... })
}
```

### Function Wrapping

- **`fn(schema, callback)`** — wraps functions with Zod input validation
- **`Tool.define(id, init)`** — tool definition pattern
- **`BusEvent.define(type, schema)`** — pub/sub events
- **`NamedError.create(name, schema)`** — structured errors with Zod schemas

### Lazy Singleton

```ts
const state = Instance.state(async () => ({ ... }))
// later: (await state()).someValue
```

### Logging

```ts
const log = Log.create({ service: "name" })
```

### IIFE Pattern

Use `iife()` to avoid `let` statements per style guide.

### Error Handling

Prefer `NamedError.create()` over throwing raw errors:

```ts
export const MyError = NamedError.create("MyError", z.object({ message: z.string() }))

throw MyError.create({ message: "something went wrong" })
```

## Testing

- **Avoid mocks** — test actual implementation
- Don't duplicate logic in tests
- Use `--timeout 30000` flag if tests may take longer

## Commit Conventions

[Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, etc.

- Scopes: `vscode`, `cli`, `agent-manager`, `sdk`, `ui`, `i18n`, `gateway`, `telemetry`
- Run `bun run format` before committing

## Fork Merge Process

Kilo CLI is a fork of [opencode](https://github.com/anomalyco/opencode).

- Place Kilo-specific code in `packages/opencode/src/kilocode/` or `packages/kilo-gateway/`
- Mark shared-code changes with `// kilocode_change` comments
- Don't use markers in files with `kilocode` in the path

## VS Code Extension (packages/kilo-vscode)

- VSCode commands must use `kilo-code.new.` prefix
- View IDs must use `kilo-code.new.` prefix, except sidebar uses `kilo-code.SidebarProvider`
- Max file sizes enforced by tests — do not raise caps
- Webview uses **SolidJS** (not React) with `@kilocode/kilo-ui` components
- Import kilo-ui via deep subpaths: `import { Button } from "@kilocode/kilo-ui/button"`
- Use `data-component` and `data-slot` attributes for kilo-ui styling
- Debug output must be prepended with `[Kilo New]`

## Storage

Filesystem-based JSON, not a database. Data lives in `~/.local/share/kilo/storage/`.

## Server (Hono)

Hono-based HTTP server with OpenAPI spec generation. SSE for real-time events.

## TUI

Built with **SolidJS + OpenTUI** (`@opentui/solid`) — a terminal UI framework. JSX renders to terminal elements like `<box>`, `<text>`, `<scrollbox>`.
