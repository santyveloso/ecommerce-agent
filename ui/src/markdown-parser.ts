/* ── Markdown block parser ───────────────────── */

export interface MarkdownBlock {
  type: 'code' | 'markdown'
  content: string
  lang?: string
}

/**
 * Split raw markdown content into code blocks and non-code blocks.
 * Pure function — no side effects, no React dependency.
 */
export function parseCodeBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = []
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  let remaining = content
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'markdown', content: remaining.slice(lastIndex, match.index) })
    }
    blocks.push({ type: 'code', content: match[2], lang: match[1] || 'text' })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < remaining.length) {
    blocks.push({ type: 'markdown', content: remaining.slice(lastIndex) })
  }

  return blocks
}
