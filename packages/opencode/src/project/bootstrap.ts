import { Plugin } from "../plugin"
import { Format } from "../format"
import { LSP } from "../lsp"
import { FileWatcher } from "../file/watcher"
import { File } from "../file"
import { Project } from "./project"
import { Bus } from "../bus"
import { Command } from "../command"
import { Instance } from "./instance"
import { Vcs } from "./vcs"
import { Log } from "@/util/log"
import { KiloSessions } from "@/kilo-sessions/kilo-sessions" // kilocode_change
import { Snapshot } from "../snapshot"
import { Truncate } from "../tool/truncation"
import { SessionMemory } from "../orca/memory/session-integration" // kilocode_change
import { initializeContextHooks } from "../orca/memory/context-hooks" // kilocode_change
import { StartupTrace } from "@/startup/trace"

export async function InstanceBootstrap() {
  const dir = Instance.directory
  await StartupTrace.time("instance.bootstrap", {
    extra: { directory: dir },
    fn: async () => {
      Log.Default.info("bootstrapping", { directory: dir })
      await StartupTrace.time("instance.bootstrap.plugin", {
        extra: { directory: dir },
        fn: () => Plugin.init(),
      })
      await StartupTrace.time("instance.bootstrap.kilo_sessions", {
        extra: { directory: dir },
        fn: () => KiloSessions.init(),
      })
      await StartupTrace.time("instance.bootstrap.format", {
        extra: { directory: dir },
        fn: () => Format.init(),
      })
      await StartupTrace.time("instance.bootstrap.lsp", {
        extra: { directory: dir },
        fn: () => LSP.init(),
      })
      await StartupTrace.time("instance.bootstrap.file_watcher", {
        extra: { directory: dir },
        fn: () => FileWatcher.init(),
      })
      await StartupTrace.time("instance.bootstrap.file", {
        extra: { directory: dir },
        fn: () => File.init(),
      })
      await StartupTrace.time("instance.bootstrap.vcs", {
        extra: { directory: dir },
        fn: () => Vcs.init(),
      })
      await StartupTrace.time("instance.bootstrap.snapshot", {
        extra: { directory: dir },
        fn: () => Snapshot.init(),
      })
      await StartupTrace.time("instance.bootstrap.truncate", {
        extra: { directory: dir },
        fn: () => Truncate.init(),
      })

      try {
        await StartupTrace.time("instance.bootstrap.memory", {
          extra: { directory: dir },
          fn: () => {
            SessionMemory.initialize()
            initializeContextHooks()
            Log.Default.info("Orca memory integration initialized")
          },
        })
      } catch (err) {
        Log.Default.error("Failed to initialize Orca memory integration", { err })
      }

      Bus.subscribe(Command.Event.Executed, async (payload) => {
        if (payload.properties.name === Command.Default.INIT) {
          await Project.setInitialized(Instance.project.id)
        }
      })
    },
  })
}
