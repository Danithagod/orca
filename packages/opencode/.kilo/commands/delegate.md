---
name: delegate
description: Delegate a task to an available agent. Optionally specify which agent should handle it.
---

Delegate the following task: $ARGUMENTS

Use the delegate tool to assign the task to an agent. Parse arguments for:

- Task ID (required)
- Agent ID (optional - will auto-route if not specified)

The task will be assigned to the specified agent or automatically routed to the most suitable agent based on task type.

After delegation, report the agent assignment and task status.
