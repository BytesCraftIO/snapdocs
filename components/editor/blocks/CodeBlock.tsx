'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Block, CodeProperties } from '@/types'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// Basic syntax highlighting without external dependencies
const highlightSyntax = (code: string, language: string): string => {
  if (!code.trim()) return code

  const patterns: Record<string, RegExp[]> = {
    javascript: [
      /(\b(?:const|let|var|function|class|if|else|for|while|return|import|export|from|async|await)\b)/g,
      /(\/\/.*$)/gm,
      /(\/\*[\s\S]*?\*\/)/g,
      /('([^'\\]|\\.)*'|"([^"\\]|\\.)*"|`([^`\\]|\\.)*`)/g,
      /(\b\d+\.?\d*\b)/g,
    ],
    typescript: [
      /(\b(?:const|let|var|function|class|if|else|for|while|return|import|export|from|async|await|interface|type|enum)\b)/g,
      /(\/\/.*$)/gm,
      /(\/\*[\s\S]*?\*\/)/g,
      /('([^'\\]|\\.)*'|"([^"\\]|\\.)*"|`([^`\\]|\\.)*`)/g,
      /(\b\d+\.?\d*\b)/g,
    ],
    python: [
      /(\b(?:def|class|if|else|elif|for|while|return|import|from|as|try|except|with|lambda|pass|break|continue)\b)/g,
      /(#.*$)/gm,
      /('([^'\\]|\\.)*'|"([^"\\]|\\.)*"|'''[\s\S]*?'''|"""[\s\S]*?""")/g,
      /(\b\d+\.?\d*\b)/g,
    ],
    json: [
      /("(?:[^"\\]|\\.)*")\s*:/g,
      /:\s*("(?:[^"\\]|\\.)*")/g,
      /(\b(?:true|false|null)\b)/g,
      /(\b\d+\.?\d*\b)/g,
    ],
    css: [
      /([.#][\w-]+)/g,
      /(\/\*[\s\S]*?\*\/)/g,
      /(\b(?:color|background|font-size|margin|padding|border|width|height|display|position)\b)/g,
      /(:[\w-]+)/g,
    ]
  }

  const colors = [
    'text-blue-600 dark:text-blue-400', // keywords
    'text-gray-500 dark:text-gray-400', // comments
    'text-gray-600 dark:text-gray-300', // comments
    'text-green-600 dark:text-green-400', // strings
    'text-orange-600 dark:text-orange-400', // numbers
  ]

  let highlightedCode = code
  const langPatterns = patterns[language] || patterns.javascript

  langPatterns.forEach((pattern, index) => {
    const colorClass = colors[index] || 'text-gray-800 dark:text-gray-200'
    highlightedCode = highlightedCode.replace(
      pattern,
      `<span class="${colorClass}">$1</span>`
    )
  })

  return highlightedCode
}

interface CodeBlockProps {
  block: Block
  onUpdate?: (content: string) => void
  onPropertyUpdate?: (properties: CodeProperties) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  readOnly?: boolean
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
  { value: 'plaintext', label: 'Plain Text' },
]

export default function CodeBlock({
  block,
  onUpdate,
  onPropertyUpdate,
  onKeyDown,
  readOnly = false
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [showLanguageSelect, setShowLanguageSelect] = useState(false)
  const [isEditing, setIsEditing] = useState(true) // Start in editing mode
  const previewRef = useRef<HTMLPreElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const content = typeof block.content === 'string' 
    ? block.content 
    : Array.isArray(block.content) 
      ? block.content.map(rt => rt.text).join('')
      : ''

  const properties = block.properties as CodeProperties || {}
  const language = properties.language || 'plaintext'

  // Update highlighted preview when content or language changes
  useEffect(() => {
    if (previewRef.current && !isEditing && content) {
      const highlighted = highlightSyntax(content, language)
      previewRef.current.innerHTML = highlighted
    }
  }, [content, language, isEditing])

  const handleCopy = async () => {
    if (content) {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLanguageChange = (newLanguage: string) => {
    onPropertyUpdate?.({ ...properties, language: newLanguage })
    setShowLanguageSelect(false)
  }

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate?.(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.target as HTMLTextAreaElement
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      
      onUpdate?.(newValue)
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
    
    onKeyDown?.(e as any)
  }

  // Focus textarea when component mounts if not readonly
  useEffect(() => {
    if (!readOnly && textareaRef.current && content === '') {
      textareaRef.current.focus()
    }
  }, [])

  const handleFocus = () => {
    setIsEditing(true)
  }
  
  const handleBlur = () => {
    // Delay blur to allow for menu interactions
    setTimeout(() => {
      setIsEditing(false)
    }, 100)
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <button
            onClick={() => !readOnly && setShowLanguageSelect(!showLanguageSelect)}
            className={cn(
              "text-sm font-mono text-gray-600 dark:text-gray-400",
              !readOnly && "hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
            )}
            disabled={readOnly}
          >
            {LANGUAGES.find(lang => lang.value === language)?.label || language}
          </button>
          
          {showLanguageSelect && !readOnly && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => handleLanguageChange(lang.value)}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>
      
      {/* Code Content */}
      <div className="relative p-0">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextAreaChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          placeholder="Type your code here..."
          className="w-full h-auto min-h-[100px] p-3 bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200"
          style={{ 
            fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
            tabSize: 2,
            caretColor: 'auto',
            zIndex: isEditing ? 2 : 1
          }}
          readOnly={readOnly}
          spellCheck={false}
          autoComplete="off"
        />
        
        {/* Syntax highlighted preview overlay - only visible when not editing */}
        {!isEditing && content && (
          <pre
            ref={previewRef}
            className="absolute inset-0 w-full min-h-[100px] p-3 bg-transparent border-none outline-none font-mono text-sm leading-relaxed pointer-events-none whitespace-pre-wrap break-words"
            style={{
              fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
              tabSize: 2,
              zIndex: 1
            }}
            dangerouslySetInnerHTML={{ __html: highlightSyntax(content, language) }}
          />
        )}
      </div>
    </div>
  )
}