---
name: task-create
description: Create a new task for the orchestrator. Task types: explore (understand code), implement (build feature), test (validate), review (code review), generic (general purpose).
---

Create a new task: $ARGUMENTS

Use the task_create tool to create a task. Parse the arguments to extract:

- Title (required)
- Description (required)
- Task type (explore, implement, test, review, or generic)
- Priority (low, medium, high, critical - defaults to medium)

After creating, report the task ID and status.
