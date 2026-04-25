import { useRef, useEffect, KeyboardEvent } from 'react'
import { Send } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled: boolean
  placeholder?: string
}

export default function ChatInput({ value, onChange, onSend, disabled, placeholder }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [value])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && value.trim()) onSend()
    }
  }

  return (
    <div className="chat-input-wrapper">
      <div className="chat-input-box">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Ask Doc Comfort anything about HVAC, load calcs, diagnostics...'}
          disabled={disabled}
          rows={1}
          className="chat-textarea"
        />
        <button
          className={`send-btn ${value.trim() && !disabled ? 'active' : ''}`}
          onClick={onSend}
          disabled={!value.trim() || disabled}
          title="Send (Enter)"
        >
          <Send size={18} />
        </button>
      </div>
      <p className="chat-input-hint">
        Enter to send &middot; Shift+Enter for new line
      </p>
    </div>
  )
}
