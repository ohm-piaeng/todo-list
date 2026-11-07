import { Icon } from '@renderer/shared/ui/atoms'
import { useCreateSheet } from '../api/sheets.queries'

export interface IAddSheetButtonProps {
  documentId: number
}

export function AddSheetButton({ documentId }: IAddSheetButtonProps): React.JSX.Element {
  const { mutate, isPending } = useCreateSheet(documentId)
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => mutate()}
      className="flex h-14 w-full max-w-paper shrink-0 items-center justify-center gap-2 rounded-md border border-dashed border-border-strong text-body font-semibold text-fg-secondary transition-colors outline-none hover:bg-window hover:text-fg focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
    >
      <Icon name="plus" />
      New page
    </button>
  )
}
