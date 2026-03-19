import { useState } from 'react'

interface DiffViewerProps {
  diff: string | null
  isNewFile?: boolean
}

export default function DiffViewer({ diff, isNewFile = false }: DiffViewerProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!diff && !isNewFile) {
    return null
  }

  const lines = diff ? diff.split('\n') : []

  return (
    <div className="glass rounded-lg overflow-hidden border border-white/10">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-black/20 border-b border-white/10 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{isExpanded ? '📉' : '📈'}</span>
          <span className="text-sm font-medium text-slate-300">
            {isNewFile ? 'New File' : 'Code Changes'}
          </span>
          {diff && (
            <span className="text-xs text-slate-500">
              {lines.filter(l => l.startsWith('+') || l.startsWith('-')).length} lines changed
            </span>
          )}
        </div>
        <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Diff Content */}
      {isExpanded && (
        <div className="overflow-x-auto">
          <pre className="text-xs font-mono leading-relaxed">
            {isNewFile ? (
              <div className="p-4 text-slate-400">
                <div className="text-green-400">+ New file created</div>
                {diff && (
                  <div className="mt-2 border-t border-white/10 pt-2">
                    {diff}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4">
                {lines.map((line, index) => {
                  const lineClass = getLineClass(line)
                  const showLineNumber = line.startsWith('+') || line.startsWith('-') || line.startsWith(' ')
                  
                  return (
                    <div
                      key={index}
                      className={`flex ${lineClass}`}
                    >
                      {showLineNumber && (
                        <span className="w-12 flex-shrink-0 text-right pr-3 text-slate-600 select-none border-r border-white/5 mr-3">
                          {index + 1}
                        </span>
                      )}
                      <span className="flex-1 whitespace-pre">
                        {line}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </pre>
        </div>
      )}
    </div>
  )
}

/**
 * Get CSS classes for diff line type
 */
function getLineClass(line: string): string {
  if (line.startsWith('+++') || line.startsWith('---')) {
    return 'bg-blue-500/10 text-blue-300 font-semibold'
  }
  
  if (line.startsWith('@@')) {
    return 'bg-purple-500/10 text-purple-300 font-semibold'
  }
  
  if (line.startsWith('+')) {
    return 'bg-green-500/10 text-green-300'
  }
  
  if (line.startsWith('-')) {
    return 'bg-red-500/10 text-red-300'
  }
  
  return 'text-slate-400'
}
