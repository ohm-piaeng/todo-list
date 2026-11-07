import { Fragment, memo } from 'react'
import { Divider, IconButton, type IconName } from '@renderer/shared/ui/atoms'
import { Toolbar } from '@renderer/shared/ui/molecules'
import type { MarkdownAction } from '../lib/markdownFormat'
import { useNoteEditor } from './noteEditor'

interface IToolbarAction {
  action: MarkdownAction
  icon: IconName
  label: string
}

/** Groups separated by dividers, in design order: H B I S | • ☑ ❝ | <> 🔗 */
const GROUPS: IToolbarAction[][] = [
  [
    { action: 'heading', icon: 'heading', label: 'Heading' },
    { action: 'bold', icon: 'bold', label: 'Bold (Ctrl+B)' },
    { action: 'italic', icon: 'italic', label: 'Italic (Ctrl+I)' },
    { action: 'strike', icon: 'strike', label: 'Strikethrough' }
  ],
  [
    { action: 'list', icon: 'list', label: 'Bulleted list' },
    { action: 'task', icon: 'todo', label: 'Checklist' },
    { action: 'quote', icon: 'quote', label: 'Quote' }
  ],
  [
    { action: 'code', icon: 'code', label: 'Code' },
    { action: 'link', icon: 'link', label: 'Link' }
  ]
]

export const MarkdownToolbar = memo(function MarkdownToolbar() {
  const { apply } = useNoteEditor()
  return (
    <Toolbar label="Formatting">
      {GROUPS.map((group, i) => (
        <Fragment key={group[0].action}>
          {i > 0 && <Divider orientation="vertical" />}
          {group.map(({ action, icon, label }) => (
            <IconButton
              key={action}
              icon={icon}
              label={label}
              // keep focus (and the selection) in the textarea
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => apply(action)}
            />
          ))}
        </Fragment>
      ))}
    </Toolbar>
  )
})
