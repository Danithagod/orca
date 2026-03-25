import { z } from "zod"
import { fn } from "../../util/fn"
import {
  AgentType,
  AgentStatus,
  AgentCapability,
  type Agent,
  TaskType,
  TaskStatus,
  TaskPriority,
  type Task,
} from "../types"

const SUBAGENT_MAP: Record<AgentType, string> = {
  architect: "explore",
  builder: "code",
  tester: "code",
  reviewer: "code",
  "memory-keeper": "code",
  coordinator: "general",
}

interface AgentDefinition {
  type: AgentType
  name: string
  capabilities: AgentCapability[]
  tools: string[]
  memoryScope: "global" | "project" | "task"
  subagentType: string
}

const AGENT_DEFINITIONS: Record<AgentType, AgentDefinition> = {
  architect: {
    type: "architect",
    name: "Architect",
    capabilities: ["explore", "read", "plan"],
    tools: ["glob", "grep", "read", "task"],
    memoryScope: "project",
    subagentType: "explore",
  },
  builder: {
    type: "builder",
    name: "Builder",
    capabilities: ["read", "write", "execute"],
    tools: ["read", "write", "edit", "bash"],
    memoryScope: "task",
    subagentType: "code",
  },
  tester: {
    type: "tester",
    name: "Tester",
    capabilities: ["execute", "test"],
    tools: ["bash", "read", "glob"],
    memoryScope: "task",
    subagentType: "code",
  },
  reviewer: {
    type: "reviewer",
    name: "Reviewer",
    capabilities: ["read", "review"],
    tools: ["read", "grep"],
    memoryScope: "project",
    subagentType: "code",
  },
  "memory-keeper": {
    type: "memory-keeper",
    name: "Memory Keeper",
    capabilities: ["memory"],
    tools: ["memory_store", "memory_recall", "memory_search", "memory_list"],
    memoryScope: "global",
    subagentType: "code",
  },
  coordinator: {
    type: "coordinator",
    name: "Coordinator",
    capabilities: ["plan", "memory"],
    tools: ["agent_spawn", "agent_delegate", "task_create", "task_status"],
    memoryScope: "global",
    subagentType: "general",
  },
}

interface OrchestratorState {
  agents: Map<string, Agent>
  tasks: Map<string, Task>
  projectPath: string
}

let state: OrchestratorState | null = null

function getState(): OrchestratorState {
  if (!state) {
    state = {
      agents: new Map(),
      tasks: new Map(),
      projectPath: process.cwd(),
    }
  }
  return state
}

export namespace Orchestrator {
  export const init = fn(
    z.object({ projectPath: z.string(), config: z.record(z.string(), z.unknown()).optional() }),
    async (input) => {
      state = {
        agents: new Map(),
        tasks: new Map(),
        projectPath: input.projectPath,
      }
      return { initialized: true, projectPath: input.projectPath }
    },
  )

  export const registerAgent = fn(
    z.object({ type: AgentType, config: z.record(z.string(), z.unknown()).optional() }),
    async (input) => {
      const def = AGENT_DEFINITIONS[input.type]
      if (!def) throw new Error(`Unknown agent type: ${input.type}`)

      const s = getState()
      const agent: Agent = {
        id: crypto.randomUUID(),
        type: def.type,
        name: def.name,
        capabilities: def.capabilities,
        tools: def.tools,
        status: "idle",
        tasksCompleted: 0,
        memoryScope: def.memoryScope,
        config: input.config ?? {},
        createdAt: new Date(),
      }

      s.agents.set(agent.id, agent)
      return agent
    },
  )

  export const createTask = fn(
    z.object({
      title: z.string(),
      description: z.string(),
      type: TaskType,
      input: z.record(z.string(), z.unknown()),
      priority: TaskPriority.optional(),
      dependencies: z.array(z.string()).optional(),
    }),
    async (input) => {
      const s = getState()
      const task: Task = {
        id: crypto.randomUUID(),
        title: input.title,
        description: input.description,
        type: input.type,
        input: input.input,
        priority: input.priority ?? "medium",
        status: "pending",
        dependencies: input.dependencies ?? [],
        context: {},
        memoryKeys: [],
        progress: 0,
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      s.tasks.set(task.id, task)
      return task
    },
  )

  export const routeTask = fn(z.object({ taskId: z.string() }), async (input) => {
    const s = getState()
    const task = s.tasks.get(input.taskId)
    if (!task) throw new Error(`Task not found: ${input.taskId}`)

    const typeToAgent: Record<TaskType, AgentType> = {
      explore: "architect",
      implement: "builder",
      test: "tester",
      review: "reviewer",
      generic: "coordinator",
    }

    const preferredType = typeToAgent[task.type]
    let bestAgent: Agent | null = null
    let bestScore = -1

    for (const agent of s.agents.values()) {
      if (agent.status !== "idle") continue

      let score = agent.type === preferredType ? 50 : 0
      score += agent.tasksCompleted

      if (score > bestScore) {
        bestScore = score
        bestAgent = agent
      }
    }

    if (!bestAgent) {
      const agent = await registerAgent({ type: preferredType })
      return { agentId: agent.id, task: input.taskId }
    }

    return { agentId: bestAgent.id, task: input.taskId }
  })

  export const executeTask = fn(z.object({ taskId: z.string(), agentId: z.string().optional() }), async (input) => {
    const s = getState()
    const task = s.tasks.get(input.taskId)
    if (!task) throw new Error(`Task not found: ${input.taskId}`)

    const agentId = input.agentId ?? (await routeTask({ taskId: input.taskId })).agentId
    const agent = s.agents.get(agentId)
    if (!agent) throw new Error(`Agent not found: ${agentId}`)

    agent.status = "active"
    agent.currentTask = input.taskId
    task.status = "running"
    task.assignedAgent = agentId
    task.startTime = new Date()

    const result = { completed: true, agentId, taskId: task.id }

    task.status = "completed"
    task.progress = 100
    task.endTime = new Date()
    task.duration = task.endTime.getTime() - (task.startTime?.getTime() ?? 0)
    task.result = result

    agent.status = "idle"
    agent.currentTask = undefined
    agent.tasksCompleted++

    return { taskId: input.taskId, agentId, status: "completed", result }
  })

  export const getSubagentType = fn(z.object({ agentType: AgentType }), async (input) => {
    const def = AGENT_DEFINITIONS[input.agentType]
    if (!def) throw new Error(`Unknown agent type: ${input.agentType}`)
    return def.subagentType
  })

  export const startTask = fn(z.object({ taskId: z.string(), agentId: z.string() }), async (input) => {
    const s = getState()
    const task = s.tasks.get(input.taskId)
    if (!task) throw new Error(`Task not found: ${input.taskId}`)

    const agent = s.agents.get(input.agentId)
    if (!agent) throw new Error(`Agent not found: ${input.agentId}`)

    agent.status = "active"
    agent.currentTask = input.taskId
    task.status = "running"
    task.assignedAgent = input.agentId
    task.startTime = new Date()
    task.updatedAt = new Date()

    return { taskId: input.taskId, agentId: input.agentId, status: "running" }
  })

  export const completeTask = fn(
    z.object({
      taskId: z.string(),
      result: z.unknown().optional(),
      error: z.string().optional(),
    }),
    async (input) => {
      const s = getState()
      const task = s.tasks.get(input.taskId)
      if (!task) throw new Error(`Task not found: ${input.taskId}`)

      const agent = task.assignedAgent ? s.agents.get(task.assignedAgent) : null

      task.status = input.error ? "failed" : "completed"
      task.progress = 100
      task.endTime = new Date()
      task.duration = task.endTime.getTime() - (task.startTime?.getTime() ?? 0)
      task.result = input.result
      task.error = input.error
      task.updatedAt = new Date()

      if (agent) {
        agent.status = "idle"
        agent.currentTask = undefined
        if (!input.error) agent.tasksCompleted++
      }

      return {
        taskId: input.taskId,
        status: task.status,
        agentId: task.assignedAgent,
      }
    },
  )

  export const cancelTask = fn(z.object({ taskId: z.string() }), async (input) => {
    const s = getState()
    const task = s.tasks.get(input.taskId)
    if (!task) throw new Error(`Task not found: ${input.taskId}`)

    const agent = task.assignedAgent ? s.agents.get(task.assignedAgent) : null

    task.status = "failed"
    task.error = "Cancelled"
    task.updatedAt = new Date()

    if (agent) {
      agent.status = "idle"
      agent.currentTask = undefined
    }

    return { taskId: input.taskId, status: "cancelled" }
  })

  export const getAgent = fn(z.object({ agentId: z.string() }), async (input) => {
    return getState().agents.get(input.agentId) ?? null
  })

  export const getAgents = fn(
    z.object({ type: AgentType.optional(), status: AgentStatus.optional() }),
    async (input) => {
      const s = getState()
      return Array.from(s.agents.values()).filter(
        (a) => (!input.type || a.type === input.type) && (!input.status || a.status === input.status),
      )
    },
  )

  export const getTask = fn(z.object({ taskId: z.string() }), async (input) => {
    return getState().tasks.get(input.taskId) ?? null
  })

  export const getTasks = fn(z.object({ status: TaskStatus.optional(), type: TaskType.optional() }), async (input) => {
    const s = getState()
    return Array.from(s.tasks.values()).filter(
      (t) => (!input.status || t.status === input.status) && (!input.type || t.type === input.type),
    )
  })
}
