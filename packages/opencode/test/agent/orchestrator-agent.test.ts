import { expect, test } from "bun:test"
import { Agent } from "../../src/agent/agent"
import { PermissionNext } from "../../src/permission/next"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"

function evalPerm(permission: string, agent: Agent.Info | undefined) {
  if (!agent) return undefined
  return PermissionNext.evaluate(permission, "*", agent.permission).action
}

test("orchestrator agent prefers orchestration tools over legacy task", async () => {
  await using tmp = await tmpdir()
  await Instance.provide({
    directory: tmp.path,
    fn: async () => {
      const agent = await Agent.get("orchestrator")
      expect(agent).toBeDefined()
      expect(agent?.mode).toBe("primary")
      expect(evalPerm("agent_spawn", agent)).toBe("allow")
      expect(evalPerm("agent_status", agent)).toBe("allow")
      expect(evalPerm("task_create", agent)).toBe("allow")
      expect(evalPerm("task_status", agent)).toBe("allow")
      expect(evalPerm("delegate", agent)).toBe("allow")
      expect(evalPerm("task", agent)).toBe("deny")
    },
  })
})
