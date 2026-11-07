import { TodoCard } from '@renderer/features/todo'
import { AppLayout } from '@renderer/shared/ui/templates'

export function TodoPage(): React.JSX.Element {
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <TodoCard />
      </div>
    </AppLayout>
  )
}
