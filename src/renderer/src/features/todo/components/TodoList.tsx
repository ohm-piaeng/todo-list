import { useTodos } from '../api/todo.queries'
import { TodoItem } from './TodoItem'

export function TodoList(): React.JSX.Element {
  const { data: todos, isPending, error } = useTodos()

  if (isPending) return <p className="px-1 text-body-sm text-fg-tertiary">Loading...</p>
  if (error) return <p className="px-1 text-body-sm text-danger-fg">{error.message}</p>
  if (todos.length === 0)
    return <p className="px-1 text-body-sm text-fg-tertiary">No tasks yet. Add one below.</p>

  return (
    <ul className="flex flex-col gap-1">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  )
}
