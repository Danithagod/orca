# Phase 5: Tools Extension

**Duration:** Week 9-10  
**Status:** Not Started  
**Depends on:** Phase 2 (Memory Engine), Phase 4 (Orchestration)

---

## Objectives

- Create custom tools for Orca
- Enhance existing tools with memory integration
- Build orchestration tools
- Add memory tools

---

## Tasks

### 5.1 Tool Framework

- [ ] Create enhanced tool definition pattern
- [ ] Add memory hooks to tool interface
- [ ] Implement tool registry
- [ ] Build tool validation system
- [ ] Add error handling

### 5.2 Memory Tools

#### memory_store

- [ ] Implement store operation
- [ ] Add category assignment
- [ ] Create tag handling
- [ ] Add TTL support
- [ ] Build validation

#### memory_recall

- [ ] Implement recall by key
- [ ] Add related memory fetching
- [ ] Create format options
- [ ] Build relevance scoring
- [ ] Add context injection

#### memory_search

- [ ] Implement semantic search
- [ ] Add category filtering
- [ ] Create tag filtering
- [ ] Build pagination
- [ ] Add result ranking

#### memory_list

- [ ] Implement list operation
- [ ] Add sorting options
- [ ] Create pagination
- [ ] Build filtering
- [ ] Add format output

#### memory_forget

- [ ] Implement delete operation
- [ ] Add cascade delete
- [ ] Create confirmation
- [ ] Build cleanup
- [ ] Add audit logging

### 5.3 Orchestration Tools

#### agent_spawn

- [ ] Implement agent creation
- [ ] Add type selection
- [ ] Create configuration
- [ ] Build initialization
- [ ] Add status reporting

#### agent_delegate

- [ ] Implement task delegation
- [ ] Add agent selection
- [ ] Create context passing
- [ ] Build memory injection
- [ ] Add progress tracking

#### agent_status

- [ ] Implement status query
- [ ] Add metrics reporting
- [ ] Create formatting
- [ ] Build filtering
- [ ] Add real-time updates

#### task_create

- [ ] Implement task creation
- [ ] Add priority assignment
- [ ] Create dependency linking
- [ ] Build auto-assignment
- [ ] Add validation

#### task_status

- [ ] Implement status query
- [ ] Add progress reporting
- [ ] Create output display
- [ ] Build error formatting
- [ ] Add history

#### coordinate_agents

- [ ] Implement multi-agent coordination
- [ ] Add strategy selection
- [ ] Create result aggregation
- [ ] Build timeout handling
- [ ] Add error collection

### 5.4 Enhanced Base Tools

#### Enhanced Read

- [ ] Add memory recall before read
- [ ] Inject relevant context
- [ ] Auto-store file patterns
- [ ] Cache frequently read files
- [ ] Add format options

#### Enhanced Edit

- [ ] Auto-capture edit as memory
- [ ] Add pattern detection
- [ ] Create backup before edit
- [ ] Build diff generation
- [ ] Add validation

#### Enhanced Bash

- [ ] Capture command results
- [ ] Store successful commands
- [ ] Learn from errors
- [ ] Add timeout handling
- [ ] Create output formatting

#### Enhanced Glob

- [ ] Cache file listings
- [ ] Store project structure
- [ ] Add pattern learning
- [ ] Build speed optimization
- [ ] Add filtering

#### Enhanced Grep

- [ ] Store search patterns
- [ ] Add result caching
- [ ] Create context extraction
- [ ] Build relevance ranking
- [ ] Add formatting

### 5.5 Tool Integration

- [ ] Integrate memory tools with orchestrator
- [ ] Add tool usage tracking
- [ ] Create tool chaining support
- [ ] Build tool result caching
- [ ] Add failure recovery

### 5.6 Tool Testing

- [ ] Unit tests for each tool
- [ ] Integration tests with memory
- [ ] Integration tests with orchestrator
- [ ] Performance tests
- [ ] Error handling tests

---

## Deliverables

| Deliverable         | Description                 |
| ------------------- | --------------------------- |
| Tool Framework      | Enhanced definition pattern |
| Memory Tools        | 5 memory management tools   |
| Orchestration Tools | 6 orchestration tools       |
| Enhanced Base Tools | 5 enhanced existing tools   |
| Tool Registry       | Centralized tool management |
| Tests               | Full test coverage          |

---

## Tool Definition Pattern

```typescript
export const orcaTool = <Input extends z.ZodType, Output>(config: {
  id: string
  name: string
  description: string
  inputSchema: Input
  outputSchema: z.ZodType<Output>
  execute: (input: z.infer<Input>) => Promise<Output>
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
  requiresConfirmation?: boolean
  timeout?: number
}): Tool<Input, Output> => {
  // Implementation
}
```

---

## Memory Tool Usage Examples

### Store Memory

```typescript
// Store an architecture decision
await tools.memory_store({
  key: "auth-approach",
  title: "Authentication Approach",
  content: "Using JWT tokens with refresh mechanism. Tokens expire after 1 hour, refresh tokens after 7 days.",
  category: "decisions",
  tags: ["auth", "security", "jwt"],
  filePath: "src/auth/index.ts",
})
```

### Recall Memory

```typescript
// Recall specific memory
const result = await tools.memory_recall({
  key: "auth-approach",
  includeRelated: true,
  format: "summary",
})
// Returns: remembered authentication approach and related decisions
```

### Search Memories

```typescript
// Semantic search
const results = await tools.memory_search({
  query: "how do we handle errors?",
  categories: ["patterns", "decisions"],
  limit: 5,
  minScore: 0.7,
})
// Returns: top 5 relevant memories about error handling
```

---

## Orchestration Tool Usage Examples

### Spawn Agent

```typescript
// Spawn an architect agent
const result = await tools.agent_spawn({
  type: "architect",
  assignTask: "Explore the codebase structure",
})
// Returns: { agentId, type, status, message }
```

### Delegate Task

```typescript
// Delegate implementation task
const result = await tools.agent_delegate({
  taskId: "task-123",
  agentType: "builder",
  context: {
    branch: "feature/auth",
    patterns: ["service-repo-pattern"],
  },
  memoryKeys: ["auth-approach", "error-handling"],
})
```

### Coordinate Agents

```typescript
// Parallel implementation
const result = await tools.coordinate_agents({
  strategy: "parallel",
  agentTypes: ["builder", "tester"],
  task: "Implement user registration",
  timeout: 120000,
})
```

---

## Enhanced Tool Hook Flow

```
┌────────────────────────────────────────────────────────────────┐
│                      TOOL EXECUTION                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. BEFORE HOOK                                                │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ • Memory recall (if enabled)                         │   │
│     │ • Context injection                                   │   │
│     │ • Input validation                                    │   │
│     │ • Custom before hook                                  │   │
│     └─────────────────────────────────────────────────────┘   │
│                           │                                    │
│                           ▼                                    │
│  2. EXECUTE                                                    │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ • Internal tool logic                                 │   │
│     │ • External API calls                                  │   │
│     │ • File operations                                     │   │
│     └─────────────────────────────────────────────────────┘   │
│                           │                                    │
│                           ▼                                    │
│  3. AFTER HOOK                                                 │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ • Memory store (if enabled)                           │   │
│     │ • Audit logging                                       │   │
│     │ • Result formatting                                   │   │
│     │ • Custom after hook                                   │   │
│     └─────────────────────────────────────────────────────┘   │
│                           │                                    │
│                           ▼                                    │
│  4. RETURN RESULT                                              │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ • Formatted output                                    │   │
│     │ • Status                                               │   │
│     │ • Metrics                                              │   │
│     └─────────────────────────────────────────────────────┘   │
│                                                                │
│  ERROR PATH (on failure):                                      │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ • Error hook                                          │   │
│     │ • Retry logic                                         │   │
│     │ • Error memory (if configured)                        │   │
│     │ • Fallback result                                     │   │
│     └─────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Tool Registry

```typescript
class ToolRegistry {
  private tools: Map<string, Tool> = new Map()

  // Register a tool
  register(tool: Tool): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool ${tool.id} already registered`)
    }
    this.tools.set(tool.id, tool)
  }

  // Get tool by ID
  get(id: string): Tool | undefined {
    return this.tools.get(id)
  }

  // Get tools by capability
  getByCapability(capability: string): Tool[] {
    return Array.from(this.tools.values()).filter((t) => t.capabilities?.includes(capability))
  }

  // List all tools
  list(): Tool[] {
    return Array.from(this.tools.values())
  }

  // Initialize all default tools
  static createDefault(): ToolRegistry {
    const registry = new ToolRegistry()

    // Memory tools
    registry.register(memoryStoreTool)
    registry.register(memoryRecallTool)
    registry.register(memorySearchTool)
    registry.register(memoryListTool)
    registry.register(memoryForgetTool)

    // Orchestration tools
    registry.register(agentSpawnTool)
    registry.register(agentDelegateTool)
    registry.register(agentStatusTool)
    registry.register(taskCreateTool)
    registry.register(taskStatusTool)
    registry.register(coordinateAgentsTool)

    // Enhanced base tools
    registry.register(enhancedReadTool)
    registry.register(enhancedEditTool)
    registry.register(enhancedBashTool)
    registry.register(enhancedGlobTool)
    registry.register(enhancedGrepTool)

    return registry
  }
}
```

---

## Testing

### Tool Tests

- [ ] memory_store and recall
- [ ] memory_search relevance
- [ ] memory_list pagination
- [ ] memory_forget with cascade
- [ ] agent_spawn creates agent
- [ ] agent_delegate executes task
- [ ] agent_status reports
- [ ] task_create queues task
- [ ] task_status tracks progress
- [ ] coordinate_agents strategies

### Integration Tests

- [ ] Memory tools with memory engine
- [ ] Orchestration tools with orchestrator
- [ ] Enhanced tools with hooks
- [ ] Tool chaining
- [ ] Error recovery
- [ ] Timeout handling

---

## Success Criteria

- [ ] All tools registered successfully
- [ ] Memory tools work with memory engine
- [ ] Orchestration tools work with orchestrator
- [ ] Enhanced tools have memory integration
- [ ] All tests pass
- [ ] Performance: < 100ms tool execution
