import type { AgentRuntimeState } from "../types"
import { OrchestrationAgents } from "../agents"
import { TaskSystem } from "../tasks"

const HEARTBEAT_INTERVAL = 10000
const HEALTH_CHECK_INTERVAL = 30000
const STALE_THRESHOLD = 60000

export interface HealthStatus {
  agentId: string
  status: "healthy" | "degraded" | "unhealthy"
  lastHeartbeat: number
  issues: string[]
}

const heartbeatTimers = new Map<string, ReturnType<typeof setInterval>>()
const healthCheckTimers = new Map<string, ReturnType<typeof setInterval>>()

export async function startHeartbeat(agentId: string): Promise<void> {
  if (heartbeatTimers.has(agentId)) return

  await OrchestrationAgents.updateStatus(agentId, "idle")

  const timer = setInterval(async () => {
    const agent = await OrchestrationAgents.get(agentId)
    if (agent) {
      agent.lastHeartbeat = Date.now()
    }
  }, HEARTBEAT_INTERVAL)

  heartbeatTimers.set(agentId, timer)
}

export async function stopHeartbeat(agentId: string): Promise<void> {
  const timer = heartbeatTimers.get(agentId)
  if (timer) {
    clearInterval(timer)
    heartbeatTimers.delete(agentId)
  }
}

export async function stopAllHeartbeats(): Promise<void> {
  for (const timer of heartbeatTimers.values()) {
    clearInterval(timer)
  }
  heartbeatTimers.clear()
}

export async function checkAgentHealth(agentId: string): Promise<HealthStatus> {
  const agent = await OrchestrationAgents.get(agentId)
  if (!agent) {
    return {
      agentId,
      status: "unhealthy",
      lastHeartbeat: 0,
      issues: ["Agent not found"],
    }
  }

  const issues: string[] = []
  const now = Date.now()
  const timeSinceHeartbeat = now - agent.lastHeartbeat

  if (timeSinceHeartbeat > STALE_THRESHOLD) {
    issues.push(`Stale heartbeat (${Math.round(timeSinceHeartbeat / 1000)}s ago)`)
  }

  if (agent.status === "error") {
    issues.push("Agent in error state")
  }

  if (agent.metrics.successRate < 0.5) {
    issues.push(`Low success rate: ${(agent.metrics.successRate * 100).toFixed(0)}%`)
  }

  let status: HealthStatus["status"] = "healthy"
  if (issues.length >= 2 || timeSinceHeartbeat > STALE_THRESHOLD * 2) {
    status = "unhealthy"
  } else if (issues.length >= 1) {
    status = "degraded"
  }

  const health: HealthStatus = {
    agentId,
    status,
    lastHeartbeat: agent.lastHeartbeat,
    issues,
  }

  return health
}

export async function getAllHealthStatuses(): Promise<HealthStatus[]> {
  const agents = await OrchestrationAgents.list()
  const statuses: HealthStatus[] = []

  for (const agent of agents) {
    const health = await checkAgentHealth(agent.id)
    statuses.push(health)
  }

  return statuses
}

export async function startHealthChecks(): Promise<void> {
  if (healthCheckTimers.size > 0) return

  const timer = setInterval(async () => {
    await getAllHealthStatuses()
  }, HEALTH_CHECK_INTERVAL)

  healthCheckTimers.set("global", timer)
}

export async function stopHealthChecks(): Promise<void> {
  for (const timer of healthCheckTimers.values()) {
    clearInterval(timer)
  }
  healthCheckTimers.clear()
}

export async function recoverAgent(agentId: string): Promise<boolean> {
  const agent = await OrchestrationAgents.get(agentId)
  if (!agent) return false

  if (agent.status === "error" || agent.status === "completed") {
    await OrchestrationAgents.updateStatus(agentId, "idle")
  }

  agent.lastHeartbeat = Date.now()
  return true
}

export async function recoverUnhealthyAgents(): Promise<number> {
  const statuses = await getAllHealthStatuses()
  let recovered = 0

  for (const health of statuses) {
    if (health.status !== "healthy") {
      const success = await recoverAgent(health.agentId)
      if (success) recovered++
    }
  }

  return recovered
}

export interface OrchestrationState {
  agents: {
    total: number
    active: number
    idle: number
    error: number
    unhealthy: number
  }
  tasks: {
    total: number
    pending: number
    running: number
    completed: number
    failed: number
  }
  uptime: number
  lastCheck: number
}

export async function getOrchestrationState(): Promise<OrchestrationState> {
  const agents = await OrchestrationAgents.list()
  const tasks = TaskSystem.list()
  const healthStatuses = await getAllHealthStatuses()

  const agentCounts = {
    total: agents.length,
    active: agents.filter((a) => a.status === "active").length,
    idle: agents.filter((a) => a.status === "idle").length,
    error: agents.filter((a) => a.status === "error").length,
    unhealthy: healthStatuses.filter((h) => h.status === "unhealthy").length,
  }

  const taskCounts = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    running: tasks.filter((t) => t.status === "running").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    failed: tasks.filter((t) => t.status === "failed").length,
  }

  const firstAgent = agents.reduce(
    (oldest: AgentRuntimeState | undefined, agent) => (oldest && agent.spawnedAt < oldest.spawnedAt ? agent : oldest),
    agents[0],
  )
  const uptime = firstAgent ? Date.now() - firstAgent.spawnedAt : 0

  return {
    agents: agentCounts,
    tasks: taskCounts,
    uptime,
    lastCheck: Date.now(),
  }
}

export async function persistState(): Promise<string> {
  const state = await getOrchestrationState()
  const agents = await OrchestrationAgents.list()
  const tasks = TaskSystem.list()

  const persisted = {
    version: 1,
    timestamp: Date.now(),
    state,
    agentSnapshots: agents.map((a) => ({
      id: a.id,
      type: a.type,
      name: a.name,
      status: a.status,
      metrics: a.metrics,
    })),
    taskSnapshots: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      type: t.type,
      status: t.status,
      priority: t.priority,
    })),
  }

  return JSON.stringify(persisted, null, 2)
}

export const StateManagement = {
  async startHeartbeat(agentId: string): Promise<void> {
    return startHeartbeat(agentId)
  },

  async stopHeartbeat(agentId: string): Promise<void> {
    return stopHeartbeat(agentId)
  },

  async stopAllHeartbeats(): Promise<void> {
    return stopAllHeartbeats()
  },

  async health(agentId: string): Promise<HealthStatus> {
    return checkAgentHealth(agentId)
  },

  async allHealth(): Promise<HealthStatus[]> {
    return getAllHealthStatuses()
  },

  async startChecks(): Promise<void> {
    return startHealthChecks()
  },

  async stopChecks(): Promise<void> {
    return stopHealthChecks()
  },

  async recover(agentId: string): Promise<boolean> {
    return recoverAgent(agentId)
  },

  async recoverAll(): Promise<number> {
    return recoverUnhealthyAgents()
  },

  async current(): Promise<OrchestrationState> {
    return getOrchestrationState()
  },

  async snapshot(): Promise<string> {
    return persistState()
  },
}
