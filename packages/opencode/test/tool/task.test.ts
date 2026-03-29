import { describe, expect, test } from "bun:test"
import { resolveSubagentType } from "../../src/tool/task"

describe("tool.task subagent aliases", () => {
  test("maps orchestration roles to legacy subagent types", () => {
    expect(resolveSubagentType("architect")).toBe("explore")
    expect(resolveSubagentType("builder")).toBe("code")
    expect(resolveSubagentType("tester")).toBe("code")
    expect(resolveSubagentType("reviewer")).toBe("code")
    expect(resolveSubagentType("memory-keeper")).toBe("code")
    expect(resolveSubagentType("coordinator")).toBe("general")
  })

  test("leaves legacy subagent types unchanged", () => {
    expect(resolveSubagentType("explore")).toBe("explore")
    expect(resolveSubagentType("general")).toBe("general")
    expect(resolveSubagentType("code")).toBe("code")
    expect(resolveSubagentType("custom-agent")).toBe("custom-agent")
  })
})
