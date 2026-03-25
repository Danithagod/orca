# Phase 1: Foundation

**Duration:** Week 1-2  
**Status:** Not Started

---

## Objectives

- Set up core infrastructure for Orca
- Create base module structure
- Establish architectural patterns
- Set up development environment

---

## Tasks

### 1.1 Project Setup

- [ ] Create `packages/opencode/src/orca/` directory structure
- [ ] Set up TypeScript configuration for Orca modules
- [ ] Configure build pipeline for new code
- [ ] Add required dependencies to package.json
- [ ] Set up testing framework for Orca modules

### 1.2 Core Types

- [ ] Define base types in `orca/types.ts`
- [ ] Create Zod schemas for core concepts
- [ ] Set up namespace modules:
  - [ ] `Memory` namespace
  - [ ] `Orchestrator` namespace
  - [ ] `Tool` namespace
  - [ ] `UI` namespace

### 1.3 Module Infrastructure

- [ ] Create `Instance.state` pattern for singletons
- [ ] Set up event bus for inter-module communication
- [ ] Create error handling patterns (NamedError)
- [ ] Set up logging infrastructure

### 1.4 Configuration

- [ ] Define configuration schema
- [ ] Create config loading mechanism
- [ ] Support environment variables
- [ ] Add validation for config values

---

## Deliverables

| Deliverable         | Description                          |
| ------------------- | ------------------------------------ |
| Directory Structure | Complete orca module directory       |
| Type Definitions    | Core types and Zod schemas           |
| Module Pattern      | Namespace-based module pattern       |
| Config System       | Configuration loading and validation |
| Test Setup          | Testing infrastructure               |

---

## Dependencies

- Zod for schema validation
- Bun runtime APIs
- Existing opencode infrastructure

---

## Technical Notes

### Directory Structure

```
packages/opencode/src/orca/
├── index.ts              # Main exports
├── types.ts              # Core type definitions
├── config.ts             # Configuration
├── errors.ts             # Custom errors
├── events.ts             # Event definitions
├── memory/
│   ├── index.ts
│   └── ...
├── orchestrator/
│   ├── index.ts
│   └── ...
├── ui/
│   ├── index.ts
│   └── ...
├── tools/
│   ├── index.ts
│   └── ...
└── commands/
    ├── index.ts
    └── ...
```

### Module Pattern

```typescript
// Use namespace pattern similar to existing opencode code
export namespace Orca {
  export const Config = z.object({
    memory: MemoryConfig,
    orchestrator: OrchestratorConfig,
    ui: UIConfig,
  })

  export type Config = z.infer<typeof Config>

  export const create = fn(Config, async (config) => {
    // Initialize Orca
    return { instance: orcaInstance }
  })
}
```

---

## Success Criteria

- [ ] All TypeScript compiles without errors
- [ ] Tests pass for core modules
- [ ] Module structure follows opencode patterns
- [ ] Configuration loads correctly
- [ ] Logging works as expected
