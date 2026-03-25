import type { AgentRuntimeState, AgentScore, AgentCapability } from "./types"
import type { TaskAnalysis } from "./tasks"
import type { OrchestrationAgentInfo } from "./types"
import { OrchestrationAgents } from "./agents"

interface SelectionOptions {
  preferIdle?: boolean
  maxLoad?: number
  allowFallback?: boolean
}

const CAPABILITY_WEIGHTS: Record<AgentCapability, number> = {
  explore: 1.0,
  read: 0.9,
  write: 1.0,
  edit: 1.0,
  execute: 0.8,
  test: 1.0,
  review: 1.0,
  plan: 0.9,
  memory: 0.7,
  delegate: 0.5,
}

export function calculateCapabilityScore(
  agentCapabilities: AgentRuntimeState["capabilities"],
  requiredCapabilities: AgentCapability[],
): number {
  if (requiredCapabilities.length === 0) return 1.0

  let totalWeight = 0
  let matchedWeight = 0

  for (const required of requiredCapabilities) {
    const weight = CAPABILITY_WEIGHTS[required] ?? 0.5
    totalWeight += weight

    if (agentCapabilities.some((a) => a.name === required)) {
      const agentCap = agentCapabilities.find((a) => a.name === required)!
      const levelBonus = agentCap.level === "primary" ? 1.0 : agentCap.level === "secondary" ? 0.7 : 0.4
      matchedWeight += weight * levelBonus
    }
  }

  return totalWeight > 0 ? matchedWeight / totalWeight : 0
}

export function calculateLoadScore(agent: AgentRuntimeState, maxConcurrent: number): number {
  const loadRatio = (agent.metrics.tasksCompleted % maxConcurrent) / maxConcurrent
  return 1.0 - loadRatio * 0.5
}

export function calculateIdleBonus(agent: AgentRuntimeState): number {
  if (agent.status === "idle") return 0.2
  if (agent.status === "completed") return 0.1
  return 0
}

export function calculateSuccessRateBonus(agent: AgentRuntimeState): number {
  return agent.metrics.successRate * 0.3
}

export function scoreAgent(
  agent: AgentRuntimeState,
  analysis: TaskAnalysis,
  options: SelectionOptions = {},
): AgentScore {
  const capabilityScore = calculateCapabilityScore(
    agent.capabilities,
    analysis.requiredCapabilities as AgentCapability[],
  )

  const definition = OrchestrationAgents.createDefinition(agent.type)
  const loadScore = calculateLoadScore(agent, definition.maxConcurrent)

  const idleBonus = options.preferIdle ? calculateIdleBonus(agent) : 0
  const successBonus = calculateSuccessRateBonus(agent)

  const capabilityScores: Record<AgentCapability, number> = {} as Record<AgentCapability, number>
  for (const cap of analysis.requiredCapabilities) {
    capabilityScores[cap as AgentCapability] = agent.capabilities.some((a) => a.name === cap)
      ? agent.capabilities.find((a) => a.name === cap)!.level === "primary"
        ? 1.0
        : 0.6
      : 0
  }

  const totalScore = capabilityScore * 0.5 + loadScore * 0.2 + idleBonus + successBonus * 0.1

  let reason = `Capability match: ${(capabilityScore * 100).toFixed(0)}%, Load: ${(loadScore * 100).toFixed(0)}%`
  if (idleBonus > 0) reason += ", Idle bonus"
  if (successBonus > 0.15) reason += `, High success rate: ${(agent.metrics.successRate * 100).toFixed(0)}%`

  return {
    agentId: agent.id,
    agentType: agent.type,
    totalScore,
    capabilityScores,
    loadScore,
    reason,
  }
}

export async function selectBestAgent(
  analysis: TaskAnalysis,
  options: SelectionOptions = {},
): Promise<AgentScore | undefined> {
  const agents = await OrchestrationAgents.list()

  if (agents.length === 0) return undefined

  const availableAgents = agents.filter((agent) => {
    if (agent.status === "error" && !options.allowFallback) return false
    if (options.maxLoad !== undefined) {
      const activeTasks = agent.metrics.tasksCompleted
      if (activeTasks >= options.maxLoad) return false
    }
    return true
  })

  if (availableAgents.length === 0) {
    return options.allowFallback && agents.length > 0 ? scoreAgent(agents[0], analysis, options) : undefined
  }

  const scores = availableAgents.map((agent) => scoreAgent(agent, analysis, options))

  scores.sort((a, b) => b.totalScore - a.totalScore)

  return scores[0]
}

export async function selectMultipleAgents(
  analysis: TaskAnalysis,
  count: number,
  options: SelectionOptions = {},
): Promise<AgentScore[]> {
  const agents = await OrchestrationAgents.list()
  const scores = agents.map((agent) => scoreAgent(agent, analysis, options))

  scores.sort((a, b) => b.totalScore - a.totalScore)

  return scores.slice(0, count)
}

export async function selectByCapability(capability: AgentCapability): Promise<AgentRuntimeState[]> {
  const agents = await OrchestrationAgents.list()

  return agents.filter((agent) => {
    const hasCap = agent.capabilities.some(
      (c) => c.name === capability && (c.level === "primary" || c.level === "secondary"),
    )
    return hasCap
  })
}

export async function selectByType(agentType: OrchestrationAgentInfo["type"]): Promise<AgentRuntimeState[]> {
  return OrchestrationAgents.byType(agentType)
}

export const AgentSelector = {
  score(agent: AgentRuntimeState, analysis: TaskAnalysis, options?: SelectionOptions): AgentScore {
    return scoreAgent(agent, analysis, options)
  },

  async best(analysis: TaskAnalysis, options?: SelectionOptions): Promise<AgentScore | undefined> {
    return selectBestAgent(analysis, options)
  },

  async multiple(analysis: TaskAnalysis, count: number, options?: SelectionOptions): Promise<AgentScore[]> {
    return selectMultipleAgents(analysis, count, options)
  },

  async byCapability(capability: AgentCapability): Promise<AgentRuntimeState[]> {
    return selectByCapability(capability)
  },

  async byType(agentType: OrchestrationAgentInfo["type"]): Promise<AgentRuntimeState[]> {
    return selectByType(agentType)
  },
}
