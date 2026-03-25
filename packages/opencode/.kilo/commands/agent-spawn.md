---
name: agent-spawn
description: Spawn a specialized agent to handle a specific task. Agent types: architect (explore/plan), builder (implement), tester (run tests), reviewer (code review), memory-keeper (manage memory), coordinator (multi-agent).
---

Spawn an agent to handle: $ARGUMENTS

Use the agent_spawn tool to create a new agent. Choose the appropriate agent type:

- architect: For exploring codebase, planning architecture, reading files
- builder: For implementing features, writing code, editing files
- tester: For running tests, validating changes
- reviewer: For reviewing code, finding issues
- memory-keeper: For managing persistent memory
- coordinator: For coordinating multi-agent tasks

After spawning, report the agent ID and its capabilities.
