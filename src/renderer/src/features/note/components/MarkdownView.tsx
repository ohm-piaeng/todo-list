import { memo } from 'react'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Design typography for rendered markdown (02 Workspace - Note → Paper/Content). */
const components: Components = {
  h1: ({ children }) => <h2 className="text-h2 text-fg">{children}</h2>,
  h2: ({ children }) => <h2 className="text-h2 text-fg">{children}</h2>,
  h3: ({ children }) => <h3 className="text-heading-card text-fg">{children}</h3>,
  p: ({ children }) => <p className="text-lead text-fg-secondary">{children}</p>,
  ul: ({ children }) => (
    <ul className="list-disc pl-6 text-lead leading-7 text-fg marker:text-fg">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 text-lead leading-7 text-fg">{children}</ol>
  ),
  li: ({ children, className }) => (
    <li className={className?.includes('task') ? '-ml-6 list-none' : 'pl-1'}>{children}</li>
  ),
  input: ({ checked }) => (
    <input type="checkbox" checked={checked} readOnly className="mr-2 accent-brand" />
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-brand py-1 pl-4 text-lead text-fg-secondary italic [&_p]:text-fg-secondary">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-md border border-border bg-subtle px-4 py-3.5 font-mono text-mono text-fg [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="rounded-xs bg-subtle px-1 font-mono text-mono text-fg">{children}</code>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-info-fg underline underline-offset-2"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-2 border-border" />
}

export interface IMarkdownViewProps {
  source: string
}

/** Parsing is the expensive part: memoised on the source string. */
const MarkdownView = memo(function MarkdownView({ source }: IMarkdownViewProps) {
  return (
    <div className="flex flex-col gap-1">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </Markdown>
    </div>
  )
})

export default MarkdownView
