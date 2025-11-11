// Enhanced Shiki-based syntax highlighter with multiple themes
import { createHighlighter, type Highlighter } from 'shiki'

let highlighter: Highlighter | null = null
let initPromise: Promise<Highlighter> | null = null

async function getHighlighter(): Promise<Highlighter> {
  if (highlighter) {
    return highlighter
  }

  if (initPromise) {
    return initPromise
  }

  initPromise = createHighlighter({
    themes: [
      'dark-plus',
      'github-dark',
      'night-owl',
      'material-theme-darker',
      'synthwave-84',
      'dracula'
    ],
    langs: [
      'javascript',
      'typescript', 
      'python',
      'bash',
      'shell',
      'sql',
      'json',
      'css',
      'scss',
      'html',
      'xml',
      'yaml',
      'toml',
      'markdown',
      'java',
      'csharp',
      'cpp',
      'c',
      'rust',
      'go',
      'php',
      'ruby',
      'swift',
      'kotlin',
      'vue',
      'jsx',
      'tsx',
      'svelte',
      'astro',
      'dockerfile',
      'diff'
      // Removed 'nginx', 'apache', 'gitignore' as they're not in the bundle
    ]
  })

  highlighter = await initPromise
  return highlighter
}

export async function highlightCode(code: string, language: string): Promise<string> {
  try {
    const shiki = await getHighlighter()
    
    // Enhanced language mapping with more aliases
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'sh': 'bash',
      'zsh': 'bash',
      'fish': 'bash',
      'powershell': 'bash',
      'ps1': 'bash',
      'cmd': 'bash',
      'c#': 'csharp',
      'c++': 'cpp',
      'cplusplus': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'h': 'cpp',
      'hpp': 'cpp',
      'hxx': 'cpp',
      'yml': 'yaml',
      'dockerfile': 'dockerfile',
      'docker': 'dockerfile',
      'vue.js': 'vue',
      'react': 'jsx',
      'reactjs': 'jsx',
      'next': 'jsx',
      'nextjs': 'jsx',
      'nuxt': 'vue',
      'scss': 'scss',
      'sass': 'scss',
      'less': 'css',
      'stylus': 'css',
      'md': 'markdown',
      'mdown': 'markdown',
      'mkd': 'markdown',
      'text': 'plaintext',
      'txt': 'plaintext',
      'log': 'plaintext'
    }
    
    const mappedLang = languageMap[language.toLowerCase()] || language.toLowerCase()
    
    // Let Shiki handle all styling - don't interfere with its output
    const highlightedHtml = shiki.codeToHtml(code, {
      lang: mappedLang,
      theme: 'dracula' // Use Dracula theme which has excellent contrast on dark backgrounds
    })
    
    // Only remove the background color from the pre element, preserve all syntax highlighting
    const result = highlightedHtml.replace(
      /(<pre[^>]*style="[^"]*?)background-color:[^;]*;?([^"]*")/g, 
      '$1$2'
    )
    
    return result
  } catch {
    // Shiki highlighting failed - use fallback
    return `<pre class="shiki-fallback"><code class="language-${language}">${escapeHtml(code)}</code></pre>`
  }
}

// Helper function to escape HTML
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Helper function to format code blocks
async function formatCodeBlock(code: string, language?: string): Promise<string> {
  // Clean up the code content
  const lines = code.split('\n')

  // Remove leading/trailing empty lines
  while (lines.length > 0 && lines[0].trim() === '') {
    lines.shift()
  }
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop()
  }

  // Find minimum indentation (excluding empty lines)
  const nonEmptyLines = lines.filter((line: string) => line.trim() !== '')
  let minIndent = Infinity
  for (const line of nonEmptyLines) {
    const indentMatch = line.match(/^( *)/)
    if (indentMatch) {
      minIndent = Math.min(minIndent, indentMatch[1].length)
    }
  }

  // Remove common indentation
  if (minIndent !== Infinity && minIndent > 0) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() !== '') {
        lines[i] = lines[i].substring(minIndent)
      }
    }
  }

  const cleanCode = lines.join('\n')
  const highlighted = await highlightCode(cleanCode, language || 'text')
  const displayLanguage = language || 'code'

  return `<div class="simple-code-block">
    <div class="simple-code-header">
      <span class="simple-language">${displayLanguage}</span>
    </div>
    <div class="simple-code-content">${highlighted}</div>
  </div>`
}

// Simple message parser
export async function parseMessage(content: string): Promise<string> {
  if (content.includes('<div class="simple-code-block"')) {
    return content
  }

  let parsed = content

  // Enhanced code block detection with better regex patterns
  const codeBlockRegex = /```(\w+)?\s*\n?([\s\S]*?)\n?```/g
  const codeBlocks: Array<{ match: string; replacement: Promise<string> }> = []
  let match

  // First pass: handle standard markdown code blocks
  while ((match = codeBlockRegex.exec(parsed)) !== null) {
    const [fullMatch, language, code] = match
    codeBlocks.push({
      match: fullMatch,
      replacement: formatCodeBlock(code, language)
    })
  }

  // Second pass: handle malformed code blocks (like "cpp//" or "cpp ///")
  const malformedCodeRegex = /(\w+)\s*\/\/\/?\s*\n([\s\S]*?)(?=\n\w+\s*\/\/\/?\s*\n|\n\n|$)/g
  while ((match = malformedCodeRegex.exec(parsed)) !== null) {
    const [fullMatch, language, code] = match
    // Only process if it looks like C++ code
    if (language.toLowerCase().includes('cpp') || language.toLowerCase().includes('c++') || 
        code.includes('#include') || code.includes('std::') || code.includes('int main')) {
      codeBlocks.push({
        match: fullMatch,
        replacement: formatCodeBlock(code.trim(), 'cpp')
      })
    }
  }

  // Third pass: detect C++ code blocks without proper markers
  const cppDetectionRegex = /((?:#include.*?\n|using namespace.*?\n)*[\s\S]*?int main\s*\([^)]*\)\s*\{[\s\S]*?\})/g
  while ((match = cppDetectionRegex.exec(parsed)) !== null) {
    const [fullMatch, code] = match
    // Only process if not already in a code block
    if (!fullMatch.includes('<div class="simple-code-block"') && 
        !codeBlocks.some(block => fullMatch.includes(block.match))) {
      codeBlocks.push({
        match: fullMatch,
        replacement: formatCodeBlock(code.trim(), 'cpp')
      })
    }
  }

  // Await all code block processing
  for (const block of codeBlocks) {
    const replacement = await block.replacement
    parsed = parsed.replace(block.match, replacement)
  }

  // Handle inline code
  parsed = parsed.replace(
    /`([^`\n]+)`/g,
    (_, code) => `<code class="simple-inline-code">${escapeHtml(code.trim())}</code>`
  )

  // Handle bold text
  parsed = parsed.replace(
    /\*\*([^*\n]+)\*\*/g,
    (_, text) => `<strong class="bold-text">${escapeHtml(text)}</strong>`
  )

  // Split content into lines for better processing
  const lines = parsed.split('\n')
  const processedLines: string[] = []
  let inList = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

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
    } else if (
      !line.startsWith('<div class="simple-code-block"') &&
      !line.startsWith('<div class="list-item"')
    ) {
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
