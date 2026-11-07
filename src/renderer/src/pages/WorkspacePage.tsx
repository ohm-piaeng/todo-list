import { memo, useCallback } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import type { DocumentKind, ISheet } from '@shared/notebook'
import {
  AddSheetButton,
  DocumentActions,
  DocumentCrumb,
  DocumentSidebar,
  SheetFrame,
  useDocument,
  useDocumentSummaries
} from '@renderer/features/documents'
import { MarkdownToolbar, NoteBody, NoteEditorProvider } from '@renderer/features/note'
import { WorkspaceLayout } from '@renderer/shared/ui/templates'

interface ISheetRowProps {
  documentId: number
  kind: DocumentKind
  sheet: ISheet
  index: number
  total: number
}

/**
 * One paper. Memoised on the sheet object: React Query's structural sharing keeps
 * untouched sheets referentially equal, so editing one page re-renders only that page.
 */
const SheetRow = memo(function SheetRow({ documentId, kind, sheet, index, total }: ISheetRowProps) {
  return (
    <SheetFrame
      documentId={documentId}
      kind={kind}
      sheetId={sheet.id}
      title={sheet.title}
      index={index}
      total={total}
    >
      {kind === 'note' ? (
        <NoteBody documentId={documentId} sheetId={sheet.id} body={sheet.body} />
      ) : null}
    </SheetFrame>
  )
})

export function WorkspacePage(): React.JSX.Element | null {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const { data: doc, isPending, isError } = useDocument(id)
  const { data: summaries } = useDocumentSummaries()

  const open = useCallback((next: number) => navigate(`/d/${next}`), [navigate])
  const onRemoved = useCallback(() => {
    const next = summaries?.find((d) => d.id !== id)
    navigate(next ? `/d/${next.id}` : '/welcome', { replace: true })
  }, [summaries, id, navigate])

  if (isError) return <Navigate to="/" replace />
  if (isPending || !doc) return null

  const content = (
    <WorkspaceLayout
      sidebar={<DocumentSidebar activeId={doc.id} onCreated={open} />}
      topStart={<DocumentCrumb kind={doc.kind} title={doc.title} updatedAt={doc.updatedAt} />}
      topCenter={doc.kind === 'note' ? <MarkdownToolbar /> : null}
      topEnd={<DocumentActions id={doc.id} kind={doc.kind} onRemoved={onRemoved} />}
    >
      {doc.sheets.map((sheet, i) => (
        <SheetRow
          key={sheet.id}
          documentId={doc.id}
          kind={doc.kind}
          sheet={sheet}
          index={i}
          total={doc.sheets.length}
        />
      ))}
      <AddSheetButton documentId={doc.id} />
    </WorkspaceLayout>
  )

  // key: a fresh editor store per document
  return doc.kind === 'note' ? (
    <NoteEditorProvider key={doc.id}>{content}</NoteEditorProvider>
  ) : (
    content
  )
}
