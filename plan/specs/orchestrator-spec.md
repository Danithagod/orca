# Orca Orchestrator Specification

## Overview

Multi-agent orchestration system that coordinates specialized agents to work together on complex tasks.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ORCHESTRATOR                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐  │
│  │   Task        │  │   Agent       │  │   Coordination           │  │
│  │   Analyzer    │──│   Router      │──│   Strategy               │  │
│  └───────────────┘  └───────────────┘  └───────────────────────────┘  │
│         │                    │                      │                  │
│         └────────────────────┼──────────────────────┘                  │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     AGENT POOL                                  │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐│   │
│  │  │Architect│  │ Builder │  │ Tester  │  │Reviewer │  │Memory  ││   │
│  │  │         │  │         │  │         │  │         │  │Keeper  ││   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └────────┘│   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### Agent

An agent is a specialized worker with specific capabilities.

```typescript
import { z } from "zod"

export const AgentStatus = z.enum(["idle", "active", "waiting", "error", "completed"])
export type AgentStatus = z.infer<typeof AgentStatus>

export const AgentCapability = z.enum([
  "explore", // Codebase exploration
  "read", // File reading
  "write", // File writing/editing
  "execute", // Command execution
  "test", // Test execution
  "review", // Code review
  "memory", // Memory operations
  "plan", // Planning
])
export type AgentCapability = z.infer<typeof AgentCapability>

export const AgentType = z.enum([
  "architect", // Planning and exploration
  "builder", // Implementation
  "tester", // Testing and verification
  "reviewer", // Code review
  "memory-keeper", // Context management
  "coordinator", // Multi-agent coordination
])
export type AgentType = z.infer<typeof AgentType>

export const Agent = z.object({
  id: z.string().uuid(),
  type: AgentType,
  name: z.string(),

  // Capabilities
  capabilities: z.array(AgentCapability),
  tools: z.array(z.string()), // Available tool IDs

  // State
  status: AgentStatus.default("idle"),
  currentTask: z.string().optional(),
  tasksCompleted: z.number().default(0),

  // Memory scope
  memoryScope: z.enum(["global", "project", "task"]),

  // Configuration
  config: z.record(z.unknown()).default({}),

  // Metadata
  createdAt: z.date(),
  lastActiveAt: z.date().optional(),
})

export type Agent = z.infer<typeof Agent>
```

### Task

A task is a unit of work that can be delegated to an agent.

```typescript
export const TaskPriority = z.enum(["low", "medium", "high", "critical"])
export type TaskPriority = z.infer<typeof TaskPriority>

export const TaskStatus = z.enum(["pending", "queued", "running", "completed", "failed", "cancelled"])
export type TaskStatus = z.infer<typeof TaskStatus>

export const Task = z.object({
  id: z.string().uuid(),

  // Task definition
  title: z.string(),
  description: z.string(),
  type: z.enum(["explore", "implement", "test", "review", "generic"]),

  // Assignment
  assignedAgent: z.string().optional(),
  dependencies: z.array(z.string()).default([]), // Task IDs

  // Priority and scheduling
  priority: TaskPriority.default("medium"),
  queuePosition: z.number().optional(),

  // Input/Output
  input: z.record(z.unknown()),
  output: z.record(z.unknown()).optional(),
  result: z.unknown().optional(),

  // Context
  context: z.record(z.unknown()).default({}),
  memoryKeys: z.array(z.string()).default([]),

  // Status
  status: TaskStatus.default("pending"),
  progress: z.number().min(0).max(100).default(0),
  error: z.string().optional(),

  // Metrics
  attempts: z.number().default(0),
  maxAttempts: z.number().default(3),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  duration: z.number().optional(), // in milliseconds

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Task = z.infer<typeof Task>
```

### Coordination Strategy

```typescript
export const CoordinationStrategy = z.enum([
  "sequential", // Execute tasks one after another
  "parallel", // Execute tasks simultaneously
  "hierarchical", // Coordinator delegates to sub-agents
  "vote", // Multiple agents vote on outcome
  "race", // First to complete wins
])
export type CoordinationStrategy = z.infer<typeof CoordinationStrategy>

export const CoordinationPlan = z.object({
  strategy: CoordinationStrategy,
  agents: z.array(Agent),
  taskGraph: z.map(z.string(), z.array(z.string())), // taskId -> dependent taskIds
  timeout: z.number().optional(),
  retryPolicy: z.object({
    maxRetries: z.number().default(3),
    backoff: z.enum(["fixed", "exponential", "linear"]).default("exponential"),
    baseDelay: z.number().default(1000),
  }),
})

export type CoordinationPlan = z.infer<typeof CoordinationPlan>
```

---

## Agent Definitions

### Architect Agent

Plans and explores codebases.

```typescript
export const ArchitectAgent: AgentDefinition = {
  type: "architect",
  name: "Architect",

  capabilities: ["explore", "read", "plan"],

  tools: [
    "glob",
    "grep",
    "read",
    "task", // For spawning sub-tasks
  ],

  memoryScope: "project",

  prompts: {
    system: `You are the Architect agent. Your role is to explore codebases,
    understand structure, and create implementation plans. Focus on:
    - Understanding existing patterns and conventions
    - Identifying relevant files and modules
    - Creating detailed plans for implementation
    - Documenting architecture decisions`,

    taskAnalyze: `Analyze the following task and determine:
    1. What files need to be explored
    2. What existing patterns to follow
    3. What the implementation strategy should be
    
    Task: {task}
    
    Current context:
    {context}`,
  },

  hooks: {
    beforeTask: async (task: Task) => {
      // Load relevant project memories
      const memories = await MemoryEngine.search({
        query: task.description,
        categories: ["architecture", "conventions", "decisions"],
        limit: 5,
      })
      return { memories }
    },

    afterTask: async (task: Task) => {
      // Store architecture decisions
      if (task.result?.decisions) {
        for (const decision of task.result.decisions) {
          await MemoryEngine.store({
            key: `decision-${Date.now()}`,
            title: decision.title,
            content: decision.content,
            category: "decisions",
          })
        }
      }
    },
  },
}
```

### Builder Agent

Implements code changes.

```typescript
export const BuilderAgent: AgentDefinition = {
  type: "builder",
  name: "Builder",

  capabilities: ["read", "write", "execute"],

  tools: ["read", "write", "edit", "bash"],

  memoryScope: "task",

  prompts: {
    system: `You are the Builder agent. Your role is to implement
    code changes based on plans from the Architect. Focus on:
    - Following existing patterns and conventions
    - Making minimal, targeted changes
    - Ensuring code quality
    - Writing clear commit messages`,

    implement: `Implement the following changes:
    
    Plan: {plan}
    
    Files to modify: {files}
    
    Constraints:
    - Follow existing patterns in the codebase
    - Make minimal changes
    - Test your changes if possible
    - Document any deviations from the plan`,
  },

  hooks: {
    beforeTask: async (task: Task) => {
      // Load plan and context
      const plan = await MemoryEngine.recall(task.context.planKey)
      const patterns = await MemoryEngine.search({
        query: "code patterns conventions",
        categories: ["patterns", "conventions"],
        limit: 10,
      })
      return { plan, patterns }
    },
  },
}
```

### Tester Agent

Executes tests and verification.

```typescript
export const TesterAgent: AgentDefinition = {
  type: "tester",
  name: "Tester",

  capabilities: ["execute", "test"],

  tools: ["bash", "read", "glob"],

  memoryScope: "task",

  prompts: {
    system: `You are the Tester agent. Your role is to verify
    implementations through testing. Focus on:
    - Running existing test suites
    - Writing new tests when needed
    - Verifying functionality works as expected
    - Reporting clear test results`,

    test: `Test the implementation for:
    
    Task: {task}
    
    Implementation: {implementation}
    
    Run tests and report:
    1. Pass/fail status
    2. Any errors or issues
    3. Coverage information if available
    4. Recommendations for improvement`,
  },
}
```

### Reviewer Agent

Reviews code quality.

```typescript
export const ReviewerAgent: AgentDefinition = {
  type: "reviewer",
  name: "Reviewer",

  capabilities: ["read", "review"],

  tools: ["read", "grep"],

  memoryScope: "project",

  prompts: {
    system: `You are the Reviewer agent. Your role is to review
    code for quality, security, and best practices. Focus on:
    - Code style and conventions
    - Potential bugs and errors
    - Security vulnerabilities
    - Performance issues
    - Maintainability`,

    review: `Review the following code changes:
    
    Files: {files}
    
    Check for:
    1. Adherence to project conventions
    2. Potential bugs or errors
    3. Security issues
    4. Performance concerns
    5. Code clarity and maintainability
    
    Provide specific feedback and recommendations.`,
  },
}
```

### Memory Keeper Agent

Manages context and memory.

```typescript
export const MemoryKeeperAgent: AgentDefinition = {
  type: "memory-keeper",
  name: "Memory Keeper",

  capabilities: ["memory"],

  tools: [
    // Memory tools
    "memory_store",
    "memory_recall",
    "memory_search",
    "memory_list",
  ],

  memoryScope: "global",

  prompts: {
    system: `You are the Memory Keeper agent. Your role is to
    maintain project context and memory. Focus on:
    - Storing important decisions and patterns
    - Retrieving relevant context for tasks
    - Organizing and categorizing memories
    - Cleaning up outdated information`,

    capture: `Capture the following as a memory:
    
    Context: {context}
    
    Determine:
    1. What category this belongs to
    2. Key tags for retrieval
    3. Summary for quick reference
    4. Related memories to link`,
  },
}
```

---

## Orchestration Engine

### Main Orchestrator

```typescript
// packages/opencode/src/orca/orchestrator/index.ts

export namespace Orchestrator {
  // Initialize orchestrator
  export const init = fn(
    z.object({
      projectPath: z.string(),
      config: z.record(z.unknown()).optional(),
    }),
    async (input) => {
      // Load agent definitions
      // Initialize memory engine
      // Set up coordination
      return { orchestratorId: crypto.randomUUID() }
    },
  )

  // Register agent
  export const registerAgent = fn(
    z.object({
      type: AgentType,
      config: z.record(z.unknown()).optional(),
    }),
    async (input) => {
      // Create agent instance
      // Initialize agent state
      // Return agent ID
    },
  )

  // Create task
  export const createTask = fn(
    z.object({
      title: z.string(),
      description: z.string(),
      type: TaskType,
      input: z.record(z.unknown()),
      priority: TaskPriority.optional(),
      dependencies: z.array(z.string()).optional(),
    }),
    async (input) => {
      // Create task record
      // Analyze task
      // Queue for routing
    },
  )

  // Route task to appropriate agent
  export const routeTask = fn(
    z.object({
      taskId: z.string(),
    }),
    async (input) => {
      const task = await getTask(input.taskId)

      // Determine best agent for task
      const agent = await selectAgent(task)

      // Assign task
      await assignTask(task.id, agent.id)

      return { agentId: agent.id }
    },
  )

  // Execute task
  export const executeTask = fn(
    z.object({
      taskId: z.string(),
      agentId: z.string().optional(),
    }),
    async (input) => {
      // Get task and agent
      const task = await getTask(input.taskId)
      const agentId = input.agentId ?? (await routeTask(input)).agentId
      const agent = await getAgent(agentId)

      // Execute
      const result = await runAgent(agent, task)

      // Store result
      await completeTask(task.id, result)

      return result
    },
  )

  // Coordinate multiple agents
  export const coordinate = fn(
    z.object({
      strategy: CoordinationStrategy,
      agents: z.array(z.string()),
      task: z.string(),
      timeout: z.number().optional(),
    }),
    async (input) => {
      switch (input.strategy) {
        case "sequential":
          return await coordinateSequential(input)
        case "parallel":
          return await coordinateParallel(input)
        case "hierarchical":
          return await coordinateHierarchical(input)
        case "vote":
          return await coordinateVote(input)
        case "race":
          return await coordinateRace(input)
      }
    },
  )
}
```

### Task Analyzer

```typescript
// packages/opencode/src/orca/orchestrator/analyzer.ts

export namespace TaskAnalyzer {
  // Analyze task complexity and requirements
  export const analyze = fn(
    z.object({
      task: Task,
    }),
    async (input) => {
      // Determine task type
      const type = await classifyTask(input.task)

      // Estimate complexity
      const complexity = await estimateComplexity(input.task)

      // Identify required capabilities
      const capabilities = await identifyCapabilities(input.task)

      // Check dependencies
      const dependencies = await findDependencies(input.task)

      return {
        type,
        complexity,
        capabilities,
        dependencies,
        recommendedAgents: await selectBestAgents(capabilities),
      }
    },
  )

  // Classify task type
  const classifyTask = async (task: Task): Promise<TaskType> => {
    const keywords = {
      explore: ["find", "search", "explore", "locate", "identify"],
      implement: ["create", "build", "implement", "add", "write", "update"],
      test: ["test", "verify", "check", "validate", "run"],
      review: ["review", "check", "analyze", "audit"],
    }

    const desc = task.description.toLowerCase()

    for (const [type, words] of Object.entries(keywords)) {
      if (words.some((w) => desc.includes(w))) {
        return type as TaskType
      }
    }

    return "generic"
  }

  // Estimate complexity (1-5)
  const estimateComplexity = async (task: Task): Promise<number> => {
    let score = 1

    // Check for multiple files
    if (task.context.files?.length > 1) score += 1

    // Check for external dependencies
    if (task.context.dependencies?.length > 0) score += 1

    // Check for complex operations
    const complexWords = ["refactor", "migrate", "integrate", "redesign"]
    if (complexWords.some((w) => task.description.includes(w))) score += 1

    // Check for testing requirements
    if (task.description.includes("test") || task.description.includes("verify")) {
      score += 1
    }

    return Math.min(score, 5)
  }
}
```

### Agent Selector

```typescript
// packages/opencode/src/orca/orchestrator/selector.ts

export namespace AgentSelector {
  // Select best agent for task
  export const selectBest = fn(
    z.object({
      task: Task,
      availableAgents: z.array(Agent),
    }),
    async (input) => {
      // Score each agent
      const scores = input.availableAgents.map((agent) => ({
        agent,
        score: calculateScore(agent, input.task),
      }))

      // Sort by score
      scores.sort((a, b) => b.score - a.score)

      return scores[0].agent
    },
  )

  const calculateScore = (agent: Agent, task: Task): number => {
    let score = 0

    // Capability match
    const requiredCapabilities = task.context.requiredCapabilities ?? []
    const matchedCapabilities = requiredCapabilities.filter((c) => agent.capabilities.includes(c))
    score += matchedCapabilities.length * 20

    // Type match (architect for explore, builder for implement, etc.)
    const typeMatch: Record<string, AgentType> = {
      explore: "architect",
      implement: "builder",
      test: "tester",
      review: "reviewer",
    }

    if (typeMatch[task.type] === agent.type) {
      score += 30
    }

    // Current load (prefer idle agents)
    if (agent.status === "idle") {
      score += 15
    } else if (agent.status === "active") {
      score -= 10
    }

    // Experience (agents that completed more tasks)
    score += Math.min(agent.tasksCompleted, 20)

    // Memory scope relevance
    if (task.memoryKeys?.length && agent.memoryScope === "project") {
      score += 10
    }

    return score
  }
}
```

---

## Coordination Strategies

### Sequential

```typescript
// packages/opencode/src/orca/orchestrator/strategies/sequential.ts

export const coordinateSequential = async (input: CoordinateInput): Promise<Result> => {
  const results: TaskResult[] = []

  for (const agentId of input.agents) {
    const agent = await getAgent(agentId)

    // Update status
    await updateAgentStatus(agent.id, "active")

    try {
      // Execute task
      const result = await executeWithTimeout(() => runAgent(agent, input.task), input.timeout ?? 60000)

      results.push(result)
      await updateAgentStatus(agent.id, "completed")
    } catch (error) {
      await updateAgentStatus(agent.id, "error")
      throw error
    }
  }

  return { results }
}
```

### Parallel

```typescript
// packages/opencode/src/orca/orchestrator/strategies/parallel.ts

export const coordinateParallel = async (input: CoordinateInput): Promise<Result> => {
  // Start all agents simultaneously
  const promises = input.agents.map(async (agentId) => {
    const agent = await getAgent(agentId)
    await updateAgentStatus(agent.id, "active")

    try {
      const result = await executeWithTimeout(() => runAgent(agent, input.task), input.timeout ?? 60000)
      await updateAgentStatus(agent.id, "completed")
      return result
    } catch (error) {
      await updateAgentStatus(agent.id, "error")
      throw error
    }
  })

  const results = await Promise.allSettled(promises)

  return {
    results: results.filter((r) => r.status === "fulfilled").map((r) => r.value),
    errors: results.filter((r) => r.status === "rejected").map((r) => r.reason),
  }
}
```

### Hierarchical

```typescript
// packages/opencode/src/orca/orchestrator/strategies/hierarchical.ts

export const coordinateHierarchical = async (input: CoordinateInput): Promise<Result> => {
  // Coordinator is first agent
  const [coordinatorId, ...workerIds] = input.agents

  const coordinator = await getAgent(coordinatorId)

  // Coordinator analyzes task and creates subtasks
  await updateAgentStatus(coordinator.id, "active")

  const plan = await runAgent(coordinator, {
    ...input.task,
    type: "plan",
    context: {
      availableWorkers: workerIds.length,
    },
  })

  // Distribute subtasks to workers
  const workerTasks = plan.subtasks.map((subtask: Task, i: number) => ({
    agentId: workerIds[i % workerIds.length],
    task: subtask,
  }))

  // Execute subtasks
  const results = await Promise.all(workerTasks.map(({ agentId, task }) => executeTask({ taskId: task.id, agentId })))

  // Coordinator aggregates results
  const finalResult = await runAgent(coordinator, {
    type: "aggregate",
    input: { results },
  })

  return finalResult
}
```

### Vote

```typescript
// packages/opencode/src/orca/orchestrator/strategies/vote.ts

export const coordinateVote = async (input: CoordinateInput): Promise<Result> => {
  // All agents work on the same task
  const promises = input.agents.map((agentId) => executeTask({ taskId: input.task.id, agentId }))

  const results = await Promise.allSettled(promises)

  // Collect successful results
  const successfulResults = results.filter((r) => r.status === "fulfilled").map((r) => r.value)

  // Vote on best result
  const votes = await Promise.all(input.agents.map((agentId) => vote(agentId, successfulResults)))

  // Tally votes
  const tally: Record<string, number> = {}
  for (const vote of votes) {
    tally[vote.resultId] = (tally[vote.resultId] ?? 0) + 1
  }

  // Find winner
  const winnerId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0]

  return successfulResults.find((r) => r.id === winnerId)
}
```

---

## State Management

### Agent State

```typescript
// packages/opencode/src/orca/orchestrator/state.ts

interface AgentState {
  id: string
  status: AgentStatus
  currentTask?: string
  lastHeartbeat: number
  metrics: {
    tasksCompleted: number
    tasksFailed: number
    averageDuration: number
    successRate: number
  }
}

class AgentStateManager {
  private agents: Map<string, AgentState> = new Map()
  private heartbeatInterval: number = 30000 // 30 seconds

  async updateStatus(agentId: string, status: AgentStatus): Promise<void> {
    const state = this.agents.get(agentId)
    if (state) {
      state.status = status
      state.lastHeartbeat = Date.now()
    }
  }

  async assignTask(agentId: string, taskId: string): Promise<void> {
    const state = this.agents.get(agentId)
    if (state) {
      state.currentTask = taskId
      state.status = "active"
    }
  }

  async completeTask(agentId: string, success: boolean, duration: number): Promise<void> {
    const state = this.agents.get(agentId)
    if (state) {
      state.currentTask = undefined
      state.status = "idle"
      state.metrics.tasksCompleted++
      if (!success) state.metrics.tasksFailed++
      state.metrics.averageDuration = (state.metrics.averageDuration + duration) / 2
      state.metrics.successRate =
        state.metrics.tasksCompleted / (state.metrics.tasksCompleted + state.metrics.tasksFailed)
    }
  }

  async getHealthStatus(): Promise<AgentHealth[]> {
    const now = Date.now()
    return Array.from(this.agents.values()).map((state) => ({
      agentId: state.id,
      healthy: now - state.lastHeartbeat < this.heartbeatInterval * 2,
      status: state.status,
    }))
  }
}
```

---

## Commands

### Orchestration Commands

```typescript
// packages/opencode/src/orca/commands/orchestrator.ts

export namespace OrchestratorCommands {
  // Spawn an agent
  export const spawn = fn(
    z.object({
      type: AgentType,
      task: z.string().optional(),
    }),
    async (input) => {
      const agent = await Orchestrator.registerAgent({
        type: input.type,
      })

      if (input.task) {
        await Orchestrator.createTask({
          title: input.task,
          description: input.task,
          type: "generic",
          input: { task: input.task },
        })
      }

      return `Spawned ${input.type} agent: ${agent.id}`
    },
  )

  // List agents
  export const listAgents = fn(
    z.object({
      status: AgentStatus.optional(),
    }),
    async (input) => {
      const agents = await getAgents(input.status)

      return agents
        .map((a) => `${a.id.slice(0, 8)} | ${a.type.padEnd(15)} | ${a.status.padEnd(10)} | ${a.currentTask ?? "idle"}`)
        .join("\n")
    },
  )

  // Delegate task
  export const delegate = fn(
    z.object({
      task: z.string(),
      agentType: AgentType.optional(),
      strategy: CoordinationStrategy.optional(),
    }),
    async (input) => {
      // Create task
      const task = await Orchestrator.createTask({
        title: input.task,
        description: input.task,
        type: "generic",
        input: { task: input.task },
      })

      // Execute
      if (input.strategy && input.agentType) {
        // Multi-agent coordination
        const agents = await getAgentsByType(input.agentType)
        const result = await Orchestrator.coordinate({
          strategy: input.strategy,
          agents: agents.map((a) => a.id),
          task: task.id,
        })
        return result
      } else {
        // Single agent
        const result = await Orchestrator.executeTask({
          taskId: task.id,
          agentId: input.agentId,
        })
        return result
      }
    },
  )

  // Task status
  export const taskStatus = fn(
    z.object({
      taskId: z.string(),
    }),
    async (input) => {
      const task = await getTask(input.taskId)

      return `Task: ${task.title}
Status: ${task.status}
Progress: ${task.progress}%
Agent: ${task.assignedAgent ?? "unassigned"}
Duration: ${task.duration ?? "ongoing"}ms
${task.error ? `Error: ${task.error}` : ""}`
    },
  )
}
```

---

## File Structure

```
packages/opencode/src/orca/orchestrator/
├── index.ts                    # Main exports
├── types.ts                    # Zod schemas and types
├── engine.ts                   # Main orchestration engine
├── analyzer/
│   ├── index.ts               # Task analyzer
│   ├── complexity.ts          # Complexity estimation
│   └── classification.ts       # Task classification
├── agents/
│   ├── index.ts               # Agent exports
│   ├── architect.ts            # Architect agent
│   ├── builder.ts              # Builder agent
│   ├── tester.ts               # Tester agent
│   ├── reviewer.ts              # Reviewer agent
│   └── memory-keeper.ts         # Memory keeper agent
├── strategies/
│   ├── index.ts               # Strategy exports
│   ├── sequential.ts          # Sequential execution
│   ├── parallel.ts             # Parallel execution
│   ├── hierarchical.ts         # Hierarchical coordination
│   ├── vote.ts                 # Voting strategy
│   └── race.ts                 # Race strategy
├── selector/
│   ├── index.ts               # Agent selector
│   └── scoring.ts              # Selection scoring
├── state/
│   ├── index.ts               # State management
│   ├── agent-state.ts          # Agent state
│   └── task-state.ts           # Task state
├── commands/
│   └── orchestrator.ts         # CLI commands
└── utils/
    ├── timeout.ts              # Timeout handling
    ├── retry.ts                # Retry logic
    └── logger.ts               # Orchestration logging
```
