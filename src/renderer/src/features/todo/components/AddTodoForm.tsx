import { useState, type FormEvent } from 'react'
import { createTodoInputSchema } from '@shared/todo'
import { Icon, Input } from '@renderer/shared/ui/atoms'
import { useCreateTodo } from '../api/todo.queries'

export function AddTodoForm(): React.JSX.Element {
  const [title, setTitle] = useState('')
  const create = useCreateTodo()

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault()
    const parsed = createTodoInputSchema.safeParse({ title })
    if (!parsed.success) return
    create.mutate(parsed.data, { onSuccess: () => setTitle('') })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2.5 px-1 text-fg-tertiary">
      <Icon name="plus" className="mx-px size-4" />
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task"
        aria-label="New task title"
        disabled={create.isPending}
      />
    </form>
  )
}
