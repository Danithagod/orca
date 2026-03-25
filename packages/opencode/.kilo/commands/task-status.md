---
name: task-status
description: Check the status and progress of a task by its ID.
---

Check task status for: $ARGUMENTS

Use the task_status tool with the provided task ID. Report:

- Task title and type
- Current status (pending, running, completed, failed, paused)
- Progress percentage
- Assigned agent if any
- Error information if failed
- Result if completed and includeOutput is set
