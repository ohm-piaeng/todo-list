import type { ITodo } from '@shared/todo'
import { Button, Checkbox, Icon } from '@renderer/shared/ui/atoms'
import { cn } from '@renderer/shared/lib'
import { useRemoveTodo, useUpdateTodo } from '../api/todo.queries'

export interface ITodoItemProps {
  todo: ITodo
}

export function TodoItem({ todo }: ITodoItemProps): React.JSX.Element {
  const update = useUpdateTodo()
  const remove = useRemoveTodo()

  return (
    <li className="group flex h-control-md items-center gap-2.5 rounded-md px-1 hover:bg-row-alt">
      <Checkbox
        checked={todo.completed}
        aria-label={todo.completed ? 'Mark as not done' : 'Mark as done'}
        onChange={(e) => update.mutate({ id: todo.id, completed: e.target.checked })}
      />
      <span
        className={cn(
          'flex-1 truncate text-body font-semibold',
          todo.completed ? 'text-fg-tertiary line-through' : 'text-fg'
        )}
      >
        {todo.title}
      </span>
      <Button
        variant="danger"
        size="icon"
        aria-label="Delete task"
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        onClick={() => remove.mutate(todo.id)}
      >
        <Icon name="trash" />
      </Button>
    </li>
  )
}
