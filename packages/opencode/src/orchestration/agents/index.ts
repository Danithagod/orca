import type { AgentDefinition, AgentRuntimeState, AgentMetrics } from "../types"
import type { OrchestrationAgentInfo } from "../types"

const RUNTIME_STATES = new Map<string, AgentRuntimeState>()

function generateId(): string {
  return `agent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function createDefaultMetrics(): AgentMetrics {
  return {
    tasksCompleted: 0,
    tasksFailed: 0,
    totalDuration: 0,
    averageDuration: 0,
    successRate: 1.0,
    lastTaskAt: undefined,
  }
}

export function createAgentDefinition(
  type: OrchestrationAgentInfo["type"],
  customConfig?: Partial<OrchestrationAgentInfo>,
): AgentDefinition {
  const baseDefinitions: Record<string, AgentDefinition> = {
    architect: {
      type: "architect",
      name: "Architect",
      description: "Plans and designs system architecture",
      capabilities: [
        { name: "explore", level: "primary", description: "Explore codebase structure" },
        { name: "read", level: "primary", description: "Read files and understand patterns" },
        { name: "plan", level: "primary", description: "Create implementation plans" },
        { name: "memory", level: "secondary", description: "Store architectural decisions" },
      ],
      tools: ["read", "glob", "grep", "codesearch"],
      memoryScope: "project",
      prompts: {
        system: "You are an architect agent. Analyze requirements and create detailed implementation plans.",
      },
      hooks: {},
      maxConcurrent: 2,
      timeout: 120000,
    },
    builder: {
      type: "builder",
      name: "Builder",
      description: "Implements code based on specifications",
      capabilities: [
        { name: "read", level: "primary", description: "Read existing code" },
        { name: "write", level: "primary", description: "Create new files" },
        { name: "edit", level: "primary", description: "Modify existing files" },
        { name: "execute", level: "secondary", description: "Run build commands" },
      ],
      tools: ["read", "write", "edit", "glob", "bash"],
      memoryScope: "task",
      prompts: {
        system: "You are a builder agent. Write clean, working code following best practices.",
      },
      hooks: {},
      maxConcurrent: 3,
      timeout: 180000,
    },
    tester: {
      type: "tester",
      name: "Tester",
      description: "Creates and runs tests",
      capabilities: [
        { name: "read", level: "primary", description: "Read code to understand behavior" },
        { name: "execute", level: "primary", description: "Run test commands" },
        { name: "write", level: "secondary", description: "Write test files" },
        { name: "test", level: "primary", description: "Execute and validate tests" },
      ],
      tools: ["read", "bash", "write", "glob"],
      memoryScope: "task",
      prompts: {
        system: "You are a tester agent. Write comprehensive tests and validate functionality.",
      },
      hooks: {},
      maxConcurrent: 2,
      timeout: 120000,
    },
    reviewer: {
      type: "reviewer",
      name: "Reviewer",
      description: "Reviews code for quality and security",
      capabilities: [
        { name: "read", level: "primary", description: "Read code for review" },
        { name: "review", level: "primary", description: "Perform code review" },
        { name: "explore", level: "secondary", description: "Understand context" },
      ],
      tools: ["read", "glob", "grep", "codesearch"],
      memoryScope: "project",
      prompts: {
        system:
          "You are a reviewer agent. Provide constructive code reviews focusing on quality, security, and best practices.",
      },
      hooks: {},
      maxConcurrent: 2,
      timeout: 90000,
    },
    "memory-keeper": {
      type: "memory-keeper",
      name: "Memory Keeper",
      description: "Manages and retrieves memory context",
      capabilities: [
        { name: "memory", level: "primary", description: "Store and retrieve memories" },
        { name: "read", level: "secondary", description: "Read context files" },
        { name: "explore", level: "secondary", description: "Discover relevant context" },
      ],
      tools: ["read", "glob", "grep"],
      memoryScope: "global",
      prompts: {
        system: "You are a memory keeper agent. Manage context memory and provide relevant information when needed.",
      },
      hooks: {},
      maxConcurrent: 1,
      timeout: 30000,
    },
    orchestrator: {
      type: "orchestrator",
      name: "Orchestrator",
      description: "Coordinates multi-agent workflows",
      capabilities: [
        { name: "delegate", level: "primary", description: "Delegate tasks to agents" },
        { name: "explore", level: "secondary", description: "Analyze task requirements" },
        { name: "plan", level: "secondary", description: "Plan execution strategy" },
        { name: "memory", level: "secondary", description: "Access relevant memories" },
      ],
      tools: ["read", "task", "bash"],
      memoryScope: "project",
      prompts: {
        system:
          "You are an orchestrator agent. Coordinate multiple specialized agents to accomplish complex tasks efficiently.",
      },
      hooks: {},
      maxConcurrent: 1,
      timeout: 300000,
    },
  }

  const base = baseDefinitions[type]
  if (!base && type !== "custom") {
    throw new Error(`Unknown agent type: ${type}`)
  }

  if (type === "custom" || !base) {
    return {
      type: "custom",
      name: customConfig?.name ?? "Custom Agent",
      description: customConfig?.description,
      capabilities: customConfig?.capabilities ?? [],
      tools: customConfig?.tools ?? [],
      memoryScope: customConfig?.memoryScope ?? "task",
      prompts: { system: "You are a custom agent." },
      hooks: {},
      maxConcurrent: customConfig?.maxConcurrent ?? 1,
      timeout: customConfig?.timeout ?? 60000,
    }
  }

  return {
    ...base,
    ...customConfig,
    capabilities: customConfig?.capabilities ?? base.capabilities,
    tools: customConfig?.tools ?? base.tools,
  }
}

export async function spawnAgent(
  type: OrchestrationAgentInfo["type"],
  customConfig?: Partial<OrchestrationAgentInfo>,
): Promise<AgentRuntimeState> {
  const id = generateId()
  const definition = createAgentDefinition(type, customConfig)

  const state: AgentRuntimeState = {
    id,
    type: definition.type,
    name: definition.name,
    status: "idle",
    lastHeartbeat: Date.now(),
    spawnedAt: Date.now(),
    metrics: createDefaultMetrics(),
    capabilities: definition.capabilities,
  }

  RUNTIME_STATES.set(id, state)
  return state
}

export async function getAgent(id: string): Promise<AgentRuntimeState | undefined> {
  return RUNTIME_STATES.get(id)
}

export async function listAgents(): Promise<AgentRuntimeState[]> {
  return Array.from(RUNTIME_STATES.values())
}

export async function updateAgentStatus(
  id: string,
  status: AgentRuntimeState["status"],
  currentTaskId?: string,
): Promise<void> {
  const agent = RUNTIME_STATES.get(id)
  if (agent) {
    agent.status = status
    agent.currentTaskId = currentTaskId
    agent.lastHeartbeat = Date.now()
  }
}

export async function updateAgentMetrics(id: string, duration: number, success: boolean): Promise<void> {
  const agent = RUNTIME_STATES.get(id)
  if (!agent) return

  agent.metrics.tasksCompleted++
  if (!success) agent.metrics.tasksFailed++
  agent.metrics.totalDuration += duration
  agent.metrics.averageDuration = agent.metrics.totalDuration / agent.metrics.tasksCompleted
  agent.metrics.successRate =
    agent.metrics.tasksCompleted > 0
      ? (agent.metrics.tasksCompleted - agent.metrics.tasksFailed) / agent.metrics.tasksCompleted
      : 1.0
  agent.metrics.lastTaskAt = Date.now()
}

export async function removeAgent(id: string): Promise<boolean> {
  return RUNTIME_STATES.delete(id)
}

export async function clearAllAgents(): Promise<void> {
  RUNTIME_STATES.clear()
}

export function getActiveAgentCount(): number {
  let count = 0
  for (const agent of RUNTIME_STATES.values()) {
    if (agent.status === "active" || agent.status === "waiting") {
      count++
    }
  }
  return count
}

export function getAgentsByType(type: OrchestrationAgentInfo["type"]): AgentRuntimeState[] {
  return Array.from(RUNTIME_STATES.values()).filter((a) => a.type === type)
}

export const OrchestrationAgents = {
  createDefinition(type: OrchestrationAgentInfo["type"], config?: Partial<OrchestrationAgentInfo>): AgentDefinition {
    return createAgentDefinition(type, config)
  },

  async spawn(
    type: OrchestrationAgentInfo["type"],
    config?: Partial<OrchestrationAgentInfo>,
  ): Promise<AgentRuntimeState> {
    return spawnAgent(type, config)
  },

  async get(id: string): Promise<AgentRuntimeState | undefined> {
    return getAgent(id)
  },

  async list(): Promise<AgentRuntimeState[]> {
    return listAgents()
  },

  async updateStatus(id: string, status: AgentRuntimeState["status"], taskId?: string): Promise<void> {
    return updateAgentStatus(id, status, taskId)
  },

  async updateMetrics(id: string, duration: number, success: boolean): Promise<void> {
    return updateAgentMetrics(id, duration, success)
  },

  async remove(id: string): Promise<boolean> {
    return removeAgent(id)
  },

  async clear(): Promise<void> {
    return clearAllAgents()
  },

  activeCount(): number {
    return getActiveAgentCount()
  },

  byType(type: OrchestrationAgentInfo["type"]): AgentRuntimeState[] {
    return getAgentsByType(type)
  },
}
