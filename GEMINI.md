# GEMINI.md

## Project Overview

Orca is an advanced, multi-agent AI coding platform built as a high-performance monorepo. It is a fork of [OpenCode](https://github.com/anomalyco/opencode) and serves as the foundation for the **Kilo CLI**. The project aims to provide a superior agentic engineering experience through persistent project memory, multi-agent orchestration, and a distinctive terminal UI.

### Key Technologies
- **Runtime & Package Manager:** [Bun](https://bun.sh/)
- **Monorepo Management:** [Turborepo](https://turbo.build/)
- **Language:** TypeScript
- **Validation:** [Zod](https://zod.dev/)
- **UI Frameworks:** [SolidJS](https://www.solidjs.com/) (Web), [Tauri](https://tauri.app/) (Desktop), [React/Ink](https://github.com/vadimdemedes/ink) (Terminal UI)
- **Database:** SQLite (via Drizzle ORM), mem0/Letta for persistent memory
- **AI Integration:** Extensive support for 500+ models via [OpenRouter](https://openrouter.ai/) and direct providers.

---

## Building and Running

The project uses Bun for all development tasks. Execute commands from the root directory unless specified otherwise.

### Key Commands
- **Dev (Root):** `bun run dev` (Starts the CLI in development mode)
- **Dev (Web):** `bun run dev:web`
- **Dev (Desktop):** `bun run dev:desktop`
- **Type-check:** `bun turbo typecheck`
- **Lint:** `bun run lint`
- **Format:** `bun run format` (Uses Prettier)

### Package-Specific Commands
- **CLI (`packages/opencode`):**
  - `bun test` - Run unit and integration tests (Always run from this directory)
  - `bun run dev` - Run the CLI locally
- **VS Code Extension (`packages/kilo-vscode`):**
  - `bun run compile` - Build the extension
  - `bun run watch` - Development watch mode

---

## Development Conventions

### Coding Style (Mandatory)
Adhere to the standards defined in `AGENTS.md`:
- **Naming:** Use single-word names by default (`cfg`, `err`, `opts`, `pid`). Use multi-word names only when clarity is compromised.
- **Immutability:** Prefer `const` over `let`. Use ternaries or early returns to avoid re-assignment.
- **Control Flow:** Avoid `else` statements; use early returns for cleaner logic.
- **Error Handling:** Avoid empty `try/catch` blocks. Always log or handle errors appropriately.
- **Type Safety:** Minimize the use of `any`. Rely on type inference for local variables and use Zod schemas for all input/output validation.
- **Abstractions:** Use the established patterns:
  - `fn(schema, callback)` for validated functions.
  - `Tool.define(id, init)` for agent tools.
  - `BusEvent.define(type, schema)` for event-driven communication.

### Testing Philosophy
- **Real Implementations:** Avoid mocks where possible. Test the actual logic to ensure behavioral correctness.
- **Location:** Place tests in the `test/` directory within each package.

---

## Project Structure

- `packages/opencode`: Core CLI and agent logic. This is the primary engine of the platform.
- `packages/app`: The web-based frontend application.
- `packages/desktop`: The Tauri-based desktop application.
- `packages/kilo-vscode`: The VS Code extension source.
- `plan/`: Comprehensive strategic roadmap and specifications for the Orca evolution.
- `specs/`: Detailed technical specifications for UI, Memory, and Orchestration.
- `sdks/`: Software Development Kits for various platforms.

---

## Orca Strategic Roadmap

The `plan/ORCA_PLAN.md` outlines the transition to a multi-agent system:
1. **Foundation:** Infrastructure and base module patterns.
2. **Memory Engine:** Persistent context using semantic search and vector backends.
3. **UI Enhancement:** A distinctive blue-themed terminal interface.
4. **Orchestration:** Coordination of specialized agents (Architect, Builder, Tester, Reviewer).
5. **Tools Extension:** Custom tools for advanced developer workflows.
