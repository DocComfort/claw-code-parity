import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useConversations } from './hooks/useConversations'
import { useMessages } from './hooks/useMessages'
import AuthPage from './pages/AuthPage'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import type { Message } from './types'
import './App.css'

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`

export default function App() {
  const { user, loading, signOut } = useAuth()
  const { conversations, createConversation, updateTitle, deleteConversation } = useConversations(user?.id)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const { messages, insertUserMessage, insertAssistantMessage } = useMessages(activeConversationId)
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const activeConversation = conversations.find(c => c.id === activeConversationId)

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading Doc Comfort's Brain...</p>
      </div>
    )
  }

  if (!user) return <AuthPage />

  const handleNewConversation = async () => {
    const conv = await createConversation()
    if (conv) setActiveConversationId(conv.id)
  }

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id)
    setStreamingMessage(null)
  }

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id)
    if (activeConversationId === id) setActiveConversationId(null)
  }

  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || sending) return

    setInputValue('')
    setSending(true)

    let convId = activeConversationId

    // Create a new conversation if none selected
    if (!convId) {
      const conv = await createConversation(text.slice(0, 60))
      if (!conv) { setSending(false); return }
      convId = conv.id
      setActiveConversationId(convId)
    }

    // Save user message
    await insertUserMessage(convId, text)

    // Build history for context
    const history = messages.map(m => ({ role: m.role, content: m.content }))
    history.push({ role: 'user', content: text })

    // Placeholder streaming message
    const placeholderId = `streaming-${Date.now()}`
    const placeholder: Message = {
      id: placeholderId,
      conversation_id: convId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    }
    setStreamingMessage(placeholder)

    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ messages: history }),
      })

      if (!response.ok || !response.body) {
        throw new Error('Agent request failed')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })

        // Parse SSE lines
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data) as { delta?: string; content?: string }
              if (parsed.delta) {
                accumulated += parsed.delta
                setStreamingMessage(prev => prev ? { ...prev, content: accumulated } : null)
              } else if (parsed.content) {
                accumulated = parsed.content
                setStreamingMessage(prev => prev ? { ...prev, content: accumulated } : null)
              }
            } catch { /* not JSON */ }
          }
        }
      }

      // Persist final assistant message
      await insertAssistantMessage(convId, accumulated)

      // Update conversation title after first exchange
      if (messages.length === 0) {
        const shortTitle = text.slice(0, 60) + (text.length > 60 ? '...' : '')
        await updateTitle(convId, shortTitle)
      }

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong'
      await insertAssistantMessage(convId, `Sorry, I encountered an error: ${errMsg}. Please try again.`)
    } finally {
      setStreamingMessage(null)
      setSending(false)
    }
  }

  return (
    <div className="app-layout">
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        onDelete={handleDeleteConversation}
        onSignOut={signOut}
        userEmail={user.email}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
      />
      <main className="main-content">
        {activeConversationId ? (
          <ChatArea
            messages={messages}
            streamingMessage={streamingMessage}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={handleSend}
            sending={sending}
            conversationTitle={activeConversation?.title}
          />
        ) : (
          <ChatArea
            messages={[]}
            streamingMessage={null}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={handleSend}
            sending={sending}
          />
        )}
      </main>
    </div>
  )
}
