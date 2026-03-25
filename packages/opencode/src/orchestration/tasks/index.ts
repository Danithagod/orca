import z from "zod"

export type TaskType = "explore" | "implement" | "test" | "review" | "generic"
export type TaskStatus = "pending" | "queued" | "running" | "completed" | "failed" | "cancelled"
export type TaskPriority = "low" | "medium" | "high" | "critical"

export interface Task {
  id: string
  title: string
  description: string
  type: TaskType

  status: TaskStatus
  priority: TaskPriority

  assignedAgentId?: string
  dependencies: string[]

  input: Record<string, unknown>
  output?: Record<string, unknown>
  result?: unknown

  context: Record<string, unknown>
  memoryKeys: string[]

  progress: number
  error?: string

  attempts: number
  maxAttempts: number
  startTime?: number
  endTime?: number
  duration?: number

  createdAt: number
  updatedAt: number
}

export interface TaskAnalysis {
  taskId: string
  classifiedType: TaskType
  estimatedComplexity: "low" | "medium" | "high" | "very_high"
  requiredCapabilities: string[]
  estimatedDuration: number
  dependencies: string[]
  recommendedAgentType?: string
  confidence: number
}

export const TaskSchemas = {
  Create: z.object({
    title: z.string().min(1),
    description: z.string(),
    type: z.enum(["explore", "implement", "test", "review", "generic"]).default("generic"),
    priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    dependencies: z.array(z.string()).default([]),
    input: z.record(z.string(), z.unknown()).default({}),
    context: z.record(z.string(), z.unknown()).default({}),
    memoryKeys: z.array(z.string()).default([]),
    maxAttempts: z.number().int().positive().default(3),
  }),

  Update: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(["pending", "queued", "running", "completed", "failed", "cancelled"]).optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    progress: z.number().min(0).max(100).optional(),
    error: z.string().optional(),
  }),
}

const TASK_QUEUE = new Map<string, Task>()
const TASK_ANALYSES = new Map<string, TaskAnalysis>()

const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

function generateId(): string {
  return `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function createTask(input: z.input<typeof TaskSchemas.Create>): Task {
  const id = generateId()
  const now = Date.now()

  const parsed = TaskSchemas.Create.parse(input)

  const task: Task = {
    id,
    title: parsed.title,
    description: parsed.description,
    type: parsed.type,
    status: "pending",
    priority: parsed.priority,
    assignedAgentId: undefined,
    dependencies: parsed.dependencies,
    input: parsed.input,
    output: undefined,
    result: undefined,
    context: parsed.context,
    memoryKeys: parsed.memoryKeys,
    progress: 0,
    error: undefined,
    attempts: 0,
    maxAttempts: parsed.maxAttempts,
    startTime: undefined,
    endTime: undefined,
    duration: undefined,
    createdAt: now,
    updatedAt: now,
  }

  TASK_QUEUE.set(id, task)
  return task
}

export function getTask(id: string): Task | undefined {
  return TASK_QUEUE.get(id)
}

export function listTasks(): Task[] {
  return Array.from(TASK_QUEUE.values())
}

export function listTasksByStatus(status: TaskStatus): Task[] {
  return Array.from(TASK_QUEUE.values()).filter((t) => t.status === status)
}

export function updateTask(id: string, updates: z.infer<typeof TaskSchemas.Update>): Task | undefined {
  const task = TASK_QUEUE.get(id)
  if (!task) return undefined

  if (updates.title !== undefined) task.title = updates.title
  if (updates.description !== undefined) task.description = updates.description
  if (updates.status !== undefined) {
    task.status = updates.status
    if (updates.status === "running" && !task.startTime) {
      task.startTime = Date.now()
    }
    if (updates.status === "completed" || updates.status === "failed" || updates.status === "cancelled") {
      task.endTime = Date.now()
      if (task.startTime) {
        task.duration = task.endTime - task.startTime
      }
    }
  }
  if (updates.priority !== undefined) task.priority = updates.priority
  if (updates.progress !== undefined) task.progress = updates.progress
  if (updates.error !== undefined) task.error = updates.error
  task.updatedAt = Date.now()

  return task
}

export function assignTask(taskId: string, agentId: string): Task | undefined {
  const task = TASK_QUEUE.get(taskId)
  if (!task) return undefined

  task.assignedAgentId = agentId
  task.status = "queued"
  task.updatedAt = Date.now()
  return task
}

export function completeTask(taskId: string, result: unknown, output?: Record<string, unknown>): Task | undefined {
  const task = TASK_QUEUE.get(taskId)
  if (!task) return undefined

  task.result = result
  task.output = output
  task.status = "completed"
  task.progress = 100
  task.endTime = Date.now()
  if (task.startTime) {
    task.duration = task.endTime - task.startTime
  }
  task.updatedAt = Date.now()
  return task
}

export function failTask(taskId: string, error: string): Task | undefined {
  const task = TASK_QUEUE.get(taskId)
  if (!task) return undefined

  task.error = error
  task.attempts++
  if (task.attempts >= task.maxAttempts) {
    task.status = "failed"
    task.endTime = Date.now()
    if (task.startTime) {
      task.duration = task.endTime - task.startTime
    }
  } else {
    task.status = "pending"
    task.progress = 0
  }
  task.updatedAt = Date.now()
  return task
}

export function cancelTask(taskId: string): Task | undefined {
  const task = TASK_QUEUE.get(taskId)
  if (!task) return undefined

  task.status = "cancelled"
  task.endTime = Date.now()
  if (task.startTime) {
    task.duration = task.endTime - task.startTime
  }
  task.updatedAt = Date.now()
  return task
}

export function deleteTask(taskId: string): boolean {
  return TASK_QUEUE.delete(taskId)
}

export function clearAllTasks(): void {
  TASK_QUEUE.clear()
  TASK_ANALYSES.clear()
}

export function getPendingTasks(): Task[] {
  return Array.from(TASK_QUEUE.values())
    .filter((t) => t.status === "pending" || t.status === "queued")
    .sort((a, b) => {
      const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.createdAt - b.createdAt
    })
}

export function getExecutableTasks(): Task[] {
  return getPendingTasks().filter((task) => {
    if (task.dependencies.length === 0) return true
    return task.dependencies.every((depId) => {
      const dep = TASK_QUEUE.get(depId)
      return dep?.status === "completed"
    })
  })
}

export function getTaskAnalysis(taskId: string): TaskAnalysis | undefined {
  return TASK_ANALYSES.get(taskId)
}

export function setTaskAnalysis(analysis: TaskAnalysis): void {
  TASK_ANALYSES.set(analysis.taskId, analysis)
}

export function getDependencyGraph(): Map<string, string[]> {
  const graph = new Map<string, string[]>()
  for (const task of TASK_QUEUE.values()) {
    graph.set(task.id, [...(task.dependencies ?? [])])
  }
  return graph
}

export function hasCyclicDependencies(taskId: string, newDependencies: string[]): boolean {
  const visited = new Set<string>()
  const stack = [...newDependencies]

  while (stack.length > 0) {
    const current = stack.pop()!
    if (current === taskId) return true
    if (visited.has(current)) continue
    visited.add(current)

    const task = TASK_QUEUE.get(current)
    if (task && task.dependencies) {
      stack.push(...task.dependencies)
    }
  }

  return false
}

export const TaskSystem = {
  create(input: z.input<typeof TaskSchemas.Create>): Task {
    return createTask(input)
  },

  get(id: string): Task | undefined {
    return getTask(id)
  },

  list(): Task[] {
    return listTasks()
  },

  listByStatus(status: TaskStatus): Task[] {
    return listTasksByStatus(status)
  },

  update(id: string, updates: z.infer<typeof TaskSchemas.Update>): Task | undefined {
    return updateTask(id, updates)
  },

  assign(taskId: string, agentId: string): Task | undefined {
    return assignTask(taskId, agentId)
  },

  complete(taskId: string, result: unknown, output?: Record<string, unknown>): Task | undefined {
    return completeTask(taskId, result, output)
  },

  fail(taskId: string, error: string): Task | undefined {
    return failTask(taskId, error)
  },

  cancel(taskId: string): Task | undefined {
    return cancelTask(taskId)
  },

  remove(taskId: string): boolean {
    return deleteTask(taskId)
  },

  clear(): void {
    return clearAllTasks()
  },

  pending(): Task[] {
    return getPendingTasks()
  },

  executable(): Task[] {
    return getExecutableTasks()
  },

  analysis(taskId: string): TaskAnalysis | undefined {
    return getTaskAnalysis(taskId)
  },

  setAnalysis(analysis: TaskAnalysis): void {
    return setTaskAnalysis(analysis)
  },

  dependencyGraph(): Map<string, string[]> {
    return getDependencyGraph()
  },

  hasCycles(taskId: string, newDependencies: string[]): boolean {
    return hasCyclicDependencies(taskId, newDependencies)
  },
}
