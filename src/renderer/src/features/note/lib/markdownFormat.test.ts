import { describe, expect, it } from 'vitest'
import { applyEdit, applyMarkdown, type MarkdownAction } from './markdownFormat'

/** `|` marks the selection: "a|b|c" selects "b"; a single "|" is the caret. */
function run(marked: string, action: MarkdownAction): string {
  const start = marked.indexOf('|')
  const second = marked.indexOf('|', start + 1)
  const end = second === -1 ? start : second - 1
  const value = marked.replace(/\|/g, '')
  const edit = applyMarkdown({ value, start, end }, action)
  const out = applyEdit(value, edit)
  const a = edit.selectionStart
  const b = edit.selectionEnd
  return a === b
    ? `${out.slice(0, a)}|${out.slice(a)}`
    : `${out.slice(0, a)}|${out.slice(a, b)}|${out.slice(b)}`
}

describe('applyMarkdown – inline', () => {
  it.each([
    ['say |hi| now', 'bold', 'say **|hi|** now'],
    ['say |hi| now', 'italic', 'say _|hi|_ now'],
    ['say |hi| now', 'strike', 'say ~~|hi|~~ now'],
    ['say |hi| now', 'code', 'say `|hi|` now'],
    ['x |', 'bold', 'x **|bold text|**']
  ] as const)('%s + %s → %s', (input, action, expected) => {
    expect(run(input, action)).toBe(expected)
  })

  it('toggles bold off when already wrapped', () => {
    expect(run('say **|hi|** now', 'bold')).toBe('say |hi| now')
  })
})

describe('applyMarkdown – line prefixes', () => {
  it.each([
    ['Pro|duct', 'heading', '## Product|'],
    ['milk|', 'list', '- milk|'],
    ['milk|', 'task', '- [ ] milk|'],
    ['wise words|', 'quote', '> wise words|']
  ] as const)('%s + %s → %s', (input, action, expected) => {
    expect(run(input, action)).toBe(expected)
  })

  it('toggles the prefix off', () => {
    expect(run('## Prod|uct', 'heading')).toBe('Product|')
  })

  it('replaces another marker instead of stacking', () => {
    expect(run('- milk|', 'task')).toBe('- [ ] milk|')
  })

  it('prefixes every selected line', () => {
    expect(run('|a\nb|\nc', 'list')).toBe('|- a\n- b|\nc')
  })
})

describe('applyMarkdown – blocks', () => {
  it('wraps a multi-line selection in a fenced code block', () => {
    expect(run('x\n|a\nb|', 'code')).toBe('x\n```\n|a\nb|\n```\n')
  })

  it('creates a link and selects the url', () => {
    expect(run('see |docs|', 'link')).toBe('see [docs](|https://|)')
  })
})
