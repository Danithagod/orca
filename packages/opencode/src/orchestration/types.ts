import z from "zod"

export type AgentType = "architect" | "builder" | "tester" | "reviewer" | "memory-keeper" | "orchestrator" | "custom"

export type AgentCapability =
  | "explore"
  | "read"
  | "write"
  | "edit"
  | "execute"
  | "test"
  | "review"
  | "plan"
  | "memory"
  | "delegate"

export type AgentStatus = "idle" | "active" | "waiting" | "error" | "completed"

export type MemoryScope = "global" | "project" | "task"

export interface BeforeHook {
  type: "before"
  callback: (taskId: string) => Promise<void>
}

export interface AfterHook {
  type: "after"
  callback: (taskId: string, result: unknown) => Promise<void>
}

export interface ErrorHook {
  type: "error"
  callback: (taskId: string, error: Error) => Promise<void>
}

export type AgentHook = BeforeHook | AfterHook | ErrorHook

export interface AgentCapability_ {
  name: AgentCapability
  level: "primary" | "secondary"
  description?: string
}

export interface AgentDefinition {
  type: AgentType
  name: string
  description?: string
  capabilities: AgentCapability_[]
  tools: string[]
  memoryScope: MemoryScope
  prompts: {
    system: string
    [key: string]: string
  }
  hooks: {
    beforeTask?: BeforeHook
    afterTask?: AfterHook
    onError?: ErrorHook
  }
  maxConcurrent: number
  timeout: number
}

export interface AgentMetrics {
  tasksCompleted: number
  tasksFailed: number
  totalDuration: number
  averageDuration: number
  successRate: number
  lastTaskAt?: number
}

export interface AgentRuntimeState {
  id: string
  type: AgentType
  name: string
  status: AgentStatus
  currentTaskId?: string
  lastHeartbeat: number
  spawnedAt: number
  metrics: AgentMetrics
  capabilities: AgentCapability_[]
}

export interface AgentScore {
  agentId: string
  agentType: AgentType
  totalScore: number
  capabilityScores: Record<AgentCapability, number>
  loadScore: number
  reason: string
}

export const OrchestrationAgent = {
  Info: z.object({
    type: z.enum(["architect", "builder", "tester", "reviewer", "memory-keeper", "orchestrator", "custom"]),
    name: z.string(),
    description: z.string().optional(),
    capabilities: z
      .array(
        z.object({
          name: z.enum(["explore", "read", "write", "edit", "execute", "test", "review", "plan", "memory", "delegate"]),
          level: z.enum(["primary", "secondary"]).default("primary"),
          description: z.string().optional(),
        }),
      )
      .default([]),
    tools: z.array(z.string()).default([]),
    memoryScope: z.enum(["global", "project", "task"]).default("task"),
    maxConcurrent: z.number().int().positive().default(1),
    timeout: z.number().int().positive().default(60000),
  }),
}

export type OrchestrationAgentInfo = z.infer<typeof OrchestrationAgent.Info>
