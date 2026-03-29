import { describe, expect, test } from "bun:test"
import type { Part as SDKPart, ToolPart } from "@kilocode/sdk/v2"
import {
  groupAssistantParts,
  summarizeContextParts,
} from "../../webview-ui/src/components/chat/assistant-message-context"

function text(id: string): SDKPart {
  return {
    id,
    type: "text",
    text: "note",
  } as unknown as SDKPart
}

function tool(id: string, name: ToolPart["tool"]): ToolPart {
  return {
    id,
    type: "tool",
    tool: name,
    state: {
      status: "completed",
      input: {
        filePath: `${id}.ts`,
        path: `src/${id}`,
      },
    },
  } as unknown as ToolPart
}

describe("groupAssistantParts", () => {
  test("groups consecutive context tools into one compact block", () => {
    const result = groupAssistantParts([tool("a", "read"), tool("b", "glob"), tool("c", "list")])

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      type: "context",
      parts: [
        { id: "a", tool: "read" },
        { id: "b", tool: "glob" },
        { id: "c", tool: "list" },
      ],
    })
  })

  test("splits context groups when a non-context part appears", () => {
    const result = groupAssistantParts([tool("a", "read"), text("b"), tool("c", "grep")])

    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ type: "context", parts: [{ id: "a", tool: "read" }] })
    expect(result[1]).toMatchObject({ type: "part", part: { id: "b", type: "text" } })
    expect(result[2]).toMatchObject({ type: "context", parts: [{ id: "c", tool: "grep" }] })
  })
})

describe("summarizeContextParts", () => {
  test("counts reads, searches, and lists separately", () => {
    const result = summarizeContextParts([
      tool("a", "read"),
      tool("b", "glob"),
      tool("c", "grep"),
      tool("d", "list"),
      tool("e", "read"),
    ])

    expect(result).toEqual({
      read: 2,
      search: 2,
      list: 1,
    })
  })
})
