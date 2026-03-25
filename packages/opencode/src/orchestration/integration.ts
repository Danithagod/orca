import type { Task, TaskAnalysis } from "./tasks"
import type { AgentRuntimeState } from "./types"
import { OrchestrationAgents } from "./agents"
import { TaskSystem } from "./tasks"
import { TaskAnalyzer } from "./tasks/analyzer"
import { AgentSelector } from "./selector"

export interface TaskExecutionContext {
  sessionId: string
  messageId: string
  agentName: string
  abortSignal?: AbortSignal
}

export interface TaskExecutor {
  executeTask(task: Task, agent: AgentRuntimeState, context: TaskExecutionContext): Promise<unknown>
}

export async function createTaskFromOrchestration(
  title: string,
  description: string,
  type: Task["type"],
  input: Record<string, unknown> = {},
  priority: Task["priority"] = "medium",
): Promise<Task> {
  return TaskSystem.create({
    title,
    description,
    type,
    priority,
    input,
    context: {},
    memoryKeys: [],
    dependencies: [],
    maxAttempts: 3,
  })
}

export async function analyzeAndSelectAgent(
  task: Task,
): Promise<{ task: Task; analysis: TaskAnalysis; agent: AgentRuntimeState | undefined }> {
  const analysis = TaskAnalyzer.analyze(task)
  const best = await AgentSelector.best(analysis)

  let agent: AgentRuntimeState | undefined
  if (best) {
    agent = await OrchestrationAgents.get(best.agentId)
  }

  return { task, analysis, agent }
}

export async function assignTaskToAgent(taskId: string, agentId: string): Promise<Task | undefined> {
  const task = TaskSystem.assign(taskId, agentId)
  if (task) {
    await OrchestrationAgents.updateStatus(agentId, "waiting", taskId)
  }
  return task
}

export async function executeOrchestratedTask(
  task: Task,
  agent: AgentRuntimeState,
  context: TaskExecutionContext,
): Promise<{ success: boolean; result: unknown; error?: string }> {
  const startTime = Date.now()

  try {
    await OrchestrationAgents.updateStatus(agent.id, "active", task.id)

    const result = await executeAgentTask(agent, task, context)

    const duration = Date.now() - startTime
    await OrchestrationAgents.updateMetrics(agent.id, duration, true)
    await OrchestrationAgents.updateStatus(agent.id, "idle")

    TaskSystem.complete(task.id, result, { agentId: agent.id, duration })

    return { success: true, result }
  } catch (error) {
    const duration = Date.now() - startTime
    await OrchestrationAgents.updateMetrics(agent.id, duration, false)
    await OrchestrationAgents.updateStatus(agent.id, "error")

    const errorMessage = error instanceof Error ? error.message : String(error)
    TaskSystem.fail(task.id, errorMessage)

    return { success: false, result: undefined, error: errorMessage }
  }
}

async function executeAgentTask(agent: AgentRuntimeState, task: Task, context: TaskExecutionContext): Promise<unknown> {
  const agentDefinition = OrchestrationAgents.createDefinition(agent.type)

  const prompt = agentDefinition.prompts.system + "\n\nTask: " + task.description

  return {
    taskId: task.id,
    agentId: agent.id,
    agentType: agent.type,
    title: task.title,
    description: task.description,
    input: task.input,
    sessionId: context.sessionId,
    output: `Task "${task.title}" executed by ${agent.name} agent`,
  }
}

export async function getOrchestrationStatus() {
  const agents = await OrchestrationAgents.list()
  const tasks = TaskSystem.list()
  const pending = TaskSystem.pending()
  const executable = TaskSystem.executable()

  return {
    agents: {
      total: agents.length,
      active: agents.filter((a) => a.status === "active").length,
      idle: agents.filter((a) => a.status === "idle").length,
      waiting: agents.filter((a) => a.status === "waiting").length,
      error: agents.filter((a) => a.status === "error").length,
    },
    tasks: {
      total: tasks.length,
      pending: pending.length,
      executable: executable.length,
      running: tasks.filter((t) => t.status === "running").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      failed: tasks.filter((t) => t.status === "failed").length,
    },
  }
}

export const OrchestrationIntegration = {
  createTask: createTaskFromOrchestration,
  analyzeAndSelectAgent,
  assignTaskToAgent,
  execute: executeOrchestratedTask,
  getStatus: getOrchestrationStatus,
}

export default OrchestrationIntegration
