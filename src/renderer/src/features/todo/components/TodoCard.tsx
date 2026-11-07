import { useTodos } from '../api/todo.queries'
import { AddTodoForm } from './AddTodoForm'
import { TodoList } from './TodoList'

/** Progress + list + add form: the todo feature's main organism. */
export function TodoCard(): React.JSX.Element {
  const { data: todos = [] } = useTodos()
  const done = todos.filter((t) => t.completed).length

  return (
    <section className="rounded-lg border border-border bg-window px-16 py-14 shadow-sm">
      <p className="text-label text-fg-tertiary">
        {done} of {todos.length} done
      </p>
      <h1 className="mt-3 mb-4 text-heading-page text-fg">To-do</h1>
      <TodoList />
      <div className="mt-1">
        <AddTodoForm />
      </div>
    </section>
  )
}
