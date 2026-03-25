# Orca Tools Specification

## Overview

Enhanced and custom tools for Orca, building on the existing tool architecture while adding new capabilities for agent orchestration and memory integration.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           TOOLS LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    ORCHESTRATION TOOLS                          │  │
│  │  agent_spawn | agent_delegate | agent_status | task_create     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    MEMORY TOOLS                                  │  │
│  │  memory_store | memory_recall | memory_search | memory_list    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    EXISTING TOOLS                                │  │
│  │  Bash | Read | Write | Edit | Glob | Grep | Task | WebFetch    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tool Interface

### Base Definition

```typescript
import { z } from "zod"

export interface Tool<Input extends z.ZodType = z.ZodType, Output = unknown> {
  id: string
  name: string
  description: string
  inputSchema: Input
  outputSchema: z.ZodType<Output>

  // Execution
  execute: (input: z.infer<Input>) => Promise<Output>

  // Hooks
  beforeExecute?: (input: z.infer<Input>) => Promise<HookContext>
  afterExecute?: (input: z.infer<Input>, result: Output) => Promise<void>
  onError?: (input: z.infer<Input>, error: Error) => Promise<void>

  // Metadata
  capabilities?: string[]
  requiresConfirmation?: boolean
  timeout?: number

  // Memory integration
  storeMemory?: boolean
  recallMemory?: boolean
}

export interface HookContext {
  memories?: Memory[]
  additionalContext?: string
  modifiedInput?: unknown
}
```

### Enhanced Tool Definition

```typescript
// packages/opencode/src/orca/tools/define.ts

export namespace OrcaTool {
  export const define = <Input extends z.ZodType, Output>(config: {
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
  }): Tool<Input, Output> => {
    const tool: Tool<Input, Output> = {
      id: config.id,
      name: config.name,
      description: config.description,
      inputSchema: config.inputSchema,
      outputSchema: config.outputSchema,
      capabilities: config.capabilities,
      execute: config.execute,
    }

    // Add memory hooks if enabled
    if (config.memory?.recall) {
      tool.beforeExecute = async (input) => {
        const memories = await MemoryEngine.search({
          query: JSON.stringify(input),
          categories: config.memory?.categories,
          limit: 5,
        })
        return { memories }
      }
    }

    if (config.memory?.store) {
      tool.afterExecute = async (input, result) => {
        // Auto-capture result as memory if significant
        if (isWorthyOfMemory(result)) {
          await MemoryEngine.store({
            key: `tool-${config.id}-${Date.now()}`,
            title: `${config.name} execution`,
            content: JSON.stringify({ input, result }),
            category: "context",
            metadata: { tool: config.id },
          })
        }
      }
    }

    // Add custom hooks
    if (config.hooks?.before) {
      const originalBefore = tool.beforeExecute
      tool.beforeExecute = async (input) => {
        const hookResult = await config.hooks.before(input)
        const originalResult = originalBefore ? await originalBefore(input) : {}
        return { ...originalResult, ...hookResult }
      }
    }

    if (config.hooks?.after) {
      const originalAfter = tool.afterExecute
      tool.afterExecute = async (input, result) => {
        await config.hooks.after(input, result)
        if (originalAfter) await originalAfter(input, result)
      }
    }

    return tool
  }
}
```

---

## Memory Tools

### memory_store

Store a memory in the project context.

```typescript
export const memoryStoreTool = OrcaTool.define({
  id: "memory_store",
  name: "Memory Store",
  description: "Store information in project memory for future reference",

  inputSchema: z.object({
    key: z.string().describe("Unique identifier for this memory"),
    title: z.string().describe("Brief title for the memory"),
    content: z.string().describe("Full content to store"),
    category: MemoryCategory.describe("Category for organization"),
    tags: z.array(z.string()).optional().describe("Tags for retrieval"),
    filePath: z.string().optional().describe("Related file path"),
    expiresAt: z.string().optional().describe("ISO date when memory expires"),
  }),

  outputSchema: z.object({
    id: z.string(),
    key: z.string(),
    stored: z.boolean(),
  }),

  execute: async (input) => {
    const memory = await MemoryEngine.store({
      key: input.key,
      title: input.title,
      content: input.content,
      category: input.category,
      tags: input.tags,
      filePath: input.filePath,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    })

    return {
      id: memory.id,
      key: memory.key,
      stored: true,
    }
  },

  capabilities: ["memory"],
})
```

### memory_recall

Retrieve memories by key.

```typescript
export const memoryRecallTool = OrcaTool.define({
  id: "memory_recall",
  name: "Memory Recall",
  description: "Retrieve specific memories by key or pattern",

  inputSchema: z.object({
    key: z.string().optional().describe("Exact key to retrieve"),
    query: z.string().optional().describe("Search query if key not specified"),
    includeRelated: z.boolean().default(false).describe("Include related memories"),
    format: z.enum(["summary", "full", "json"]).default("summary"),
  }),

  outputSchema: z.object({
    memories: z.array(Memory),
    formatted: z.string(),
  }),

  execute: async (input) => {
    let memories: Memory[] = []

    if (input.key) {
      const memory = await MemoryEngine.recall({
        key: input.key,
        includeRelated: input.includeRelated,
      })
      memories = memory ? [memory] : []
    } else if (input.query) {
      const results = await MemoryEngine.search({
        query: input.query,
        limit: 10,
      })
      memories = results.map((r) => r.memory)
    }

    const formatted = formatMemories(memories, input.format)

    return { memories, formatted }
  },

  capabilities: ["memory"],
  memory: {
    recall: true,
  },
})
```

### memory_search

Search memories semantically.

```typescript
export const memorySearchTool = OrcaTool.define({
  id: "memory_search",
  name: "Memory Search",
  description: "Search memories using semantic similarity",

  inputSchema: z.object({
    query: z.string().describe("Natural language search query"),
    categories: z.array(MemoryCategory).optional().describe("Filter by categories"),
    tags: z.array(z.string()).optional().describe("Filter by tags"),
    limit: z.number().min(1).max(50).default(10).describe("Max results"),
    minScore: z.number().min(0).max(1).default(0.5).describe("Minimum relevance score"),
  }),

  outputSchema: z.object({
    results: z.array(MemorySearchResult),
    formatted: z.string(),
  }),

  execute: async (input) => {
    const results = await MemoryEngine.search({
      query: input.query,
      categories: input.categories,
      tags: input.tags,
      limit: input.limit,
      minScore: input.minScore,
    })

    const formatted = results
      .map(
        (r, i) =>
          `${i + 1}. ${r.memory.title} (${(r.score * 100).toFixed(0)}% relevance)\n` +
          `   Category: ${r.memory.category}\n` +
          `   ${r.memory.summary}\n`,
      )
      .join("\n")

    return { results, formatted }
  },

  capabilities: ["memory"],
})
```

### memory_list

List all memories with filters.

```typescript
export const memoryListTool = OrcaTool.define({
  id: "memory_list",
  name: "Memory List",
  description: "List memories with optional filtering",

  inputSchema: z.object({
    category: MemoryCategory.optional().describe("Filter by category"),
    tags: z.array(z.string()).optional().describe("Filter by tags"),
    limit: z.number().min(1).max(100).default(20).describe("Max results"),
    offset: z.number().min(0).default(0).describe("Pagination offset"),
    sortBy: z.enum(["createdAt", "updatedAt", "accessCount"]).default("updatedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),

  outputSchema: z.object({
    memories: z.array(Memory),
    total: z.number(),
    formatted: z.string(),
  }),

  execute: async (input) => {
    const result = await MemoryEngine.list({
      category: input.category,
      tags: input.tags,
      limit: input.limit,
      offset: input.offset,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
    })

    const formatted = result.items
      .map((m, i) => `${i + 1 + input.offset}. ${m.key} [${m.category}] - ${m.title}`)
      .join("\n")

    return {
      memories: result.items,
      total: result.total,
      formatted,
    }
  },

  capabilities: ["memory"],
})
```

### memory_forget

Delete a memory.

```typescript
export const memoryForgetTool = OrcaTool.define({
  id: "memory_forget",
  name: "Memory Forget",
  description: "Delete a memory from the project",

  inputSchema: z.object({
    id: z.string().describe("Memory ID to delete"),
    cascade: z.boolean().default(false).describe("Delete child memories"),
    confirm: z.boolean().default(false).describe("Confirmation flag"),
  }),

  outputSchema: z.object({
    deleted: z.boolean(),
    cascadeCount: z.number().optional(),
  }),

  execute: async (input) => {
    if (!input.confirm) {
      throw new Error("Memory deletion requires confirm=true")
    }

    await MemoryEngine.delete({
      id: input.id,
      cascade: input.cascade,
    })

    return { deleted: true }
  },

  capabilities: ["memory"],
  requiresConfirmation: true,
})
```

---

## Orchestration Tools

### agent_spawn

Spawn a new agent.

```typescript
export const agentSpawnTool = OrcaTool.define({
  id: "agent_spawn",
  name: "Agent Spawn",
  description: "Create a new agent instance for task execution",

  inputSchema: z.object({
    type: AgentType.describe("Type of agent to spawn"),
    config: z.record(z.unknown()).optional().describe("Agent configuration"),
    assignTask: z.string().optional().describe("Task to assign immediately"),
  }),

  outputSchema: z.object({
    agentId: z.string(),
    type: AgentType,
    status: AgentStatus,
    message: z.string(),
  }),

  execute: async (input) => {
    const agent = await Orchestrator.registerAgent({
      type: input.type,
      config: input.config,
    })

    if (input.assignTask) {
      const task = await Orchestrator.createTask({
        title: input.assignTask,
        description: input.assignTask,
        type: "generic",
        input: { task: input.assignTask },
      })

      await Orchestrator.executeTask({
        taskId: task.id,
        agentId: agent.id,
      })
    }

    return {
      agentId: agent.id,
      type: agent.type,
      status: agent.status,
      message: `Spawned ${agent.type} agent: ${agent.id}`,
    }
  },

  capabilities: ["orchestration"],
  memory: {
    store: true,
    categories: ["workflow"],
  },
})
```

### agent_delegate

Delegate a task to an agent.

```typescript
export const agentDelegateTool = OrcaTool.define({
  id: "agent_delegate",
  name: "Agent Delegate",
  description: "Delegate a specific task to a spawned agent",

  inputSchema: z.object({
    taskId: z.string().describe("Task ID to delegate"),
    agentId: z.string().optional().describe("Specific agent ID (auto-select if not provided)"),
    agentType: AgentType.optional().describe("Agent type if auto-selecting"),
    context: z.record(z.unknown()).optional().describe("Additional context for task"),
    memoryKeys: z.array(z.string()).optional().describe("Memory keys to inject"),
  }),

  outputSchema: z.object({
    taskId: z.string(),
    agentId: z.string(),
    status: TaskStatus,
    result: z.unknown().optional(),
  }),

  execute: async (input) => {
    // Get task
    let task = await getTask(input.taskId)

    // Add context if provided
    if (input.context) {
      task = await updateTask(task.id, {
        context: { ...task.context, ...input.context },
      })
    }

    // Add memory keys
    if (input.memoryKeys) {
      const memories = await Promise.all(input.memoryKeys.map((key) => MemoryEngine.recall({ key })))
      task.memoryKeys = [...task.memoryKeys, ...input.memoryKeys]
    }

    // Execute
    const result = await Orchestrator.executeTask({
      taskId: task.id,
      agentId: input.agentId,
    })

    return {
      taskId: task.id,
      agentId: result.agentId,
      status: task.status,
      result: result.output,
    }
  },

  capabilities: ["orchestration"],
})
```

### agent_status

Check agent status.

```typescript
export const agentStatusTool = OrcaTool.define({
  id: "agent_status",
  name: "Agent Status",
  description: "Get status of one or all agents",

  inputSchema: z.object({
    agentId: z.string().optional().describe("Specific agent ID (all if not provided)"),
    includeMetrics: z.boolean().default(false).describe("Include performance metrics"),
  }),

  outputSchema: z.object({
    agents: z.array(
      z.object({
        id: z.string(),
        type: AgentType,
        status: AgentStatus,
        currentTask: z.string().optional(),
        tasksCompleted: z.number(),
        metrics: z.record(z.number()).optional(),
      }),
    ),
    formatted: z.string(),
  }),

  execute: async (input) => {
    const agents = input.agentId ? [await getAgent(input.agentId)] : await getAgents()

    const formatted = agents
      .map((a) => `${a.id.slice(0, 8)} | ${a.type.padEnd(15)} | ${a.status.padEnd(10)} | ${a.currentTask ?? "idle"}`)
      .join("\n")

    return {
      agents: agents.map((a) => ({
        id: a.id,
        type: a.type,
        status: a.status,
        currentTask: a.currentTask,
        tasksCompleted: a.tasksCompleted,
        metrics: input.includeMetrics ? a.metrics : undefined,
      })),
      formatted,
    }
  },

  capabilities: ["orchestration"],
})
```

### task_create

Create a new task.

```typescript
export const taskCreateTool = OrcaTool.define({
  id: "task_create",
  name: "Task Create",
  description: "Create a new task for agent execution",

  inputSchema: z.object({
    title: z.string().describe("Task title"),
    description: z.string().describe("Detailed task description"),
    type: z.enum(["explore", "implement", "test", "review", "generic"]).describe("Task type"),
    input: z.record(z.unknown()).default({}).describe("Task input data"),
    priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    dependencies: z.array(z.string()).optional().describe("Task IDs this depends on"),
    autoAssign: z.boolean().default(false).describe("Auto-assign to best agent"),
  }),

  outputSchema: z.object({
    taskId: z.string(),
    status: TaskStatus,
    assignedAgent: z.string().optional(),
  }),

  execute: async (input) => {
    const task = await Orchestrator.createTask({
      title: input.title,
      description: input.description,
      type: input.type,
      input: input.input,
      priority: input.priority,
      dependencies: input.dependencies,
    })

    let assignedAgent: string | undefined

    if (input.autoAssign) {
      const agent = await Orchestrator.routeTask({ taskId: task.id })
      assignedAgent = agent.agentId
    }

    return {
      taskId: task.id,
      status: task.status,
      assignedAgent,
    }
  },

  capabilities: ["orchestration"],
})
```

### task_status

Check task status.

```typescript
export const taskStatusTool = OrcaTool.define({
  id: "task_status",
  name: "Task Status",
  description: "Get status and details of a task",

  inputSchema: z.object({
    taskId: z.string().describe("Task ID to check"),
    includeOutput: z.boolean().default(false).describe("Include task output if completed"),
  }),

  outputSchema: z.object({
    task: Task,
    progress: z.number(),
    formatted: z.string(),
  }),

  execute: async (input) => {
    const task = await getTask(input.taskId)

    let formatted = `Task: ${task.title}\n`
    formatted += `ID: ${task.id}\n`
    formatted += `Status: ${task.status}\n`
    formatted += `Progress: ${task.progress}%\n`
    formatted += `Priority: ${task.priority}\n`

    if (task.assignedAgent) {
      formatted += `Agent: ${task.assignedAgent}\n`
    }

    if (task.duration) {
      formatted += `Duration: ${task.duration}ms\n`
    }

    if (task.error) {
      formatted += `Error: ${task.error}\n`
    }

    if (input.includeOutput && task.status === "completed" && task.result) {
      formatted += `\nOutput:\n${JSON.stringify(task.result, null, 2)}\n`
    }

    return {
      task,
      progress: task.progress,
      formatted,
    }
  },

  capabilities: ["orchestration"],
})
```

### coordinate_agents

Coordinate multiple agents.

```typescript
export const coordinateAgentsTool = OrcaTool.define({
  id: "coordinate_agents",
  name: "Coordinate Agents",
  description: "Execute a task with multiple agents using a coordination strategy",

  inputSchema: z.object({
    strategy: CoordinationStrategy.describe("Coordination strategy"),
    agents: z.array(z.string()).optional().describe("Agent IDs (auto-select if not provided)"),
    agentTypes: z.array(AgentType).optional().describe("Agent types to use"),
    task: z.string().describe("Task description"),
    input: z.record(z.unknown()).default({}).describe("Task input"),
    timeout: z.number().optional().describe("Timeout in milliseconds"),
  }),

  outputSchema: z.object({
    strategy: CoordinationStrategy,
    agents: z.array(z.string()),
    results: z.array(z.unknown()),
    success: z.boolean(),
    duration: z.number(),
  }),

  execute: async (input) => {
    // Get agents
    let agentIds = input.agents ?? []

    if (!agentIds.length && input.agentTypes) {
      for (const type of input.agentTypes) {
        const agent = await AgentSelector.selectBest({
          task: { type: input.task } as Task,
          availableAgents: await getAgentsByType(type),
        })
        agentIds.push(agent.id)
      }
    }

    // Create task
    const task = await Orchestrator.createTask({
      title: input.task,
      description: input.task,
      type: "generic",
      input: input.input,
    })

    // Coordinate
    const startTime = Date.now()
    const result = await Orchestrator.coordinate({
      strategy: input.strategy,
      agents: agentIds,
      task: task.id,
      timeout: input.timeout,
    })
    const duration = Date.now() - startTime

    return {
      strategy: input.strategy,
      agents: agentIds,
      results: result.results,
      success: result.errors?.length === 0 ?? true,
      duration,
    }
  },

  capabilities: ["orchestration"],
})
```

---

## Enhanced Base Tools

### Enhanced Read Tool

```typescript
export const enhancedReadTool = OrcaTool.define({
  id: "read",
  name: "Read",
  description: "Read file contents with memory integration",

  inputSchema: z.object({
    filePath: z.string().describe("Absolute path to file"),
    offset: z.number().optional().describe("Start line number"),
    limit: z.number().optional().describe("Number of lines to read"),
  }),

  outputSchema: z.object({
    content: z.string(),
    lines: z.number(),
    path: z.string(),
  }),

  execute: async (input) => {
    // Memory hook: recall relevant patterns
    const memories = await MemoryEngine.search({
      query: `file ${input.filePath} patterns conventions`,
      categories: ["patterns", "conventions"],
      limit: 3,
    })

    // Read file
    const content = await readFile(input.filePath, input.offset, input.limit)

    // Auto-store file reading context
    if (content.length > 0) {
      await MemoryEngine.store({
        key: `file-${input.filePath}`,
        title: `File: ${input.filePath}`,
        content: content.slice(0, 500),
        category: "context",
        filePath: input.filePath,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      })
    }

    return {
      content,
      lines: content.split("\n").length,
      path: input.filePath,
    }
  },

  capabilities: ["read"],
  memory: {
    recall: true,
    store: true,
    categories: ["patterns", "conventions"],
  },
})
```

### Enhanced Edit Tool

```typescript
export const enhancedEditTool = OrcaTool.define({
  id: "edit",
  name: "Edit",
  description: "Edit file with automatic memory capture",

  inputSchema: z.object({
    filePath: z.string().describe("File to edit"),
    oldString: z.string().describe("Text to replace"),
    newString: z.string().describe("Replacement text"),
    replaceAll: z.boolean().default(false).describe("Replace all occurrences"),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    changes: z.number(),
    message: z.string(),
  }),

  execute: async (input) => {
    // Perform edit
    const result = await editFile(input.filePath, input.oldString, input.newString, input.replaceAll)

    // Capture the change as memory
    await MemoryEngine.store({
      key: `change-${input.filePath}-${Date.now()}`,
      title: `Edit: ${input.filePath}`,
      content: `Changed: "${input.oldString.slice(0, 50)}..." to "${input.newString.slice(0, 50)}..."`,
      category: "context",
      filePath: input.filePath,
    })

    return {
      success: true,
      changes: result.replacements,
      message: `Edited ${input.filePath}: ${result.replacements} replacement(s)`,
    }
  },

  capabilities: ["write"],
  memory: {
    store: true,
  },
})
```

---

## Tool Registry

```typescript
// packages/opencode/src/orca/tools/registry.ts

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map()

  register(tool: Tool): void {
    this.tools.set(tool.id, tool)
  }

  get(id: string): Tool | undefined {
    return this.tools.get(id)
  }

  getByCapability(capability: string): Tool[] {
    return Array.from(this.tools.values()).filter((t) => t.capabilities?.includes(capability))
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values())
  }

  // Initialize default tools
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

    return registry
  }
}
```

---

## File Structure

```
packages/opencode/src/orca/tools/
├── index.ts                    # Tool exports
├── define.ts                   # Tool definition helper
├── registry.ts                 # Tool registry
├── memory/
│   ├── index.ts               # Memory tool exports
│   ├── store.ts               # memory_store
│   ├── recall.ts              # memory_recall
│   ├── search.ts              # memory_search
│   ├── list.ts                # memory_list
│   └── forget.ts              # memory_forget
├── orchestrator/
│   ├── index.ts               # Orchestration tool exports
│   ├── agent-spawn.ts         # agent_spawn
│   ├── agent-delegate.ts      # agent_delegate
│   ├── agent-status.ts        # agent_status
│   ├── task-create.ts         # task_create
│   ├── task-status.ts         # task_status
│   └── coordinate.ts          # coordinate_agents
├── enhanced/
│   ├── index.ts               # Enhanced tool exports
│   ├── read.ts                # Enhanced read
│   ├── write.ts               # Enhanced write
│   └── edit.ts                # Enhanced edit
└── utils/
    ├── format.ts              # Output formatting
    ├── validation.ts          # Input validation
    └── execution.ts           # Execution helpers
```
