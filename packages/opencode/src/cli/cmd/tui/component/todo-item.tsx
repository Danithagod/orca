import { useTheme } from "../context/theme"
import { TodoStatus } from "./todo-status"

export interface TodoItemProps {
  status: string
  content: string
}

export function TodoItem(props: TodoItemProps) {
  const { theme } = useTheme()
  const fg = () => {
    if (props.status === "completed") return theme.success
    if (props.status === "in_progress") return theme.warning
    if (props.status === "paused") return theme.warning
    return theme.textMuted
  }

  return (
    <box flexDirection="row" gap={1}>
      <TodoStatus status={props.status} compact />
      <text flexGrow={1} wrapMode="word" style={{ fg: fg() }}>
        {props.content}
      </text>
    </box>
  )
}
