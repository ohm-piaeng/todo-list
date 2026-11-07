export type MarkdownAction =
  'heading' | 'bold' | 'italic' | 'strike' | 'list' | 'task' | 'quote' | 'code' | 'link'

export interface ITextSelection {
  value: string
  start: number
  end: number
}

/** A single replacement of `value[from, to)` plus where the caret/selection should land. */
export interface IMarkdownEdit {
  from: number
  to: number
  insert: string
  selectionStart: number
  selectionEnd: number
}

const INLINE: Partial<Record<MarkdownAction, [string, string, string]>> = {
  // [open, close, placeholder]
  bold: ['**', '**', 'bold text'],
  italic: ['_', '_', 'italic text'],
  strike: ['~~', '~~', 'struck text'],
  code: ['`', '`', 'code']
}

const LINE_PREFIX: Partial<Record<MarkdownAction, string>> = {
  heading: '## ',
  list: '- ',
  task: '- [ ] ',
  quote: '> '
}

/** Any list/quote/heading marker a line may already carry. */
const ANY_PREFIX = /^(#{1,6} |- \[[ xX]\] |[-*+] |> )/

function wrapInline(
  sel: ITextSelection,
  open: string,
  close: string,
  placeholder: string
): IMarkdownEdit {
  const { value, start, end } = sel
  const selected = value.slice(start, end)
  // Toggle off when the selection is already wrapped.
  if (
    value.slice(start - open.length, start) === open &&
    value.slice(end, end + close.length) === close
  ) {
    return {
      from: start - open.length,
      to: end + close.length,
      insert: selected,
      selectionStart: start - open.length,
      selectionEnd: end - open.length
    }
  }
  const text = selected || placeholder
  return {
    from: start,
    to: end,
    insert: `${open}${text}${close}`,
    selectionStart: start + open.length,
    selectionEnd: start + open.length + text.length
  }
}

function prefixLines(sel: ITextSelection, prefix: string): IMarkdownEdit {
  const { value, start, end } = sel
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const nextBreak = value.indexOf('\n', end)
  const lineEnd = nextBreak === -1 ? value.length : nextBreak
  const lines = value.slice(lineStart, lineEnd).split('\n')
  const allHave = lines.every((l) => l.startsWith(prefix))
  const next = lines.map((l) =>
    allHave ? l.slice(prefix.length) : prefix + l.replace(ANY_PREFIX, '')
  )
  const insert = next.join('\n')
  return {
    from: lineStart,
    to: lineEnd,
    insert,
    selectionStart: lineStart + (lines.length === 1 ? insert.length : 0),
    selectionEnd: lineStart + insert.length
  }
}

function codeBlock(sel: ITextSelection): IMarkdownEdit {
  const { value, start, end } = sel
  const selected = value.slice(start, end)
  const before = start > 0 && value[start - 1] !== '\n' ? '\n' : ''
  const body = selected || 'code'
  const insert = `${before}\`\`\`\n${body}\n\`\`\`\n`
  const bodyStart = start + before.length + 4
  return {
    from: start,
    to: end,
    insert,
    selectionStart: bodyStart,
    selectionEnd: bodyStart + body.length
  }
}

function link(sel: ITextSelection): IMarkdownEdit {
  const { value, start, end } = sel
  const text = value.slice(start, end) || 'link text'
  const insert = `[${text}](https://)`
  const urlStart = start + text.length + 3
  return { from: start, to: end, insert, selectionStart: urlStart, selectionEnd: urlStart + 8 }
}

/** Compute the edit a toolbar action makes on a textarea's text + selection. */
export function applyMarkdown(sel: ITextSelection, action: MarkdownAction): IMarkdownEdit {
  if (action === 'code' && sel.value.slice(sel.start, sel.end).includes('\n')) return codeBlock(sel)
  if (action === 'link') return link(sel)
  const inline = INLINE[action]
  if (inline) return wrapInline(sel, ...inline)
  const prefix = LINE_PREFIX[action]
  if (prefix) return prefixLines(sel, prefix)
  throw new Error(`Unknown markdown action: ${action}`)
}

/** Apply an edit to a string (used by tests and as the non-DOM fallback). */
export function applyEdit(value: string, edit: IMarkdownEdit): string {
  return value.slice(0, edit.from) + edit.insert + value.slice(edit.to)
}
