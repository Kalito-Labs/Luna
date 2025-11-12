// Simple text formatter for chat messages
// Handles basic formatting without code syntax highlighting

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function parseMessage(content: string): string {
  if (!content) return ''
  
  let parsed = content

  // Handle bold text
  parsed = parsed.replace(
    /\*\*([^*\n]+)\*\*/g,
    (_, text) => `<strong class="bold-text">${escapeHtml(text)}</strong>`
  )

  // Handle inline code/monospace text
  parsed = parsed.replace(
    /`([^`\n]+)`/g,
    (_, code) => `<code class="simple-inline-code">${escapeHtml(code.trim())}</code>`
  )

  // Split content into lines for better processing
  const lines = parsed.split('\n')
  const processedLines: string[] = []
  let inList = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() || ''

    // Check for numbered list items (1. 2. etc.)
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/)
    if (numberedMatch) {
      if (!inList) {
        processedLines.push('<div class="list-container">')
        inList = true
      }
      processedLines.push(`<div class="list-item numbered">${numberedMatch[2]}</div>`)
      continue
    }

    // Check for bullet points
    const bulletMatch = line.match(/^[-•*]\s+(.+)$/)
    if (bulletMatch) {
      if (!inList) {
        processedLines.push('<div class="list-container">')
        inList = true
      }
      processedLines.push(`<div class="list-item">${bulletMatch[1]}</div>`)
      continue
    }

    // Close list if we were in one and this isn't a list item
    if (inList && line !== '') {
      processedLines.push('</div>')
      inList = false
    }

    // Handle regular paragraphs
    if (line === '') {
      processedLines.push('')
    } else if (!line.startsWith('<div class="list-item"')) {
      processedLines.push(`<div class="message-paragraph">${line}</div>`)
    } else {
      processedLines.push(line)
    }
  }

  // Close list if we ended while in one
  if (inList) {
    processedLines.push('</div>')
  }

  return processedLines.join('')
}
