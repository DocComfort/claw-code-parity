import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Conversation } from '../types'

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    setConversations(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => { void load() }, [load])

  const createConversation = async (title = 'New Conversation'): Promise<Conversation | null> => {
    if (!userId) return null
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId, title })
      .select()
      .single()
    if (!error && data) {
      setConversations(prev => [data, ...prev])
      return data
    }
    return null
  }

  const updateTitle = async (id: string, title: string) => {
    const { data } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', id)
      .select()
      .single()
    if (data) {
      setConversations(prev => prev.map(c => c.id === id ? data : c))
    }
  }

  const deleteConversation = async (id: string) => {
    await supabase.from('conversations').delete().eq('id', id)
    setConversations(prev => prev.filter(c => c.id !== id))
  }

  const refreshConversations = load

  return { conversations, loading, createConversation, updateTitle, deleteConversation, refreshConversations }
}
