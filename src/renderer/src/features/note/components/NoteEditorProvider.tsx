import { useState, type ReactNode } from 'react'
import { createNoteEditorStore, NoteEditorContext } from './noteEditor'

export function NoteEditorProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [store] = useState(createNoteEditorStore)
  return <NoteEditorContext.Provider value={store}>{children}</NoteEditorContext.Provider>
}
