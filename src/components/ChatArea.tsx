import { useRef, useEffect } from 'react'
import type { Message } from '../types'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'

interface Props {
  messages: Message[]
  streamingMessage: Message | null
  inputValue: string
  onInputChange: (v: string) => void
  onSend: () => void
  sending: boolean
  conversationTitle?: string
}

const SUGGESTIONS = [
  'How do I perform a Manual J load calculation?',
  'What are the signs of refrigerant undercharge?',
  'Explain duct leakage testing procedures',
  'How do I calculate SEER vs EER for a job quote?',
  'What is the ideal static pressure for a residential system?',
  'Walk me through diagnosing a heat pump in defrost issues',
]

export default function ChatArea({
  messages,
  streamingMessage,
  inputValue,
  onInputChange,
  onSend,
  sending,
  conversationTitle,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMessage])

  const allMessages = streamingMessage
    ? [...messages, streamingMessage]
    : messages

  return (
    <div className="chat-area">
      <div className="chat-header">
        <h2 className="chat-title">{conversationTitle ?? 'Doc Comfort\'s Brain'}</h2>
        <span className="chat-status">
          <span className="status-dot" />
          Online
        </span>
      </div>

      <div className="chat-messages">
        {allMessages.length === 0 ? (
          <div className="chat-welcome">
            <div className="welcome-icon">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="27" fill="#1e3a6e" stroke="#2563eb" strokeWidth="1.5"/>
                <path d="M28 14C20.27 14 14 20.27 14 28C14 30.97 14.91 33.73 16.49 36.01L14 42L20.32 39.52C22.52 40.93 25.16 41.77 28 41.77C35.73 41.77 42 35.5 42 28C42 20.27 35.73 14 28 14Z" fill="white" fillOpacity="0.1" stroke="white" strokeWidth="1.5"/>
                <circle cx="22" cy="28" r="2.5" fill="white" fillOpacity="0.8"/>
                <circle cx="28" cy="28" r="2.5" fill="white" fillOpacity="0.8"/>
                <circle cx="34" cy="28" r="2.5" fill="white" fillOpacity="0.8"/>
              </svg>
            </div>
            <h3 className="welcome-title">Hi, I'm Doc Comfort</h3>
            <p className="welcome-desc">
              Your expert AI assistant for HVAC, refrigeration, and building science.
              Ask me anything — diagnostics, load calculations, code questions, or best practices.
            </p>
            <div className="suggestions-grid">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  className="suggestion-chip"
                  onClick={() => onInputChange(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          allMessages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              streaming={streamingMessage?.id === msg.id}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput
        value={inputValue}
        onChange={onInputChange}
        onSend={onSend}
        disabled={sending}
      />
    </div>
  )
}
