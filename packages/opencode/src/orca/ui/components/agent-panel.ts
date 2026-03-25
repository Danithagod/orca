import { Colors } from "../theme/colors"
import { StatusIndicator } from "./status-indicator"
import { muted } from "../renderer/text"

export interface AgentInfo {
  id: string
  name: string
  status: "idle" | "active" | "error"
  tasksCompleted: number
  currentTask?: string
}

export interface AgentStatusPanelProps {
  agents: AgentInfo[]
}

function renderAgent(agent: AgentInfo): string[] {
  const statusIcon = StatusIndicator.render({
    status: agent.status === "error" ? "error" : agent.status === "active" ? "active" : "idle",
    size: "sm",
  })

  const statusText =
    agent.status === "active"
      ? Colors.apply("Active", "accent")
      : agent.status === "error"
        ? Colors.apply("Error", "error")
        : Colors.apply("Idle", "textMuted")

  const lines: string[] = []
  lines.push(`  ${statusIcon} ${Colors.apply(agent.name, "textPrimary")}    ${statusText}`)

  if (agent.currentTask && agent.status === "active") {
    lines.push(`    ${muted(agent.currentTask)}`)
  }

  if (agent.tasksCompleted > 0) {
    lines.push(`    ${muted(`${agent.tasksCompleted} tasks`)}`)
  }

  return lines
}

export function render(props: AgentStatusPanelProps): string[] {
  const { agents } = props

  const header = `  Agents  ${Colors.apply("─".repeat(30), "textMuted")}`
  const lines: string[] = [header]

  for (const agent of agents) {
    lines.push(...renderAgent(agent))
  }

  return lines
}

export namespace AgentPanel {
  export function render(props: AgentStatusPanelProps): string[] {
    return render(props)
  }

  export function renderAgent(agent: AgentInfo): string[] {
    return renderAgent(agent)
  }
}
