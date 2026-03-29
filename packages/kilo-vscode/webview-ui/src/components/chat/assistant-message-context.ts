import type { Part as SDKPart, ToolPart } from "@kilocode/sdk/v2"

const CONTEXT = new Set(["read", "glob", "grep", "list"])

export type AssistantGroup =
  | {
      type: "part"
      part: SDKPart
    }
  | {
      type: "context"
      parts: ToolPart[]
    }

function contextTool(part: SDKPart): part is ToolPart {
  return part.type === "tool" && CONTEXT.has(part.tool)
}

export function groupAssistantParts(parts: SDKPart[]): AssistantGroup[] {
  const result: AssistantGroup[] = []
  let group: ToolPart[] = []

  const flush = () => {
    if (!group.length) return
    result.push({ type: "context", parts: group })
    group = []
  }

  for (const part of parts) {
    if (contextTool(part)) {
      group.push(part)
      continue
    }

    flush()
    result.push({ type: "part", part })
  }

  flush()
  return result
}

export function summarizeContextParts(parts: ToolPart[]) {
  return {
    read: parts.filter((part) => part.tool === "read").length,
    search: parts.filter((part) => part.tool === "glob" || part.tool === "grep").length,
    list: parts.filter((part) => part.tool === "list").length,
  }
}
