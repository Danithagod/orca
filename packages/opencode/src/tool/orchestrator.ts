import z from "zod"
import { Tool } from "./tool"
import { Orchestrator } from "../orca/orchestrator"
import { Instance } from "../project/instance"
import { AgentType, AgentStatus, TaskType, TaskStatus, TaskPriority } from "../orca/types"
import { Session } from "../session"
import { MessageV2 } from "../session/message-v2"
import { Identifier } from "../id/id"
import { Agent } from "../agent/agent"
import { SessionPrompt } from "../session/prompt"
import { PermissionNext } from "@/permission/next"
import { Config } from "../config/config"
import { iife } from "@/util/iife"
import { defer } from "@/util/defer"

const AGENT_SPAWN_DESCRIPTION = `Spawn a specialized agent to handle a task.

Agent Types:
- architect: Explores codebase, plans architecture, reads files
- builder: Implements features, writes code, edits files
- tester: Runs tests, validates changes
- reviewer: Reviews code, finds issues
- memory-keeper: Manages persistent memory
- coordinator: Coordinates multi-agent tasks`

const AGENT_STATUS_DESCRIPTION = `Check status of spawned agents.`

const TASK_CREATE_DESCRIPTION = `Create a new task for the orchestrator.

Task Types:
- explore: Explore and understand code
- implement: Implement new features
- test: Run tests and validation
- review: Review existing code
- generic: General purpose task`

const TASK_STATUS_DESCRIPTION = `Check status of a task.`

const DELEGATE_DESCRIPTION = `Delegate a task to an available agent.`

async function ensureOrchestratorInit() {
  const projectPath = Instance.directory
  await Orchestrator.init({ projectPath })
}

interface AgentSpawnMetadata {
  agentId: string
  type: AgentType
  status: AgentStatus | "completed"
  taskId?: string
}

interface TaskMetadata {
  taskId: string
  status: TaskStatus
  progress: number
  found?: boolean
}

interface DelegateMetadata {
  found: boolean
  taskId: string
  agentId: string
  status: TaskStatus | "completed" | ""
}

interface AgentStatusMetadata {
  found: boolean
  agentId: string
  type: AgentType | ""
  status: AgentStatus | ""
  count: number
}

export const AgentSpawnTool = Tool.define("agent_spawn", {
  description: AGENT_SPAWN_DESCRIPTION,
  parameters: z.object({
    type: AgentType.describe("Type of agent to spawn"),
    assignTask: z.string().optional().describe("Task description to immediately assign"),
  }),
  async execute(params, ctx) {
    await ensureOrchestratorInit()

    await ctx.ask({
      permission: "agent_spawn",
      patterns: ["*"],
      always: ["*"],
      metadata: { type: params.type },
    })

    const agent = await Orchestrator.registerAgent({ type: params.type })
    const agentDef = await Agent.get("general")
    const subagentType = await Orchestrator.getSubagentType({ agentType: params.type })

    if (!params.assignTask) {
      return {
        title: `Spawned ${params.type} agent`,
        output: `Agent ID: ${agent.id}\nType: ${agent.type}\nStatus: ${agent.status}\nCapabilities: ${agent.capabilities.join(", ")}`,
        metadata: {
          agentId: agent.id,
          type: agent.type,
          status: agent.status,
          taskId: undefined as string | undefined,
        },
      }
    }

    const task = await Orchestrator.createTask({
      title: params.assignTask,
      description: params.assignTask,
      type: "generic",
      input: {},
    })

    if (!agentDef) throw new Error(`Agent 'general' not found for subagent execution`)

    const config = await Config.get()
    const hasTaskPermission = agentDef.permission.some((rule) => rule.permission === "task")

    const session = await iife(async () => {
      const found = await Session.get(ctx.sessionID).catch(() => {})
      if (found) return found

      return await Session.create({
        parentID: ctx.sessionID,
        title: params.assignTask + ` (@${subagentType} subagent)`,
        permission: [
          {
            permission: "todowrite",
            pattern: "*",
            action: "deny",
          },
          {
            permission: "todoread",
            pattern: "*",
            action: "deny",
          },
          ...(hasTaskPermission
            ? []
            : [
                {
                  permission: "task" as const,
                  pattern: "*" as const,
                  action: "deny" as const,
                },
              ]),
          ...(config.experimental?.primary_tools?.map((t) => ({
            pattern: "*",
            action: "allow" as const,
            permission: t,
          })) ?? []),
        ],
      })
    })

    const parentMsg = await MessageV2.get({ sessionID: ctx.sessionID, messageID: ctx.messageID })
    if (parentMsg.info.role !== "assistant") throw new Error("Not an assistant message")

    const model = agentDef.model ?? {
      modelID: parentMsg.info.modelID,
      providerID: parentMsg.info.providerID,
    }

    await Orchestrator.startTask({ taskId: task.id, agentId: agent.id })

    ctx.metadata({
      title: params.assignTask,
      metadata: {
        sessionId: session.id,
        subagentType,
        model,
        taskId: task.id,
      },
    })

    const messageID = Identifier.ascending("message")

    const cancel = () => {
      Orchestrator.cancelTask({ taskId: task.id }).catch(() => {})
      SessionPrompt.cancel(session.id)
    }
    ctx.abort.addEventListener("abort", cancel)
    using _ = defer(() => ctx.abort.removeEventListener("abort", cancel))

    const result = await SessionPrompt.prompt({
      messageID,
      sessionID: session.id,
      model,
      agent: subagentType,
      tools: {
        todowrite: false,
        todoread: false,
        ...(hasTaskPermission ? {} : { task: false }),
        ...Object.fromEntries((config.experimental?.primary_tools ?? []).map((t) => [t, false])),
      },
      parts: [
        {
          type: "text",
          text: params.assignTask!,
        },
      ],
    })

    const text = result.parts.findLast((x) => x.type === "text")?.text ?? ""

    await Orchestrator.completeTask({
      taskId: task.id,
      result: { text, parts: result.parts.map((p) => p.type) },
    })

    agent.status = "idle"
    agent.currentTask = undefined
    agent.tasksCompleted++

    const output = [
      `Agent: ${agent.type} (${agent.id})`,
      `Task: ${params.assignTask}`,
      `Status: completed`,
      "",
      "<result>",
      text,
      "</result>",
    ].join("\n")

    return {
      title: `Completed: ${params.assignTask}`,
      output,
      metadata: { agentId: agent.id, type: agent.type, taskId: task.id, status: agent.status },
    }
  },
})

export const AgentStatusTool = Tool.define("agent_status", {
  description: AGENT_STATUS_DESCRIPTION,
  parameters: z.object({
    agentId: z.string().optional().describe("Specific agent ID, or omit for all agents"),
  }),
  async execute(params, ctx) {
    await ensureOrchestratorInit()

    await ctx.ask({
      permission: "agent_status",
      patterns: ["*"],
      always: ["*"],
      metadata: { agentId: params.agentId ?? "" },
    })

    if (params.agentId) {
      const agent = await Orchestrator.getAgent({ agentId: params.agentId })
      if (!agent) {
        return {
          title: "Agent not found",
          output: `No agent found with ID: ${params.agentId}`,
          metadata: { found: false, agentId: params.agentId, type: "", status: "", count: 0 },
        }
      }
      return {
        title: `Agent: ${agent.type}`,
        output: `ID: ${agent.id}\nType: ${agent.type}\nStatus: ${agent.status}\nCapabilities: ${agent.capabilities.join(", ")}\nTasks Completed: ${agent.tasksCompleted}\nCurrent Task: ${agent.currentTask ?? "none"}`,
        metadata: { found: true, agentId: agent.id, type: agent.type, status: agent.status, count: 1 },
      }
    }

    const agents = await Orchestrator.getAgents({})
    if (agents.length === 0) {
      return {
        title: "No agents",
        output: "No agents have been spawned yet.",
        metadata: { found: true, agentId: "", type: "", status: "", count: 0 },
      }
    }

    const output = agents.map((a) => `${a.id.slice(0, 8)} | ${a.type.padEnd(15)} | ${a.status}`).join("\n")
    return {
      title: `${agents.length} agents`,
      output,
      metadata: { found: true, agentId: "", type: "", status: "", count: agents.length },
    }
  },
})

export const TaskCreateTool = Tool.define("task_create", {
  description: TASK_CREATE_DESCRIPTION,
  parameters: z.object({
    title: z.string().describe("Task title"),
    description: z.string().describe("Task description"),
    type: TaskType.describe("Task type"),
    priority: TaskPriority.optional().default("medium").describe("Task priority"),
    input: z.record(z.string(), z.unknown()).optional().default({}).describe("Task input data"),
  }),
  async execute(params, ctx) {
    await ensureOrchestratorInit()

    await ctx.ask({
      permission: "task_create",
      patterns: ["*"],
      always: ["*"],
      metadata: { title: params.title, type: params.type },
    })

    const task = await Orchestrator.createTask({
      title: params.title,
      description: params.description,
      type: params.type,
      input: params.input ?? {},
      priority: params.priority,
    })

    return {
      title: `Created task: ${params.title}`,
      output: `Task ID: ${task.id}\nType: ${task.type}\nPriority: ${task.priority}\nStatus: ${task.status}`,
      metadata: { taskId: task.id, status: task.status, progress: task.progress },
    }
  },
})

export const TaskStatusTool = Tool.define("task_status", {
  description: TASK_STATUS_DESCRIPTION,
  parameters: z.object({
    taskId: z.string().describe("Task ID to check"),
    includeOutput: z.boolean().optional().default(false).describe("Include task output"),
  }),
  async execute(params, ctx) {
    await ensureOrchestratorInit()

    await ctx.ask({
      permission: "task_status",
      patterns: ["*"],
      always: ["*"],
      metadata: { taskId: params.taskId },
    })

    const task = await Orchestrator.getTask({ taskId: params.taskId })
    if (!task) {
      return {
        title: "Task not found",
        output: `No task found with ID: ${params.taskId}`,
        metadata: { found: false, taskId: params.taskId, status: "", progress: 0 },
      }
    }

    let output = `Task: ${task.title}\nID: ${task.id}\nStatus: ${task.status}\nProgress: ${task.progress}%\nPriority: ${task.priority}`
    if (task.assignedAgent) output += `\nAgent: ${task.assignedAgent}`
    if (task.error) output += `\nError: ${task.error}`
    if (params.includeOutput && task.result) output += `\nResult: ${JSON.stringify(task.result, null, 2)}`

    return {
      title: `Task: ${task.title}`,
      output,
      metadata: { found: true, taskId: task.id, status: task.status, progress: task.progress },
    }
  },
})

export const DelegateTool = Tool.define("delegate", {
  description: DELEGATE_DESCRIPTION,
  parameters: z.object({
    taskId: z.string().describe("Task ID to delegate"),
    agentId: z.string().optional().describe("Specific agent ID, or omit for auto-routing"),
    prompt: z.string().optional().describe("Prompt to execute for this task"),
  }),
  async execute(params, ctx) {
    await ensureOrchestratorInit()

    await ctx.ask({
      permission: "delegate",
      patterns: ["*"],
      always: ["*"],
      metadata: { taskId: params.taskId, agentId: params.agentId ?? "" },
    })

    const task = await Orchestrator.getTask({ taskId: params.taskId })
    if (!task) {
      return {
        title: "Task not found",
        output: `No task found with ID: ${params.taskId}`,
        metadata: { found: false, taskId: params.taskId, agentId: params.agentId ?? "", status: "" },
      }
    }

    const agentId = params.agentId ?? (await Orchestrator.routeTask({ taskId: params.taskId })).agentId
    const agent = await Orchestrator.getAgent({ agentId })
    if (!agent) {
      return {
        title: "Agent not found",
        output: `No agent found with ID: ${agentId}`,
        metadata: { found: false, taskId: params.taskId, agentId, status: "" },
      }
    }

    const prompt = params.prompt ?? task.description
    const subagentType = await Orchestrator.getSubagentType({ agentType: agent.type })

    const agentDef = await Agent.get(subagentType)
    if (!agentDef) throw new Error(`Agent '${subagentType}' not found for subagent execution`)

    const config = await Config.get()
    const hasTaskPermission = agentDef.permission.some((rule) => rule.permission === "task")

    const session = await iife(async () => {
      const found = await Session.get(ctx.sessionID).catch(() => {})
      if (found) return found

      return await Session.create({
        parentID: ctx.sessionID,
        title: task.title + ` (@${subagentType} subagent)`,
        permission: [
          {
            permission: "todowrite",
            pattern: "*",
            action: "deny",
          },
          {
            permission: "todoread",
            pattern: "*",
            action: "deny",
          },
          ...(hasTaskPermission
            ? []
            : [
                {
                  permission: "task" as const,
                  pattern: "*" as const,
                  action: "deny" as const,
                },
              ]),
          ...(config.experimental?.primary_tools?.map((t) => ({
            pattern: "*",
            action: "allow" as const,
            permission: t,
          })) ?? []),
        ],
      })
    })

    const parentMsg = await MessageV2.get({ sessionID: ctx.sessionID, messageID: ctx.messageID })
    if (parentMsg.info.role !== "assistant") throw new Error("Not an assistant message")

    const model = agentDef.model ?? {
      modelID: parentMsg.info.modelID,
      providerID: parentMsg.info.providerID,
    }

    await Orchestrator.startTask({ taskId: params.taskId, agentId: agent.id })

    ctx.metadata({
      title: task.title,
      metadata: {
        sessionId: session.id,
        subagentType,
        model,
        taskId: params.taskId,
        agentId: agent.id,
      },
    })

    const messageID = Identifier.ascending("message")

    const cancel = () => {
      Orchestrator.cancelTask({ taskId: params.taskId }).catch(() => {})
      SessionPrompt.cancel(session.id)
    }
    ctx.abort.addEventListener("abort", cancel)
    using _ = defer(() => ctx.abort.removeEventListener("abort", cancel))

    const result = await SessionPrompt.prompt({
      messageID,
      sessionID: session.id,
      model,
      agent: subagentType,
      tools: {
        todowrite: false,
        todoread: false,
        ...(hasTaskPermission ? {} : { task: false }),
        ...Object.fromEntries((config.experimental?.primary_tools ?? []).map((t) => [t, false])),
      },
      parts: [
        {
          type: "text",
          text: prompt,
        },
      ],
    })

    const text = result.parts.findLast((x) => x.type === "text")?.text ?? ""

    await Orchestrator.completeTask({
      taskId: params.taskId,
      result: { text, parts: result.parts.map((p) => p.type) },
    })

    const output = [
      `Task: ${task.title}`,
      `Agent: ${agent.type} (${agent.id})`,
      `Status: completed`,
      "",
      "<result>",
      text,
      "</result>",
    ].join("\n")

    return {
      title: `Delegated: ${task.title}`,
      output,
      metadata: {
        found: true,
        taskId: params.taskId,
        agentId: agent.id,
        status: "completed",
      },
    }
  },
})
