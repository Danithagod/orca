# Orca - AI Coding Agent: Complete Overview

## 🎯 Executive Summary

**Orca** is an advanced AI coding agent that builds upon the Kilo CLI framework to provide:
- **Persistent Memory Engine** with semantic search (mem0/Letta support)
- **Multi-Agent Orchestration** for complex task coordination
- **Blue-Themed Terminal UI** with rounded design elements
- **Extensive Custom Commands** for memory, agent, and context management

**Timeline**: 12 weeks (6 phases)
**Technology**: TypeScript, Zod, mem0/Letta, SQLite, React (Ink)
**Integration**: Extends existing Kilo CLI without breaking changes

---

## 📊 Project Structure

```
plan/
├── README.md                  # Quick start guide
├── ORCA_PLAN.md              # Main development plan
├── ORCA_OVERVIEW.md          # This file - complete overview
├── 01-foundation/            # Phase 1: Infrastructure
│   └── index.md              # Foundation tasks and deliverables
├── 02-memory-engine/         # Phase 2: Memory system
│   └── index.md              # Memory implementation details
├── 03-ui-enhancement/        # Phase 3: UI overhaul
│   └── index.md              # Blue theme and rounded corners
├── 04-orchestration/        # Phase 4: Multi-agent system
│   └── index.md              # Agent types and coordination
├── 05-tools-extension/       # Phase 5: Custom tools
│   └── index.md              # Memory and orchestration tools
├── 06-integration/           # Phase 6: Final integration
│   └── index.md              # End-to-end integration
└── specs/                    # Detailed specifications
    ├── memory-spec.md         # Memory engine API
    ├── orchestrator-spec.md   # Orchestration system
    ├── tools-spec.md         # Tool definitions
    └── ui-spec.md            # UI component specs
```

---

## 🚀 Phase Overview

| Phase | Duration | Focus | Key Deliverables |
|-------|----------|-------|-----------------|
| **Phase 1: Foundation** | Week 1-2 | Infrastructure | Core types, config, module pattern |
| **Phase 2: Memory Engine** | Week 3-4 | Persistence | mem0/Letta integration, semantic search |
| **Phase 3: UI Enhancement** | Week 5-6 | Visuals | Blue theme, rounded corners, animations |
| **Phase 4: Orchestration** | Week 7-8 | Multi-Agent | Agent types, task delegation, coordination |
| **Phase 5: Tools Extension** | Week 9-10 | Capabilities | Custom tools, enhanced base tools |
| **Phase 6: Integration** | Week 11-12 | Polish | E2E workflows, testing, documentation |

---

## 🧠 Memory System Architecture

### Core Features

1. **Persistent Storage**
   - Primary: mem0 (managed service with semantic search)
   - Fallback: Letta (open source, self-hosted)
   - Local: SQLite + vector search (full control)

2. **Memory Categories**
   - `architecture` - Code structure decisions
   - `conventions` - Coding patterns used
   - `decisions` - Important project decisions
   - `todos` - Outstanding tasks
   - `context` - General context
   - `patterns` - Reusable patterns found
   - `preferences` - User preferences
   - `dependencies` - Key dependencies

3. **Auto-Capture**
   - Architectural decisions during code review
   - Patterns identified during implementation
   - Conventions learned from codebase exploration
   - Dependencies discovered during setup
   - Error handling patterns

4. **Smart Recall**
   - Semantic search with relevance scoring
   - Category filtering
   - Context injection before tool calls
   - Access tracking for relevance optimization

### Database Schema (SQLite Backend)

```sql
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  project_path TEXT NOT NULL,
  file_path TEXT,
  embedding BLOB,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Full-text search index
CREATE VIRTUAL TABLE memories_fts USING fts5(
  content, title, summary
);
```

---

## 🤖 Agent Orchestration System

### Specialized Agents

| Agent | Purpose | Tools | Memory Scope |
|-------|---------|-------|--------------|
| **Architect** | Codebase exploration, planning | Glob, Grep, Read | Project |
| **Builder** | Implementation, changes | Edit, Write, Create, Bash | Task |
| **Tester** | Verification, testing | Bash, Read, Execute | Session |
| **Reviewer** | Code review, quality | Read, Grep, Edit | Project |
| **Memory Keeper** | Context persistence | Memory Engine, Read, Write | Project |
| **Navigator** | File system navigation | Glob, Grep, LS, Read | Session |
| **Debugger** | Issue investigation | Bash, Grep, Read, Execute | Task |
| **Optimizer** | Performance optimization | Read, Edit, Bash | Project |

### Coordination Strategies

1. **Sequential** - Agents work one after another
2. **Parallel** - All agents work simultaneously
3. **Vote** - Agents propose, vote on best solution
4. **Hierarchy** - Lead agent delegates to others
5. **Race** - First agent to complete wins
6. **Adaptive** - Dynamically choose best strategy

### Task Flow

```
User Request → Task Analyzer → Agent Selector → Execute → Result Aggregator
                     ↓                        ↓
               Identify capabilities        Monitor progress
               Estimate complexity         Track metrics
               Check dependencies          Handle errors
```

---

## 🎨 UI Design System

### Color Palette (Orca Blue Theme)

```css
Primary Blues:
  --orca-primary: #0066CC       /* Vibrant blue */
  --orca-primary-light: #3399FF   /* Light blue accent */
  --orca-primary-dark: #004080    /* Deep blue */

Accent Cyan:
  --orca-accent: #00D4FF          /* Cyan accent */

Backgrounds:
  --orca-bg-dark: #0A1628         /* Dark navy */
  --orca-bg-panel: #0F1F35       /* Panel */
  --orca-bg-card: #142540         /* Card */

Status Colors:
  Success: #10B981               /* Green */
  Warning: #F59E0B               /* Amber */
  Error: #EF4444                 /* Red */
  Info: #6366F1                  /* Indigo */
```

### UI Components

1. **Activity Cards**
   - Rounded corners (╭ ╮ ╰ ╯)
   - Status indicators with icons (● ○ ✓ ✗)
   - Collapsible content
   - Animated state transitions

2. **Memory Widget**
   - Total memory count
   - Category breakdown
   - Recent access list
   - Mini mode option

3. **Agent Status Panel**
   - Agent type and status
   - Current task display
   - Performance metrics
   - Status filtering

4. **Progress Bars**
   - Solid fill with gradient
   - Animated progress
   - Segment style for multi-step
   - Indeterminate state

5. **Command Palette**
   - Autocomplete
   - History navigation
   - Multi-line input
   - Syntax highlighting

### Terminal Compatibility

- macOS Terminal
- iTerm2
- Windows Terminal
- VS Code terminal
- Linux terminals (gnome-terminal, konsole, etc.)

---

## ⚡ Custom Commands

### Memory Commands

```bash
/memory store <key> <content>    # Store memory
/memory recall <query>             # Recall by query
/memory search <query>             # Semantic search
/memory list                       # List all memories
/memory show <id>                  # Show details
/memory forget <id>                # Delete memory
/memory export                     # Export to file
```

### Agent Commands

```bash
/agent spawn <type>                # Spawn agent
/agent list                        # List agents
/agent status <id>                  # Show status
/agent delegate <task>             # Delegate task
/agent kill <id>                   # Terminate agent
```

### Task Commands

```bash
/task create <description>          # Create task
/task status <id>                   # Show status
/task cancel <id>                   # Cancel task
/task list                         # List tasks
```

### UI Commands

```bash
/ui theme <theme>                  # Change theme
/ui compact                        # Toggle compact
/ui memory <on|off>                # Toggle memory widget
/ui agents <on|off>                # Toggle agent panel
/ui clear                          # Clear activity
```

---

## 🔧 Tools Architecture

### Tool Definition Pattern

```typescript
export const orcaTool = <Input, Output>(config: {
  id: string
  name: string
  description: string
  inputSchema: z.ZodType<Input>
  outputSchema: z.ZodType<Output>
  execute: (input: Input) => Promise<Output>
  capabilities?: string[]
  memory?: {
    store?: boolean
    recall?: boolean
    categories?: MemoryCategory[]
  }
  hooks?: {
    before?: BeforeHook
    after?: AfterHook
    error?: ErrorHook
  }
}): Tool<Input, Output>
```

### Tool Categories

1. **Memory Tools** (5 tools)
   - memory_store, memory_recall, memory_search, memory_list, memory_forget

2. **Orchestration Tools** (6 tools)
   - agent_spawn, agent_delegate, agent_status, task_create, task_status, coordinate_agents

3. **Enhanced Base Tools** (5 tools)
   - Enhanced Read, Edit, Bash, Glob, Grep with memory integration

### Tool Hook Flow

```
Before Hook → Execute → After Hook → Return Result
     ↓                              ↓
  Memory recall                   Memory store
  Context injection               Audit logging
  Validation                     Result formatting

Error Path:
  Error → Error Hook → Retry/Recover → Fallback Result
                        ↓
                    Error memory storage
```

---

## 📁 Implementation Directory Structure

```
packages/opencode/src/orca/
├── index.ts                      # Main exports
├── types.ts                      # Core types
├── config.ts                     # Configuration
├── errors.ts                     # Custom errors
├── events.ts                     # Event definitions
│
├── memory/                       # Phase 2
│   ├── index.ts
│   ├── engine.ts                 # Core memory engine
│   ├── mem0.ts                  # mem0 integration
│   ├── letta.ts                 # Letta integration
│   ├── local.ts                 # SQLite backend
│   ├── types.ts                 # Memory types
│   ├── auto.ts                  # Auto-memory generation
│   └── hooks.ts                 # Context hooks
│
├── orchestrator/                 # Phase 4
│   ├── index.ts
│   ├── agent.ts                 # Agent definitions
│   ├── coordinator.ts           # Multi-agent coordination
│   ├── delegation.ts            # Task delegation
│   ├── task-manager.ts          # Task management
│   ├── workflows.ts             # Predefined workflows
│   └── state.ts                # Agent state
│
├── ui/                          # Phase 3
│   ├── index.ts
│   ├── components/
│   │   ├── activity-card.tsx
│   │   ├── memory-widget.tsx
│   │   ├── agent-status.tsx
│   │   ├── progress-bar.tsx
│   │   ├── rounded-box.tsx
│   │   └── command-palette.tsx
│   ├── theme/
│   │   ├── colors.ts             # Color definitions
│   │   ├── styles.ts             # Style utilities
│   │   └── themes.ts             # Predefined themes
│   ├── renderer/
│   │   ├── rounded-box.ts       # Box rendering
│   │   ├── terminal.ts          # Terminal rendering
│   │   └── animations.ts        # UI animations
│   └── layout/
│       ├── panels.ts            # Panel layout
│       └── sidebar.ts           # Sidebar components
│
├── tools/                       # Phase 5
│   ├── index.ts
│   ├── registry.ts              # Tool registry
│   ├── memory/                 # Memory tools
│   │   ├── store.ts
│   │   ├── recall.ts
│   │   ├── search.ts
│   │   ├── list.ts
│   │   └── forget.ts
│   ├── orchestration/           # Orchestration tools
│   │   ├── spawn.ts
│   │   ├── delegate.ts
│   │   ├── status.ts
│   │   ├── create.ts
│   │   ├── task-status.ts
│   │   └── coordinate.ts
│   └── enhanced/               # Enhanced base tools
│       ├── read.ts
│       ├── edit.ts
│       ├── bash.ts
│       ├── glob.ts
│       └── grep.ts
│
├── commands/                    # Phase 5
│   ├── index.ts
│   ├── parser.ts               # Command parser
│   ├── memory.ts              # Memory commands
│   ├── agent.ts               # Agent commands
│   ├── task.ts                # Task commands
│   └── ui.ts                  # UI commands
│
└── context/                     # Phase 6
    ├── index.ts
    ├── engine.ts               # Context management
    ├── persistence.ts          # Context persistence
    └── optimizer.ts           # Context optimization
```

---

## 📈 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Memory retrieval accuracy** | > 90% | User feedback on relevance |
| **Memory context injection** | 100% | All tool calls include context |
| **Session context preservation** | 100% | Session restoration works |
| **UI rendering time** | < 100ms | Performance profiling |
| **Multi-agent task completion** | > 85% | Task success rate |
| **Agent coordination latency** | < 500ms | Task handoff timing |
| **User satisfaction score** | > 4.5/5 | Post-session surveys |
| **Command execution time** | < 200ms | Command handler profiling |
| **Startup time** | < 2 seconds | Cold start measurement |

---

## 🔑 Key Principles

1. **Additive Only** - Keep existing tools unchanged
2. **Pluggable Design** - Easy to swap memory backends
3. **Incremental UI** - Don't break existing workflows
4. **Feature Flags** - Gradual rollout for safety
5. **Performance First** - Optimize for responsiveness
6. **Type Safety** - Leverage Zod for runtime validation
7. **Test Coverage** - Comprehensive unit and integration tests
8. **Documentation** - Clear docs for all APIs and features

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Bun package manager
- Git

### Quick Start

```bash
# Navigate to project
cd /path/to/orca

# Install dependencies
bun install

# Run tests
bun test

# Run dev server
bun run dev

# Run typecheck
bun turbo typecheck

# Run linter
bun run lint
```

### Phase 1 Setup

```bash
# Create orca directory structure
mkdir -p packages/opencode/src/orca/{memory,orchestrator,ui,tools,commands,context}

# Install mem0 SDK (for Phase 2)
bun add @mem0/sdk

# Install UI dependencies (for Phase 3)
bun add chalk boxen ink react

# Install SQLite dependencies (for fallback)
bun add better-sqlite3
bun add -d @types/better-sqlite3
```

---

## 📚 Documentation Structure

1. **Plan Documents**
   - `README.md` - Quick start guide
   - `ORCA_PLAN.md` - Comprehensive development plan
   - `ORCA_OVERVIEW.md` - This file

2. **Phase Documents**
   - `01-foundation/index.md` - Phase 1 details
   - `02-memory-engine/index.md` - Phase 2 details
   - `03-ui-enhancement/index.md` - Phase 3 details
   - `04-orchestration/index.md` - Phase 4 details
   - `05-tools-extension/index.md` - Phase 5 details
   - `06-integration/index.md` - Phase 6 details

3. **Specification Documents**
   - `specs/memory-spec.md` - Memory engine API spec
   - `specs/orchestrator-spec.md` - Orchestration system spec
   - `specs/tools-spec.md` - Tool definitions spec
   - `specs/ui-spec.md` - UI component spec

---

## 🚦 Getting Started Checklist

### Before Starting

- [ ] Review complete development plan
- [ ] Approve timeline and deliverables
- [ ] Set up development environment
- [ ] Create feature branch
- [ ] Understand existing Kilo CLI architecture

### Phase 1 (Week 1-2)

- [ ] Create directory structure
- [ ] Define core types
- [ ] Set up configuration system
- [ ] Create module pattern
- [ ] Write basic tests

### Phase 2 (Week 3-4)

- [ ] Implement memory backend interface
- [ ] Add mem0 integration
- [ ] Create SQLite fallback
- [ ] Build semantic search
- [ ] Add auto-memory generation
- [ ] Create memory commands

### Phase 3 (Week 5-6)

- [ ] Define color palette
- [ ] Create rounded box renderer
- [ ] Build UI components
- [ ] Implement animations
- [ ] Add layout system
- [ ] Create UI commands

### Phase 4 (Week 7-8)

- [ ] Define agent types
- [ ] Implement agent system
- [ ] Create task management
- [ ] Build coordination strategies
- [ ] Add agent commands

### Phase 5 (Week 9-10)

- [ ] Create tool framework
- [ ] Build memory tools
- [ ] Build orchestration tools
- [ ] Enhance base tools
- [ ] Create command system

### Phase 6 (Week 11-12)

- [ ] Integrate all components
- [ ] Build end-to-end workflows
- [ ] Add session management
- [ ] Write comprehensive tests
- [ ] Complete documentation
- [ ] Prepare for release

---

## 🎯 Target Audience

### Primary Users
- Software developers working on complex projects
- Teams requiring persistent context across sessions
- Users who need intelligent codebase exploration
- Developers who want better agent orchestration

### Secondary Users
- DevOps engineers managing infrastructure
- QA engineers testing code changes
- Technical leads reviewing code
- Open source contributors

---

## 🔮 Future Enhancements (Post-MVP)

1. **Advanced Features**
   - Multi-project memory sharing
   - Agent marketplace (custom agents)
   - Memory import/export
   - Collaborative memory editing

2. **Integration**
   - VS Code extension
   - JetBrains plugin
   - Slack/Discord bot
   - Web dashboard

3. **Analytics**
   - Usage analytics
   - Performance metrics
   - Agent efficiency tracking
   - Memory effectiveness reports

4. **AI Enhancements**
   - Better semantic understanding
   - Context compression
   - Predictive memory retrieval
   - Agent learning from patterns

---

## 📞 Support & Contribution

### Getting Help
- Review phase-specific documentation
- Check spec files for API details
- Run tests for examples
- Read AGENTS.md for coding guidelines

### Contributing
1. Read comprehensive development plan
2. Pick a phase and follow checklist
3. Submit PRs with clear descriptions
4. Update documentation as needed
5. Ensure all tests pass

### Code Standards
- Follow AGENTS.md guidelines
- Use Zod for type validation
- Write tests for new features
- Document public APIs
- Use single-word variable names
- Avoid `let` and `else` statements

---

## 📜 License

MIT - See main project LICENSE file.

---

**Orca** - 🐋 Your intelligent coding companion with memory, orchestration, and style.

*Built with ❤️ on top of Kilo CLI framework*
