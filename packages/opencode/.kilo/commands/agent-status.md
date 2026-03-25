---
name: agent-status
description: Check the status of spawned agents. Shows active agents and their current tasks.
---

Check agent status.

$ARGUMENTS

If an agent ID is provided, use agent_status to get detailed information about that specific agent. Otherwise, list all spawned agents with their status.

Report:

- Agent ID and type
- Current status (idle, active, paused, error)
- Tasks completed
- Current task if active
