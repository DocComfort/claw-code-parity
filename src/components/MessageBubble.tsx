import { useEffect, useRef } from 'react'
import type { Message } from '../types'

interface Props {
  message: Message
  streaming?: boolean
}

function formatContent(content: string): string {
  return content
}

function UserInitial({ email }: { email?: string }) {
  const char = email ? email[0]!.toUpperCase() : 'U'
  return <div className="avatar user-avatar">{char}</div>
}

function AssistantAvatar() {
  return (
    <div className="avatar assistant-avatar">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="8.5" fill="#2563eb" stroke="#3b82f6" strokeWidth="0.5"/>
        <path d="M9 4.5C6.52 4.5 4.5 6.52 4.5 9C4.5 10.04 4.85 11 5.44 11.78L4.5 13.5L6.37 12.72C7.1 13.22 7.99 13.5 9 13.5C11.48 13.5 13.5 11.48 13.5 9C13.5 6.52 11.48 4.5 9 4.5Z" fill="white" fillOpacity="0.9"/>
        <circle cx="7" cy="9" r="0.85" fill="#2563eb"/>
        <circle cx="9" cy="9" r="0.85" fill="#2563eb"/>
        <circle cx="11" cy="9" r="0.85" fill="#2563eb"/>
      </svg>
    </div>
  )
}

function TypingDots() {
  return (
    <span className="typing-dots">
      <span /><span /><span />
    </span>
  )
}

export default function MessageBubble({ message, streaming }: Props) {
  const isUser = message.role === 'user'
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (streaming && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [message.content, streaming])

  return (
    <div className={`message-row ${isUser ? 'user-row' : 'assistant-row'}`}>
      {!isUser && <AssistantAvatar />}
      <div className={`bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
        <div ref={contentRef} className="bubble-content">
          {message.content ? (
            <pre className="bubble-text">{formatContent(message.content)}</pre>
          ) : streaming ? (
            <TypingDots />
          ) : null}
          {streaming && message.content && <span className="cursor-blink" />}
        </div>
      </div>
      {isUser && <UserInitial />}
    </div>
  )
}
