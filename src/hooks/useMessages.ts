import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Message } from '../types'

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!conversationId) {
      setMessages([])
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
    setLoading(false)
  }, [conversationId])

  useEffect(() => { void load() }, [load])

  const addMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg])
  }

  const updateLastAssistantMessage = (content: string) => {
    setMessages(prev => {
      const copy = [...prev]
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i]!.role === 'assistant') {
          copy[i] = { ...copy[i]!, content }
          return copy
        }
      }
      return copy
    })
  }

  const insertUserMessage = async (conversationId: string, content: string): Promise<Message | null> => {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, role: 'user', content })
      .select()
      .single()
    if (!error && data) {
      addMessage(data)
      return data
    }
    return null
  }

  const insertAssistantMessage = async (conversationId: string, content: string): Promise<Message | null> => {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, role: 'assistant', content })
      .select()
      .single()
    if (!error && data) {
      addMessage(data)
      return data
    }
    return null
  }

  return {
    messages,
    loading,
    insertUserMessage,
    insertAssistantMessage,
    updateLastAssistantMessage,
    addMessage,
  }
}
