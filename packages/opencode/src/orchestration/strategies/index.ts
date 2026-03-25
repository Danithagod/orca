import type { Task } from "../tasks"
import type { TaskAnalysis } from "../tasks"
import { TaskSystem, getTask, updateTask } from "../tasks"
import { OrchestrationAgents } from "../agents"
import { AgentSelector } from "../selector"

export interface StrategyResult {
  success: boolean
  results: Map<string, unknown>
  errors: Map<string, Error>
  duration: number
}

export interface StrategyOptions {
  timeout?: number
  stopOnError?: boolean
  continueOnError?: boolean
}

const DEFAULT_TIMEOUT = 60000
const DEFAULT_OPTIONS: StrategyOptions = {
  timeout: DEFAULT_TIMEOUT,
  stopOnError: false,
  continueOnError: true,
}

async function withTimeout<T>(promise: Promise<T>, timeout: number, taskId: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Task ${taskId} timed out after ${timeout}ms`))
    }, timeout)

    promise
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

async function executeTask(task: Task, agentId: string): Promise<unknown> {
  const agent = await OrchestrationAgents.get(agentId)
  if (!agent) {
    throw new Error(`Agent ${agentId} not found`)
  }

  return {
    taskId: task.id,
    agentId,
    agentType: agent.type,
    output: `Executed task: ${task.title}`,
  }
}

function aggregateResults(results: unknown[]): unknown {
  if (results.length === 0) return null
  if (results.length === 1) return results[0]

  const stringResults = results.filter((r): r is string => typeof r === "string")
  if (stringResults.length === results.length) {
    return stringResults.join("\n---\n")
  }

  const objectResults = results.filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)

  if (objectResults.length > 0) {
    const merged: Record<string, unknown> = {}
    for (const obj of objectResults) {
      Object.assign(merged, obj)
    }
    return merged
  }

  return results
}

export async function executeSequential(tasks: Task[], options: StrategyOptions = {}): Promise<StrategyResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const startTime = Date.now()
  const results = new Map<string, unknown>()
  const errors = new Map<string, Error>()

  for (const task of tasks) {
    try {
      updateTask(task.id, { status: "running" })

      const analysis = TaskSystem.analysis(task.id)
      if (!analysis) {
        throw new Error(`No analysis found for task ${task.id}`)
      }

      const agentScore = await AgentSelector.best(analysis)
      if (!agentScore) {
        throw new Error(`No suitable agent found for task ${task.id}`)
      }

      await OrchestrationAgents.updateStatus(agentScore.agentId, "active", task.id)

      const taskStart = Date.now()
      const result = await executeTask(task, agentScore.agentId)
      const taskDuration = Date.now() - taskStart

      await OrchestrationAgents.updateMetrics(agentScore.agentId, taskDuration, true)
      results.set(task.id, result)
      updateTask(task.id, { status: "completed", progress: 100 })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      errors.set(task.id, err)
      updateTask(task.id, { status: "failed", error: err.message })

      if (opts.stopOnError) {
        break
      }
    }
  }

  return {
    success: errors.size === 0,
    results,
    errors,
    duration: Date.now() - startTime,
  }
}

export async function executeParallel(tasks: Task[], options: StrategyOptions = {}): Promise<StrategyResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const startTime = Date.now()
  const results = new Map<string, unknown>()
  const errors = new Map<string, Error>()

  const taskPromises = tasks.map(async (task) => {
    try {
      updateTask(task.id, { status: "running" })

      const analysis = TaskSystem.analysis(task.id)
      if (!analysis) {
        throw new Error(`No analysis found for task ${task.id}`)
      }

      const agentScore = await AgentSelector.best(analysis)
      if (!agentScore) {
        throw new Error(`No suitable agent found for task ${task.id}`)
      }

      await OrchestrationAgents.updateStatus(agentScore.agentId, "active", task.id)

      const result = await withTimeout(executeTask(task, agentScore.agentId), opts.timeout ?? DEFAULT_TIMEOUT, task.id)

      results.set(task.id, result)
      updateTask(task.id, { status: "completed", progress: 100 })
      return { taskId: task.id, result, error: null }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      errors.set(task.id, err)
      updateTask(task.id, { status: "failed", error: err.message })
      return { taskId: task.id, result: null, error: err }
    }
  })

  await Promise.allSettled(taskPromises)

  return {
    success: errors.size === 0,
    results,
    errors,
    duration: Date.now() - startTime,
  }
}

export async function executeHierarchical(
  rootTask: Task,
  subtasks: Task[],
  options: StrategyOptions = {},
): Promise<StrategyResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const startTime = Date.now()
  const results = new Map<string, unknown>()
  const errors = new Map<string, Error>()

  const fallbackAnalysis: TaskAnalysis = {
    taskId: rootTask.id,
    classifiedType: "generic",
    estimatedComplexity: "high",
    requiredCapabilities: ["delegate"],
    estimatedDuration: 60000,
    dependencies: [],
    recommendedAgentType: "orchestrator",
    confidence: 0.5,
  }

  try {
    updateTask(rootTask.id, { status: "running", progress: 0 })

    const rootAnalysis = TaskSystem.analysis(rootTask.id) ?? fallbackAnalysis
    const coordinatorScore = await AgentSelector.best(rootAnalysis)
    if (!coordinatorScore) {
      throw new Error("No coordinator agent available")
    }

    await OrchestrationAgents.updateStatus(coordinatorScore.agentId, "active", rootTask.id)

    for (let i = 0; i < subtasks.length; i++) {
      const subtask = subtasks[i]
      const progress = Math.round((i / subtasks.length) * 100)
      updateTask(rootTask.id, { progress })

      try {
        const subAnalysis = TaskSystem.analysis(subtask.id)
        const agentScore = await AgentSelector.best(subAnalysis ?? fallbackAnalysis)

        if (!agentScore) {
          throw new Error(`No agent available for subtask ${subtask.id}`)
        }

        const result = await withTimeout(
          executeTask(subtask, agentScore.agentId),
          opts.timeout ?? DEFAULT_TIMEOUT,
          subtask.id,
        )

        results.set(subtask.id, result)
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        errors.set(subtask.id, err)

        if (opts.stopOnError) {
          break
        }
      }
    }

    updateTask(rootTask.id, { status: errors.size === 0 ? "completed" : "failed", progress: 100 })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    errors.set(rootTask.id, err)
    updateTask(rootTask.id, { status: "failed", error: err.message })
  }

  return {
    success: errors.size === 0,
    results,
    errors,
    duration: Date.now() - startTime,
  }
}

export async function executeVote(tasks: Task[], options: StrategyOptions = {}): Promise<StrategyResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const startTime = Date.now()
  const results = new Map<string, unknown>()
  const errors = new Map<string, Error>()
  const votes = new Map<string, { result: unknown; votes: number }>()

  if (tasks.length < 2) {
    throw new Error("Vote strategy requires at least 2 tasks")
  }

  const fallbackAnalysis: TaskAnalysis = {
    taskId: tasks[0].id,
    classifiedType: "generic",
    estimatedComplexity: "medium",
    requiredCapabilities: ["read"],
    estimatedDuration: 30000,
    dependencies: [],
    confidence: 0.5,
  }

  const votePromises = tasks.map(async (task) => {
    try {
      updateTask(task.id, { status: "running" })

      const analysis = TaskSystem.analysis(task.id) ?? fallbackAnalysis
      const agentScores = await AgentSelector.multiple(analysis, 2)

      if (agentScores.length === 0) {
        throw new Error(`No agents available for task ${task.id}`)
      }

      const results_list: unknown[] = []
      for (const score of agentScores.slice(0, 2)) {
        await OrchestrationAgents.updateStatus(score.agentId, "active", task.id)
        const result = await withTimeout(executeTask(task, score.agentId), opts.timeout ?? DEFAULT_TIMEOUT, task.id)
        results_list.push(result)
      }

      const aggregated = aggregateResults(results_list)
      votes.set(task.id, { result: aggregated, votes: results_list.length })

      updateTask(task.id, { status: "completed", progress: 100 })
      return { taskId: task.id, result: aggregated, error: null }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      errors.set(task.id, err)
      updateTask(task.id, { status: "failed", error: err.message })
      return { taskId: task.id, result: null, error: err }
    }
  })

  await Promise.allSettled(votePromises)

  for (const [taskId, vote] of votes) {
    results.set(taskId, vote.result)
  }

  return {
    success: errors.size === 0,
    results,
    errors,
    duration: Date.now() - startTime,
  }
}

export async function executeRace(tasks: Task[], options: StrategyOptions = {}): Promise<StrategyResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const startTime = Date.now()
  const results = new Map<string, unknown>()
  const errors = new Map<string, Error>()

  const racePromises = tasks.map(async (task) => {
    try {
      updateTask(task.id, { status: "running" })

      const analysis = TaskSystem.analysis(task.id)
      if (!analysis) {
        throw new Error(`No analysis found for task ${task.id}`)
      }
      const agentScore = await AgentSelector.best(analysis)

      if (!agentScore) {
        throw new Error(`No agent available for task ${task.id}`)
      }

      await OrchestrationAgents.updateStatus(agentScore.agentId, "active", task.id)

      const result = await withTimeout(executeTask(task, agentScore.agentId), opts.timeout ?? DEFAULT_TIMEOUT, task.id)

      results.set(task.id, result)
      updateTask(task.id, { status: "completed", progress: 100 })
      return { taskId: task.id, result, error: null }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      errors.set(task.id, err)
      updateTask(task.id, { status: "failed", error: err.message })
      return { taskId: task.id, result: null, error: err }
    }
  })

  const settled = await Promise.allSettled(racePromises)

  const firstSuccess = settled.find((r) => r.status === "fulfilled" && r.value.error === null)

  if (firstSuccess && firstSuccess.status === "fulfilled") {
    const winner = firstSuccess.value

    for (const s of settled) {
      if (s.status === "fulfilled" && s.value.taskId !== winner.taskId) {
        const task = getTask(s.value.taskId)
        if (task && task.status === "running") {
          updateTask(task.id, { status: "cancelled" })
        }
      }
    }

    return {
      success: true,
      results: new Map([[winner.taskId, winner.result]]),
      errors,
      duration: Date.now() - startTime,
    }
  }

  return {
    success: false,
    results,
    errors,
    duration: Date.now() - startTime,
  }
}

export type CoordinationStrategy = "sequential" | "parallel" | "hierarchical" | "vote" | "race"

export const Coordination = {
  async execute(strategy: CoordinationStrategy, tasks: Task[], options?: StrategyOptions): Promise<StrategyResult> {
    switch (strategy) {
      case "sequential":
        return executeSequential(tasks, options)
      case "parallel":
        return executeParallel(tasks, options)
      case "hierarchical":
        throw new Error("Hierarchical strategy requires a root task and subtasks")
      case "vote":
        return executeVote(tasks, options)
      case "race":
        return executeRace(tasks, options)
      default:
        throw new Error(`Unknown strategy: ${strategy}`)
    }
  },

  async sequential(tasks: Task[], options?: StrategyOptions): Promise<StrategyResult> {
    return executeSequential(tasks, options)
  },

  async parallel(tasks: Task[], options?: StrategyOptions): Promise<StrategyResult> {
    return executeParallel(tasks, options)
  },

  async hierarchical(rootTask: Task, subtasks: Task[], options?: StrategyOptions): Promise<StrategyResult> {
    return executeHierarchical(rootTask, subtasks, options)
  },

  async vote(tasks: Task[], options?: StrategyOptions): Promise<StrategyResult> {
    return executeVote(tasks, options)
  },

  async race(tasks: Task[], options?: StrategyOptions): Promise<StrategyResult> {
    return executeRace(tasks, options)
  },
}
