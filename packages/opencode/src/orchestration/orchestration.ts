import { OrchestrationAgents } from "./agents"
import { TaskSystem } from "./tasks"
import { TaskAnalyzer } from "./tasks/analyzer"
import { AgentSelector } from "./selector"
import { Coordination } from "./strategies"
import { StateManagement } from "./state"

export const Orchestration = {
  agents: OrchestrationAgents,
  tasks: TaskSystem,
  taskAnalyzer: TaskAnalyzer,
  selector: AgentSelector,
  coordination: Coordination,
  state: StateManagement,
}

export default Orchestration
