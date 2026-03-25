import { cmd } from "./cmd"
import { OrchestrationAgents, TaskSystem, TaskAnalyzer, StateManagement, AgentSelector } from "../../orchestration"
import type { OrchestrationAgentInfo, Task } from "../../orchestration"
import type { Argv } from "yargs"

const AgentSpawnCommand = cmd({
  command: "spawn",
  describe: "spawn a new orchestration agent",
  builder: (yargs: Argv) =>
    yargs
      .option("type", {
        type: "string",
        describe: "agent type to spawn",
        choices: ["architect", "builder", "tester", "reviewer", "memory-keeper", "orchestrator"],
        demandOption: true,
      })
      .option("name", {
        type: "string",
        describe: "custom name for the agent",
      }),
  async handler(args) {
    const type = args.type as OrchestrationAgentInfo["type"]
    const name = args.name

    const agent = await OrchestrationAgents.spawn(type, name ? { name } : undefined)

    await StateManagement.startHeartbeat(agent.id)

    console.log(`Spawned ${agent.type} agent: ${agent.id}`)
    console.log(`Name: ${agent.name}`)
    console.log(`Status: ${agent.status}`)
  },
})

const AgentListCommand = cmd({
  command: "list",
  describe: "list all orchestration agents",
  async handler() {
    const agents = await OrchestrationAgents.list()

    if (agents.length === 0) {
      console.log("No agents running")
      return
    }

    console.log(`\nOrchestration Agents (${agents.length}):\n`)
    for (const agent of agents) {
      console.log(`  ID: ${agent.id}`)
      console.log(`  Type: ${agent.type}`)
      console.log(`  Name: ${agent.name}`)
      console.log(`  Status: ${agent.status}`)
      console.log(`  Metrics:`)
      console.log(`    Tasks Completed: ${agent.metrics.tasksCompleted}`)
      console.log(`    Success Rate: ${(agent.metrics.successRate * 100).toFixed(1)}%`)
      console.log(`    Avg Duration: ${(agent.metrics.averageDuration / 1000).toFixed(1)}s`)
      console.log()
    }
  },
})

const AgentStatusCommand = cmd({
  command: "status",
  describe: "show status of a specific agent",
  builder: (yargs: Argv) =>
    yargs.option("id", {
      type: "string",
      describe: "agent ID",
      demandOption: true,
    }),
  async handler(args) {
    const agent = await OrchestrationAgents.get(args.id as string)

    if (!agent) {
      console.error(`Agent not found: ${args.id}`)
      return
    }

    const health = await StateManagement.health(agent.id)

    console.log(`\nAgent: ${agent.name} (${agent.id})\n`)
    console.log(`  Type: ${agent.type}`)
    console.log(`  Status: ${agent.status}`)
    console.log(`  Health: ${health.status}`)
    console.log(`  Last Heartbeat: ${new Date(agent.lastHeartbeat).toISOString()}`)
    console.log(`  Spawned: ${new Date(agent.spawnedAt).toISOString()}`)
    console.log()
    console.log(`  Capabilities:`)
    for (const cap of agent.capabilities) {
      console.log(`    - ${cap.name} (${cap.level})`)
    }
    console.log()
    console.log(`  Metrics:`)
    console.log(`    Tasks Completed: ${agent.metrics.tasksCompleted}`)
    console.log(`    Tasks Failed: ${agent.metrics.tasksFailed}`)
    console.log(`    Success Rate: ${(agent.metrics.successRate * 100).toFixed(1)}%`)
    console.log(`    Total Duration: ${(agent.metrics.totalDuration / 1000).toFixed(1)}s`)
    console.log(`    Avg Duration: ${(agent.metrics.averageDuration / 1000).toFixed(1)}s`)

    if (health.issues.length > 0) {
      console.log()
      console.log(`  Issues:`)
      for (const issue of health.issues) {
        console.log(`    - ${issue}`)
      }
    }
  },
})

const TaskCreateCommand = cmd({
  command: "create",
  describe: "create a new orchestration task",
  builder: (yargs: Argv) =>
    yargs
      .option("title", {
        type: "string",
        describe: "task title",
        demandOption: true,
      })
      .option("description", {
        type: "string",
        describe: "task description",
        demandOption: true,
      })
      .option("type", {
        type: "string",
        describe: "task type",
        choices: ["explore", "implement", "test", "review", "generic"],
        default: "generic",
      })
      .option("priority", {
        type: "string",
        describe: "task priority",
        choices: ["low", "medium", "high", "critical"],
        default: "medium",
      })
      .option("deps", {
        type: "string",
        describe: "comma-separated dependency task IDs",
      }),
  async handler(args) {
    const task = TaskSystem.create({
      title: args.title as string,
      description: args.description as string,
      type: (args.type as "explore" | "implement" | "test" | "review" | "generic") ?? "generic",
      priority: (args.priority as "low" | "medium" | "high" | "critical") ?? "medium",
      dependencies: args.deps ? (args.deps as string).split(",") : [],
      input: {},
      context: {},
      memoryKeys: [],
      maxAttempts: 3,
    })

    const analysis = TaskAnalyzer.analyze(task)

    console.log(`\nCreated task: ${task.id}`)
    console.log(`Title: ${task.title}`)
    console.log(`Type: ${analysis.classifiedType} (confidence: ${(analysis.confidence * 100).toFixed(0)}%)`)
    console.log(`Complexity: ${analysis.estimatedComplexity}`)
    console.log(`Estimated Duration: ${(analysis.estimatedDuration / 1000).toFixed(1)}s`)
    console.log(`Recommended Agent: ${analysis.recommendedAgentType ?? "any"}`)
  },
})

const TaskStatusCommand = cmd({
  command: "status",
  describe: "show status of tasks",
  builder: (yargs: Argv) =>
    yargs.option("id", {
      type: "string",
      describe: "specific task ID",
    }),
  async handler(args) {
    if (args.id) {
      const task = TaskSystem.get(args.id as string)
      if (!task) {
        console.error(`Task not found: ${args.id}`)
        return
      }

      console.log(`\nTask: ${task.title} (${task.id})\n`)
      console.log(`  Type: ${task.type}`)
      console.log(`  Status: ${task.status}`)
      console.log(`  Priority: ${task.priority}`)
      console.log(`  Progress: ${task.progress}%`)
      if (task.assignedAgentId) {
        console.log(`  Assigned Agent: ${task.assignedAgentId}`)
      }
      if (task.error) {
        console.log(`  Error: ${task.error}`)
      }
      console.log(`  Attempts: ${task.attempts}/${task.maxAttempts}`)
      if (task.startTime) {
        console.log(`  Started: ${new Date(task.startTime).toISOString()}`)
      }
      if (task.endTime) {
        console.log(`  Ended: ${new Date(task.endTime).toISOString()}`)
      }
      if (task.duration) {
        console.log(`  Duration: ${(task.duration / 1000).toFixed(1)}s`)
      }
      return
    }

    const tasks = TaskSystem.list()
    const byStatus = {
      pending: tasks.filter((t) => t.status === "pending"),
      queued: tasks.filter((t) => t.status === "queued"),
      running: tasks.filter((t) => t.status === "running"),
      completed: tasks.filter((t) => t.status === "completed"),
      failed: tasks.filter((t) => t.status === "failed"),
    }

    console.log(`\nTasks (${tasks.length}):\n`)
    console.log(`  Pending: ${byStatus.pending.length}`)
    console.log(`  Queued: ${byStatus.queued.length}`)
    console.log(`  Running: ${byStatus.running.length}`)
    console.log(`  Completed: ${byStatus.completed.length}`)
    console.log(`  Failed: ${byStatus.failed.length}`)
  },
})

const DelegateCommand = cmd({
  command: "delegate",
  describe: "delegate a task to an agent",
  builder: (yargs: Argv) =>
    yargs
      .option("task-id", {
        type: "string",
        describe: "task ID to delegate",
        demandOption: true,
      })
      .option("agent-id", {
        type: "string",
        describe: "agent ID to delegate to",
      })
      .option("type", {
        type: "string",
        describe: "agent type to use (if not specifying agent-id)",
        choices: ["architect", "builder", "tester", "reviewer", "memory-keeper"],
      }),
  async handler(args) {
    const taskId = args.taskId as string
    const task = TaskSystem.get(taskId)

    if (!task) {
      console.error(`Task not found: ${taskId}`)
      return
    }

    let agentId = args.agentId as string | undefined

    if (!agentId && args.type) {
      const analysis = TaskSystem.analysis(taskId)
      if (!analysis) {
        console.error("No task analysis found. Please analyze the task first.")
        return
      }

      const score = await AgentSelector.best(analysis)
      if (score) {
        agentId = score.agentId
        console.log(`Selected agent: ${agentId} (${score.reason})`)
      }
    }

    if (!agentId) {
      console.error("No agent ID or type specified")
      return
    }

    const assigned = TaskSystem.assign(taskId, agentId)
    if (assigned) {
      console.log(`Delegated task ${taskId} to agent ${agentId}`)
    }
  },
})

const StateCommand = cmd({
  command: "state",
  describe: "show orchestration state",
  async handler() {
    const state = await StateManagement.current()

    console.log(`\nOrchestration State\n`)
    console.log(`  Agents:`)
    console.log(`    Total: ${state.agents.total}`)
    console.log(`    Active: ${state.agents.active}`)
    console.log(`    Idle: ${state.agents.idle}`)
    console.log(`    Error: ${state.agents.error}`)
    console.log(`    Unhealthy: ${state.agents.unhealthy}`)
    console.log()
    console.log(`  Tasks:`)
    console.log(`    Total: ${state.tasks.total}`)
    console.log(`    Pending: ${state.tasks.pending}`)
    console.log(`    Running: ${state.tasks.running}`)
    console.log(`    Completed: ${state.tasks.completed}`)
    console.log(`    Failed: ${state.tasks.failed}`)
    console.log()
    console.log(`  Uptime: ${(state.uptime / 1000 / 60).toFixed(1)} minutes`)
    console.log(`  Last Check: ${new Date(state.lastCheck).toISOString()}`)
  },
})

export const OrchestrationCommand = cmd({
  command: "orchestration",
  describe: "manage orchestration agents and tasks",
  builder: (yargs) =>
    yargs
      .command(AgentSpawnCommand)
      .command(AgentListCommand)
      .command(AgentStatusCommand)
      .command(TaskCreateCommand)
      .command(TaskStatusCommand)
      .command(DelegateCommand)
      .command(StateCommand)
      .demandCommand(),
  async handler() {},
})
