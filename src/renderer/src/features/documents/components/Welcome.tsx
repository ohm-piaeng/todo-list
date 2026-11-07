import { useCallback } from 'react'
import type { DocumentKind } from '@shared/notebook'
import { AppMark } from '@renderer/shared/ui/atoms'
import { useCreateDocument } from '../api/documents.queries'
import { ChoiceCard } from './ChoiceCard'

export interface IWelcomeProps {
  /** Called with the new document id once it exists. */
  onCreated: (id: number) => void
}

/** First-launch hero: pick the first thing to create. */
export function Welcome({ onCreated }: IWelcomeProps): React.JSX.Element {
  const create = useCreateDocument()
  const { mutate, isPending, error } = create

  const start = useCallback(
    (kind: DocumentKind) => mutate(kind, { onSuccess: (doc) => onCreated(doc.id) }),
    [mutate, onCreated]
  )
  const createNote = useCallback(() => start('note'), [start])
  const createList = useCallback(() => start('todo'), [start])

  return (
    <>
      <header className="flex max-w-welcome flex-col items-center gap-4 text-center">
        <AppMark size="lg" />
        <h1 className="text-display-welcome text-fg">Welcome to your notebook</h1>
        <p className="text-subtitle text-fg-secondary">
          A quiet place for notes and to-dos. What would you like to start with?
        </p>
      </header>

      <div className="flex flex-wrap justify-center gap-5">
        <ChoiceCard
          icon="note"
          tone="info"
          title="Note"
          description="Write freely in Markdown with headings, lists, code and links."
          action="Create note"
          disabled={isPending}
          onSelect={createNote}
        />
        <ChoiceCard
          icon="todo"
          tone="success"
          title="To-do list"
          description="Track tasks with checkboxes. Adjust text size and weight to taste."
          action="Create list"
          disabled={isPending}
          onSelect={createList}
        />
      </div>

      {error ? (
        <p role="alert" className="text-body-sm text-danger-fg">
          {error.message}
        </p>
      ) : (
        <p className="text-body-sm text-fg-tertiary">
          You can always add more notes and lists from the sidebar.
        </p>
      )}
    </>
  )
}
