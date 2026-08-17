import type { ReactNode } from "react"

export interface RichTextViewProps {
  content: unknown
  fallbackDescription?: string | null
}

const htmlClass =
  "text-muted-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_blockquote]:border-border [&_h2]:font-heading [&_h3]:font-heading space-y-3 text-sm leading-relaxed [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-4 [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-medium [&_li]:text-sm [&_p]:my-1.5 [&_ul]:list-inside [&_ul]:list-disc [&_ul]:space-y-1"

const plainClass = "text-muted-foreground text-sm leading-relaxed"

function isHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value)
}

function HtmlText({ html }: { html: string }) {
  return (
    <div className={htmlClass} dangerouslySetInnerHTML={{ __html: html }} />
  )
}

function PlainText({ text }: { text: string }) {
  return <p className={plainClass}>{text}</p>
}

function StringContent({ value }: { value: string }) {
  return isHtml(value) ? <HtmlText html={value} /> : <PlainText text={value} />
}

export function RichTextView({
  content,
  fallbackDescription,
}: RichTextViewProps) {
  if (!content) {
    if (!fallbackDescription) return null
    return <StringContent value={fallbackDescription} />
  }

  let nodes: unknown = content
  if (typeof content === "string") {
    try {
      nodes = JSON.parse(content)
    } catch {
      return <StringContent value={content} />
    }
  }

  if (!Array.isArray(nodes)) {
    return <PlainText text={String(nodes)} />
  }

  return (
    <div className="max-w-none space-y-3 text-sm leading-relaxed">
      {nodes.map((node, i) => (
        <RenderNode key={i} node={node} />
      ))}
    </div>
  )
}

function RenderNode({ node }: { node: unknown }): ReactNode {
  if (!node || typeof node !== "object") {
    return String(node)
  }

  const el = node as {
    type?: string
    children?: unknown[]
    text?: string
    bold?: boolean
    italic?: boolean
    code?: boolean
    href?: string
  }

  if (typeof el.text === "string") {
    let textNode: ReactNode = el.text
    if (el.bold) textNode = <strong>{textNode}</strong>
    if (el.italic) textNode = <em>{textNode}</em>
    if (el.code)
      textNode = (
        <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
          {textNode}
        </code>
      )
    return textNode
  }

  const children = Array.isArray(el.children)
    ? el.children.map((child, i) => <RenderNode key={i} node={child} />)
    : null

  switch (el.type) {
    case "h1":
      return (
        <h1 className="text-foreground font-heading mt-4 mb-2 text-xl font-bold tracking-tight">
          {children}
        </h1>
      )
    case "h2":
      return (
        <h2 className="text-foreground font-heading mt-3 mb-2 text-lg font-semibold tracking-tight">
          {children}
        </h2>
      )
    case "h3":
      return (
        <h3 className="text-foreground font-heading mt-3 mb-1 text-base font-semibold">
          {children}
        </h3>
      )
    case "p":
      return (
        <p className="text-muted-foreground my-1.5 text-sm leading-relaxed">
          {children}
        </p>
      )
    case "blockquote":
      return (
        <blockquote className="border-border text-muted-foreground my-2 border-l-2 pl-4 text-xs italic">
          {children}
        </blockquote>
      )
    case "ul":
      return (
        <ul className="text-muted-foreground my-2 list-inside list-disc space-y-1 text-sm">
          {children}
        </ul>
      )
    case "ol":
      return (
        <ol className="text-muted-foreground my-2 list-inside list-decimal space-y-1 text-sm">
          {children}
        </ol>
      )
    case "li":
      return <li className="text-muted-foreground text-sm">{children}</li>
    case "a":
      return (
        <a
          href={el.href}
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline underline-offset-4 hover:opacity-80"
        >
          {children}
        </a>
      )
    default:
      return (
        <div className="text-muted-foreground my-1 text-sm">{children}</div>
      )
  }
}
