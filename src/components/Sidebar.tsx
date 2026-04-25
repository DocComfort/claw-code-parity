import { useState } from 'react'
import type { Conversation } from '../types'
import { SquarePen as PenSquare, Trash2, MessageSquare, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'

interface SidebarProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onSignOut: () => void
  userEmail: string | undefined
  collapsed: boolean
  onToggle: () => void
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function groupConversations(conversations: Conversation[]) {
  const today: Conversation[] = []
  const yesterday: Conversation[] = []
  const older: Conversation[] = []
  const now = new Date()

  for (const c of conversations) {
    const diffDays = Math.floor((now.getTime() - new Date(c.updated_at).getTime()) / 86400000)
    if (diffDays === 0) today.push(c)
    else if (diffDays === 1) yesterday.push(c)
    else older.push(c)
  }

  return { today, yesterday, older }
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onSignOut,
  userEmail,
  collapsed,
  onToggle,
}: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { today, yesterday, older } = groupConversations(conversations)

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirmDelete === id) {
      onDelete(id)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
      setTimeout(() => setConfirmDelete(null), 3000)
    }
  }

  const renderGroup = (label: string, items: Conversation[]) => {
    if (items.length === 0) return null
    return (
      <div className="sidebar-group" key={label}>
        {!collapsed && <div className="sidebar-group-label">{label}</div>}
        {items.map(c => (
          <div
            key={c.id}
            className={`sidebar-item ${activeId === c.id ? 'active' : ''}`}
            onClick={() => onSelect(c.id)}
            onMouseEnter={() => setHoveredId(c.id)}
            onMouseLeave={() => { setHoveredId(null); setConfirmDelete(null) }}
            title={collapsed ? c.title : undefined}
          >
            <MessageSquare size={15} className="sidebar-item-icon" />
            {!collapsed && (
              <>
                <div className="sidebar-item-content">
                  <span className="sidebar-item-title">{c.title}</span>
                  <span className="sidebar-item-date">{formatDate(c.updated_at)}</span>
                </div>
                {hoveredId === c.id && (
                  <button
                    className={`sidebar-delete ${confirmDelete === c.id ? 'confirm' : ''}`}
                    onClick={e => handleDelete(e, c.id)}
                    title={confirmDelete === c.id ? 'Click again to confirm' : 'Delete'}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-brand">
            <div className="brand-dot" />
            <span className="brand-name">Doc Comfort's Brain</span>
          </div>
        )}
        <div className="sidebar-header-actions">
          <button className="icon-btn" onClick={onNew} title="New Conversation">
            <PenSquare size={16} />
          </button>
          <button className="icon-btn" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      <div className="sidebar-body">
        {conversations.length === 0 ? (
          !collapsed && (
            <div className="sidebar-empty">
              <MessageSquare size={24} opacity={0.3} />
              <p>No conversations yet</p>
              <p>Start chatting to get started</p>
            </div>
          )
        ) : (
          <>
            {renderGroup('Today', today)}
            {renderGroup('Yesterday', yesterday)}
            {renderGroup('Earlier', older)}
          </>
        )}
      </div>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-user-email">{userEmail}</div>
        )}
        <button className="icon-btn danger" onClick={onSignOut} title="Sign Out">
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
