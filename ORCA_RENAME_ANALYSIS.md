# ORCA Rename Analysis

This document analyzes the feasibility of renaming Kilo to ORCA throughout the codebase and outlines a phased migration strategy.

## Overview

This is a **fork of Kilo CLI** (which itself is a fork of OpenCode). The rename to ORCA is a branding change for a differentiated product while maintaining upstream merge compatibility.

---

## What Can Be Changed (Safe)

### 1. Package Names and Directory Structure

| Current                    | Proposed                   | Risk |
| -------------------------- | -------------------------- | ---- |
| `packages/kilo-vscode/`    | `packages/orca-vscode/`    | Low  |
| `packages/kilo-gateway/`   | `packages/orca-gateway/`   | Low  |
| `packages/kilo-telemetry/` | `packages/orca-telemetry/` | Low  |
| `packages/kilo-i18n/`      | `packages/orca-i18n/`      | Low  |
| `packages/kilo-ui/`        | `packages/orca-ui/`        | Low  |
| `packages/kilo-docs/`      | `packages/orca-docs/`      | Low  |
| `@kilocode/cli`            | `@orca/cli`                | Low  |
| `@kilocode/plugin`         | `@orca/plugin`             | Low  |
| `@kilocode/kilo-gateway`   | `@orca/gateway`            | Low  |
| `@kilocode/kilo-telemetry` | `@orca/telemetry`          | Low  |
| `@kilocode/kilo-i18n`      | `@orca/i18n`               | Low  |
| `@kilocode/kilo-ui`        | `@orca/ui`                 | Low  |
| `@kilocode/kilo-docs`      | `@orca/docs`               | Low  |

### 2. CLI Binary and Commands

| Current       | Proposed      | Risk |
| ------------- | ------------- | ---- |
| Binary `kilo` | Binary `orca` | Low  |
| `kilo run`    | `orca run`    | Low  |
| `kilo serve`  | `orca serve`  | Low  |
| `kilo web`    | `orca web`    | Low  |
| `kilo tui`    | `orca tui`    | Low  |
| `kilo auth`   | `orca auth`   | Low  |

### 3. VS Code Extension

| Current                    | Proposed                   | Risk |
| -------------------------- | -------------------------- | ---- |
| Extension ID `kilo-code`   | Extension ID `orca-code`   | Low  |
| Publisher `kilocode`       | Publisher `orca`           | Low  |
| Commands `kilo-code.new.*` | Commands `orca-code.new.*` | Low  |
| View IDs `kilo-code.*`     | View IDs `orca-code.*`     | Low  |

### 4. Configuration Files

| Current                         | Proposed                 | Risk                           |
| ------------------------------- | ------------------------ | ------------------------------ |
| Config file `kilo.json`         | Config file `orca.json`  | Medium (needs backward compat) |
| Config file `kilo.jsonc`        | Config file `orca.jsonc` | Medium (needs backward compat) |
| Config dir `.kilo/`             | Config dir `.orca/`      | Medium (needs backward compat) |
| Global config `~/.config/kilo/` | `~/.config/orca/`        | Medium (needs backward compat) |

### 5. Environment Variables

| Current                | Proposed               | Risk   |
| ---------------------- | ---------------------- | ------ |
| `KILO_*` (flags)       | `ORCA_*`               | Medium |
| `KILO_SERVER_PASSWORD` | `ORCA_SERVER_PASSWORD` | Medium |
| `KILO_SERVER_USERNAME` | `ORCA_SERVER_USERNAME` | Medium |
| `KILO_API_KEY`         | `ORCA_API_KEY`         | Medium |
| `KILO_ORG_ID`          | `ORCA_ORG_ID`          | Medium |
| `KILO_CONFIG_DIR`      | `ORCA_CONFIG_DIR`      | Medium |
| `KILO_DISABLE_SHARE`   | `ORCA_DISABLE_SHARE`   | Medium |

---

## What Cannot/Should Not Be Changed

### 1. External API Integrations

These connect to external services and **must remain unchanged**:

| Item                      | Current                           | Reason           |
| ------------------------- | --------------------------------- | ---------------- |
| Provider ID `kilo`        | Routes to `api.kilo.ai`           | External API     |
| Provider ID `kilo-auto/*` | Hosted models via kilo            | External API     |
| `KILO_OPENROUTER_BASE`    | OpenRouter integration            | External API     |
| `models.dev` URL          | Model listing API                 | External API     |
| `api.kilo.ai`             | Gateway API                       | External service |
| Warpgrep proxy URL        | `https://api.kilo.ai/api/gateway` | External service |

### 2. SDK and Auto-generated Code

| Item                          | Current                     | Reason          |
| ----------------------------- | --------------------------- | --------------- |
| SDK import `@kilocode/sdk`    | Auto-generated from OpenAPI | Must regenerate |
| SDK client `createKiloClient` | Auto-generated              | Must regenerate |
| OpenAPI spec                  | Server API definition       | Must regenerate |

### 3. Upstream Merge Markers

| Item                          | Current                | Reason                     |
| ----------------------------- | ---------------------- | -------------------------- |
| `kilocode_change` markers     | Merge conflict markers | Required for upstream sync |
| Files with `kilocode` in path | Kilo-specific code     | Don't mark these           |

### 4. Internal Provider Logic

The following are hardcoded to work with Kilo's hosted services:

- Kilo auth provider (`Auth.get("kilo")`)
- Kilo cloud sessions
- Kilo profile/organization calls
- Telemetry to PostHog

---

## Implementation Phases

### Phase 1: Branding Changes (Low Risk)

**Goal**: Change visible product name to ORCA without affecting functionality.

1. Rename CLI binary `kilo` → `orca`
2. Rename package directories `kilo-*` → `orca-*`
3. Update package.json names
4. Update VS Code extension ID and publisher
5. Add config file fallback (read `kilo.json` if `orca.json` doesn't exist)
6. Keep backward compatibility with `KILO_*` env vars

**Files to modify**:

- All `packages/*/package.json`
- `packages/opencode/bin/kilo`
- `packages/opencode/src/index.ts` (script name)
- `packages/opencode/src/global/index.ts`
- Config loading code
- VS Code extension commands

### Phase 2: Gateway Fork (Medium Risk)

**Goal**: Set up your own auth/provider routing.

1. Fork or set up your own `api.orca.ai` endpoint
2. Create `ORCA_OPENROUTER_BASE` pointing to your gateway
3. Add `orca` as a new provider alongside `kilo`
4. Update environment variables to support both

### Phase 3: Full Separation (High Risk)

**Goal**: Completely independent product.

1. Remove all `kilo` provider references
2. Set up own model marketplace
3. Remove dependency on `api.kilo.ai`
4. Fork the SDK generation

---

## Current Code References Summary

### Package.json Dependencies (149+ references)

- `@kilocode/cli`
- `@kilocode/plugin`
- `@kilocode/sdk`
- `@kilocode/kilo-gateway`
- `@kilocode/kilo-telemetry`

### Source Code References (600+ references)

**packages/opencode/src/**:

- Binary name in 20+ files
- Config file names (`kilo.json`, `.kilo/`)
- Environment variable checks (`KILO_*`)
- Provider IDs (`kilo`, `kilo-auto/*`)
- Auth provider (`Auth.get("kilo")`)

**packages/kilo-vscode/src/**:

- Extension commands (100+ `kilo-code.new.*`)
- Configuration keys
- Telemetry service names
- Market API URLs

---

## Risk Assessment

| Change                  | Risk Level | Rollback Complexity |
| ----------------------- | ---------- | ------------------- |
| Package rename          | Low        | Easy                |
| Binary rename           | Low        | Easy                |
| Config fallback         | Low        | Easy                |
| Env vars (add ORCA\_\*) | Medium     | Moderate            |
| Provider rename         | High       | Complex             |
| External API fork       | Very High  | Very Complex        |

---

## Recommendations

1. **Start with Phase 1 only** - It's safe and reversible
2. **Maintain backward compatibility** - Always read old config files/env vars
3. **Don't touch the provider ID** - Keep `kilo` for external API access
4. **Use `kilocode_change` markers** - For any shared code changes
5. **Test thoroughly** - Run full test suite after each change

---

## Notes

- This analysis was performed on commit with version `7.0.51`
- The codebase uses Bun as package manager
- Turborepo manages the monorepo
- ESLint/Prettier enforce code style
- Type checking uses `tsgo`
