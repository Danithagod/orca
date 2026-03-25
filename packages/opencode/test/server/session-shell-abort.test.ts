import { describe, expect, test } from "bun:test"
import { setTimeout as sleep } from "node:timers/promises"
import path from "path"
import { Agent } from "../../src/agent/agent"
import { Instance } from "../../src/project/instance"
import { Pty } from "../../src/pty"
import { Shell } from "../../src/shell/shell"
import { Server } from "../../src/server/server"
import { Session } from "../../src/session"
import { MessageV2 } from "../../src/session/message-v2"
import { SessionPrompt } from "../../src/session/prompt"
import { SessionStatus } from "../../src/session/status"
import { Log } from "../../src/util/log"

Log.init({ print: false })

const dir = path.join(__dirname, "../..").replace(/\\test$/, "")

function cmd() {
  const shell = Shell.preferred()
  const name = (process.platform === "win32" ? path.win32.basename(shell, ".exe") : path.basename(shell)).toLowerCase()
  if (name === "cmd") return "ping -n 30 127.0.0.1 > nul"
  if (name === "powershell" || name === "pwsh") return "Start-Sleep -Seconds 30"
  return "sleep 30"
}

async function waitForBash(sessionID: string, done = false) {
  for (let i = 0; i < 400; i++) {
    const msgs = await Session.messages({ sessionID })
    const part = msgs
      .flatMap((msg) => msg.parts)
      .findLast((part): part is MessageV2.ToolPart => part.type === "tool" && part.tool === "bash")
    if (part && (!done || part.state.status === "completed")) return part
    await sleep(50)
  }

  throw new Error("bash part not found")
}

function meta(part: MessageV2.ToolPart) {
  if (!("metadata" in part.state)) return undefined
  return part.state.metadata
}

async function waitForPtyID(sessionID: string) {
  for (let i = 0; i < 200; i++) {
    const part = await waitForBash(sessionID)
    const id = meta(part)?.ptyID
    if (typeof id === "string") return id
    await sleep(50)
  }

  throw new Error("pty id not found")
}

describe("server.session shell abort", () => {
  test("removing the shell pty stops the running shell and returns session to idle", async () => {
    await Instance.provide({
      directory: dir,
      fn: async () => {
        const agent = await Agent.defaultAgent()
        const session = await Session.create({})
        const run = SessionPrompt.shell({
          sessionID: session.id,
          agent,
          command: cmd(),
        })

        expect(SessionStatus.get(session.id).type).toBe("busy")
        const liveID = await waitForPtyID(session.id)
        expect(typeof liveID).toBe("string")
        await Pty.remove(String(liveID))
        await run

        const part = await waitForBash(session.id, true)
        expect(part.state.status).toBe("completed")
        if (part.state.status !== "completed") throw new Error("expected completed bash part")
        expect(typeof meta(part)?.ptyID).toBe("string")
        expect(Pty.get(String(meta(part)?.ptyID))).toBeUndefined()
        expect(meta(part)?.interrupted).toBe(true)
        expect(part.state.output).not.toContain("<metadata>")
        expect(part.state.output).not.toContain("User aborted the command")
        expect(SessionStatus.get(session.id).type).toBe("idle")

        await Session.remove(session.id)
      },
    })
  }, 30000)

  test("interrupting the shell pty sends ctrl-c without injecting metadata into output", async () => {
    await Instance.provide({
      directory: dir,
      fn: async () => {
        const agent = await Agent.defaultAgent()
        const session = await Session.create({})
        const run = SessionPrompt.shell({
          sessionID: session.id,
          agent,
          command: cmd(),
        })

        const liveID = await waitForPtyID(session.id)
        expect(Pty.interrupt(String(liveID), { forceAfter: 1500 })).toBe(true)
        await run

        const part = await waitForBash(session.id, true)
        expect(part.state.status).toBe("completed")
        if (part.state.status !== "completed") throw new Error("expected completed bash part")
        expect(meta(part)?.interrupted).toBe(true)
        expect(part.state.output).not.toContain("<metadata>")
        expect(part.state.output).not.toContain("User aborted the command")
        expect(SessionStatus.get(session.id).type).toBe("idle")

        await Session.remove(session.id)
      },
    })
  }, 30000)

  test("aborting the shell HTTP request cancels the shell session", async () => {
    await Instance.provide({
      directory: dir,
      fn: async () => {
        const agent = await Agent.defaultAgent()
        const session = await Session.create({})
        const app = Server.App()

        const abort = new AbortController()
        const url = new URL(`http://localhost/session/${session.id}/shell`)
        url.searchParams.set("directory", dir)

        const req = new Request(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent,
            command: cmd(),
          }),
          signal: abort.signal,
        })

        const run = Promise.resolve(app.request(req)).catch((err: unknown) => err)

        await waitForBash(session.id)
        expect(SessionStatus.get(session.id).type).toBe("busy")

        abort.abort()
        await run

        const part = await waitForBash(session.id, true)
        expect(part.state.status).toBe("completed")
        if (part.state.status !== "completed") throw new Error("expected completed bash part")
        expect(typeof meta(part)?.ptyID).toBe("string")
        expect(Pty.get(String(meta(part)?.ptyID))).toBeUndefined()
        expect(meta(part)?.interrupted).toBe(true)
        expect(part.state.output).not.toContain("<metadata>")
        expect(part.state.output).not.toContain("User aborted the command")
        expect(SessionStatus.get(session.id).type).toBe("idle")

        await Session.remove(session.id)
      },
    })
  }, 30000)
})
