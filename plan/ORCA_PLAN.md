# Orca - AI Coding Agent Plan

## Overview

Orca is an advanced AI coding agent designed for superior agent orchestration with persistent project memory and a distinctive terminal UI experience.

### Key Features

1. **Agent Orchestration** - Multi-agent coordination and task delegation
2. **Persistent Memory Engine** - Context preservation across sessions
3. **Distinctive UI** - Blue-themed interface with rounded elements
4. **Custom Commands** - Extended command vocabulary for developer workflows

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        ORCA CLI                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   UI Layer  │  │   Memory    │  │    Orchestrator    │  │
│  │  (Blue UI)  │  │   Engine    │  │   (Multi-Agent)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │                │                    │              │
│         └────────────────┼────────────────────┘              │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              Tool Layer (Enhanced)                    │   │
│  │  Memory Tools | Orchestration Tools | Enhanced Base  │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Detailed Specifications

| Specification              | Description                             | Location                                                   |
| -------------------------- | --------------------------------------- | ---------------------------------------------------------- |
| UI Specification           | Blue theme, rounded corners, components | [specs/ui-spec.md](./specs/ui-spec.md)                     |
| Memory Specification       | Memory engine, backends, embeddings     | [specs/memory-spec.md](./specs/memory-spec.md)             |
| Orchestrator Specification | Agent types, coordination, strategies   | [specs/orchestrator-spec.md](./specs/orchestrator-spec.md) |
| Tools Specification        | Memory tools, orchestration tools       | [specs/tools-spec.md](./specs/tools-spec.md)               |

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Location:** [01-foundation/](./01-foundation/)

**Goals:**

- Set up core infrastructure
- Create base module structure
- Establish architectural patterns

**Key Tasks:**

- Create `packages/opencode/src/orca/` directory structure
- Define base types and Zod schemas
- Set up namespace modules (Memory, Orchestrator, Tool, UI)
- Create configuration system

**Deliverables:**

- Directory structure
- Type definitions
- Module pattern
- Config system

---

### Phase 2: Memory Engine (Week 3-4)

**Location:** [02-memory-engine/](./02-memory-engine/)

**Goals:**

- Implement persistent memory system
- Enable context preservation across sessions
- Integrate memory with tool execution

**Key Tasks:**

- Create memory backend interface
- Implement SQLite + vector storage (local backend)
- Add mem0 integration
- Implement semantic search
- Add context hooks

**Deliverables:**

- Local backend (SQLite + vector)
- mem0 backend adapter
- Memory operations (store, recall, search, list, delete)
- Context injection hooks
- Memory CLI commands

---

### Phase 3: UI Enhancement (Week 5-6)

**Location:** [03-ui-enhancement/](./03-ui-enhancement/)

**Goals:**

- Implement blue-themed terminal UI
- Create rounded activity area components
- Build memory visualization widgets

**Key Tasks:**

- Define blue color palette (#0066CC primary)
- Implement rounded box rendering
- Create activity card components
- Build memory widget
- Add agent status panel

**Deliverables:**

- Color system
- Box drawing utilities
- Core UI components (Activity Card, Status Indicator, Memory Widget, Agent Panel)
- Layout system
- Animation framework

---

### Phase 4: Orchestration (Week 7-8)

**Location:** [04-orchestration/](./04-orchestration/)

**Goals:**

- Implement multi-agent orchestration
- Create specialized agent types
- Build task delegation system

**Key Tasks:**

- Define agent types (Architect, Builder, Tester, Reviewer, Memory Keeper)
- Create task system
- Implement coordination strategies
- Build agent state management

**Deliverables:**

- Agent definitions
- Task management
- Coordination strategies (Sequential, Parallel, Hierarchical, Vote, Race)
- Agent CLI commands

---

### Phase 5: Tools Extension (Week 9-10)

**Location:** [05-tools-extension/](./05-tools-extension/)

**Goals:**

- Create custom tools for Orca
- Enhance existing tools with memory integration
- Build orchestration tools

**Key Tasks:**

- Create enhanced tool definition pattern
- Implement memory tools (store, recall, search, list, forget)
- Implement orchestration tools (agent_spawn, delegate, status, etc.)
- Add memory hooks to base tools

**Deliverables:**

- Tool framework
- Memory tools (5 tools)
- Orchestration tools (6 tools)
- Enhanced base tools (Read, Edit, Bash, Glob, Grep)
- Tool registry

---

### Phase 6: Integration (Week 11-12)

**Location:** [06-integration/](./06-integration/)

**Goals:**

- Integrate all Orca components
- Connect UI with backend
- Build end-to-end workflows
- Finalize CLI commands

**Key Tasks:**

- Connect UI components to memory engine
- Connect UI components to orchestrator
- Implement all CLI commands
- Test end-to-end workflows
- Optimize performance
- Complete documentation

**Deliverables:**

- Integrated system
- All commands functional
- End-to-end workflows
- Performance optimization
- Documentation

---

## Success Metrics

| Metric                       | Target  |
| ---------------------------- | ------- |
| Memory retrieval accuracy    | > 90%   |
| Memory context injection     | 100%    |
| Session context preservation | 100%    |
| UI rendering time            | < 100ms |
| Multi-agent task completion  | > 85%   |
| Agent coordination latency   | < 500ms |
| User satisfaction score      | > 4.5/5 |
| Command execution time       | < 200ms |

---

## Tech Stack

### Dependencies to Add

```json
{
  "dependencies": {
    "@mem0/sdk": "^1.0.0",
    "better-sqlite3": "^9.0.0",
    "@orama/orama": "^2.0.0"
  }
}
```

### Existing Dependencies

- Zod (schema validation)
- Bun runtime APIs
- Existing opencode infrastructure

---

## File Structure

```
packages/opencode/src/orca/
├── index.ts              # Main exports
├── types.ts              # Core type definitions
├── config.ts             # Configuration
├── memory/
│   ├── index.ts          # Memory exports
│   ├── engine.ts         # Memory engine
│   ├── backends/         # Storage backends
│   ├── embeddings/       # Embedding providers
│   ├── hooks/            # Context hooks
│   └── commands/         # Memory commands
├── orchestrator/
│   ├── index.ts          # Orchestrator exports
│   ├── agents/           # Agent definitions
│   ├── strategies/       # Coordination strategies
│   ├── state/            # State management
│   └── commands/         # Orchestration commands
├── ui/
│   ├── index.ts          # UI exports
│   ├── components/       # UI components
│   ├── theme/            # Colors and styles
│   ├── renderer/         # Terminal rendering
│   └── layout/           # Layout components
├── tools/
│   ├── index.ts          # Tool exports
│   ├── memory/           # Memory tools
│   ├── orchestrator/     # Orchestration tools
│   └── enhanced/         # Enhanced base tools
└── commands/
    └── index.ts          # Command routing
```

---

## Design Principles

### Memory Engine

- **Pluggable backends**: Start with local (SQLite), support mem0/Letta
- **Semantic search**: Vector embeddings for relevance
- **Auto-capture**: Extract insights automatically from tool execution

### UI Design

- **Blue primary**: #0066CC with cyan accents
- **Rounded corners**: 12px border-radius on activity areas
- **Progressive enhancement**: Basic terminal → full UI

### Agent Orchestration

- **Specialized agents**: Architect, Builder, Tester, Reviewer, Memory Keeper
- **Flexible strategies**: Sequential, Parallel, Hierarchical, Vote, Race
- **State persistence**: Agent state survives across sessions

### Tool Integration

- **Memory hooks**: Auto-inject context, capture learnings
- **Enhanced existing tools**: Add memory to Read, Edit, Bash
- **New tools**: Memory and orchestration specific

---

## Next Steps

1. Review detailed specifications in [specs/](./specs/)
2. Begin Phase 1 implementation
3. Set up development environment
4. Create feature branches for each phase
5. Regular check-ins and adjustments
