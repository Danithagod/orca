import { z } from "zod"

export const MemoryCategory = z.enum([
  "pattern",
  "preference",
  "context",
  "decision",
  "lesson",
  "relationship",
  "error",
  "todo",
])
export type MemoryCategory = z.infer<typeof MemoryCategory>

export const MemoryPriority = z.enum(["low", "medium", "high", "critical"])
export type MemoryPriority = z.infer<typeof MemoryPriority>

export const Memory = z.object({
  id: z.string(),
  key: z.string(),
  title: z.string(),
  content: z.string(),
  summary: z.string().optional(),
  category: MemoryCategory,
  priority: MemoryPriority.default("medium"),
  tags: z.array(z.string()).default([]),
  projectPath: z.string(),
  filePath: z.string().optional(),
  sessionId: z.string().optional(),
  parentId: z.string().optional(),
  relatedIds: z.array(z.string()),
  metadata: z.record(z.string(), z.unknown()).optional(),
  embedding: z.array(z.number()).optional(),
  accessCount: z.number().default(0),
  lastAccessedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date().optional(),
})
export type Memory = z.infer<typeof Memory>

export const MemoryStoreInput = z.object({
  key: z.string(),
  title: z.string(),
  content: z.string(),
  summary: z.string().optional(),
  category: MemoryCategory,
  priority: MemoryPriority.optional(),
  tags: z.array(z.string()).optional(),
  filePath: z.string().optional(),
  sessionId: z.string().optional(),
  parentId: z.string().optional(),
  relatedIds: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  expiresAt: z.date().optional(),
})

export const MemorySearchInput = z.object({
  query: z.string(),
  categories: z.array(MemoryCategory).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).default(10),
  minScore: z.number().min(0).max(1).default(0.5),
  includeContent: z.boolean().default(true),
})

export const MemoryListFilter = z.object({
  category: MemoryCategory.optional(),
  tags: z.array(z.string()).optional(),
  keys: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(["createdAt", "updatedAt", "accessCount"]).default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})
export type MemoryListFilter = z.infer<typeof MemoryListFilter>

export const AgentType = z.enum(["architect", "builder", "tester", "reviewer", "memory-keeper", "coordinator"])
export type AgentType = z.infer<typeof AgentType>

export const AgentStatus = z.enum(["idle", "active", "paused", "error"])
export type AgentStatus = z.infer<typeof AgentStatus>

export const AgentCapability = z.enum(["explore", "read", "write", "execute", "test", "review", "plan", "memory"])
export type AgentCapability = z.infer<typeof AgentCapability>

export const Agent = z.object({
  id: z.string(),
  type: AgentType,
  name: z.string(),
  capabilities: z.array(AgentCapability),
  tools: z.array(z.string()),
  status: AgentStatus,
  currentTask: z.string().optional(),
  tasksCompleted: z.number().default(0),
  memoryScope: z.enum(["global", "project", "task"]),
  config: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date(),
})
export type Agent = z.infer<typeof Agent>

export const TaskType = z.enum(["explore", "implement", "test", "review", "generic"])
export type TaskType = z.infer<typeof TaskType>

export const TaskStatus = z.enum(["pending", "running", "completed", "failed", "paused"])
export type TaskStatus = z.infer<typeof TaskStatus>

export const TaskPriority = z.enum(["low", "medium", "high", "critical"])
export type TaskPriority = z.infer<typeof TaskPriority>

export const Task = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: TaskType,
  input: z.record(z.string(), z.unknown()),
  priority: TaskPriority,
  status: TaskStatus,
  dependencies: z.array(z.string()),
  assignedAgent: z.string().optional(),
  context: z.record(z.string(), z.unknown()),
  memoryKeys: z.array(z.string()).default([]),
  progress: z.number().default(0),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  duration: z.number().optional(),
  result: z.unknown().optional(),
  error: z.string().optional(),
  attempts: z.number().default(0),
  maxAttempts: z.number().default(3),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type Task = z.infer<typeof Task>

export const CoordinationStrategy = z.enum(["sequential", "parallel", "hierarchical", "collaborative"])
export type CoordinationStrategy = z.infer<typeof CoordinationStrategy>
