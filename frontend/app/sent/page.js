"use client"
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AgentAssistant from '../components/AgentAssistant'
import {
  Square,
  CheckSquare,
  Paperclip,
  Filter,
  Search,
  Send,
  ChevronRight,
  Trash2,
  ArrowRight,
  Sparkles,
  Clock,
  AlertCircle,
  Loader2,
  Inbox,
  RefreshCw,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

const LABEL_COLORS = {
  Personal: 'bg-violet-50 text-violet-600',
  Social: 'bg-blue-50 text-blue-600',
  Promotions: 'bg-pink-50 text-pink-600',
  Updates: 'bg-emerald-50 text-emerald-600',
  Forums: 'bg-amber-50 text-amber-600',
  General: 'bg-slate-100 text-slate-600',
}

function importanceIcon(importance) {
  if (importance === 'high') return <AlertCircle size={12} className="text-red-500" />
  return <Sparkles size={12} className="text-emerald-500" />
}

function initials(name, email) {
  const source = (name || email || '?').trim()
  const parts = source.split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

function avatarGradient(seed) {
  const gradients = [
    'from-indigo-400 to-purple-500',
    'from-sky-400 to-blue-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
    'from-pink-400 to-rose-500',
    'from-violet-400 to-fuchsia-500',
  ]
  let hash = 0
  for (const ch of String(seed)) hash = (hash * 31 + ch.charCodeAt(0)) % gradients.length
  return gradients[Math.abs(hash) % gradients.length]
}

export default function SentPage() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [label, setLabel] = useState('All Labels')
  const [query, setQuery] = useState('')
  const [showAI, setShowAI] = useState(true)
  const [activeId, setActiveId] = useState(null)

  // Deletion States
  const [deletingIds, setDeletingIds] = useState(new Set())
  const [pendingDeleteIds, setPendingDeleteIds] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const router = useRouter()

  const fetchSent = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('access_token') : null

      if (!token) {
        throw new Error('No access token found. Please sign in again.')
      }

      const res = await fetch(`${API_BASE}/api/gmail/sent`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (res.status === 401 || res.status === 403) {
        window.localStorage.removeItem('access_token')
        router.push('/')
        throw new Error('Please sign in again.')
      }

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }

      const data = await res.json()
      const list = Array.isArray(data) ? data : data.messages || data.emails || []

      setMessages(list)
      setActiveId(list[0]?.id ?? null)
    } catch (err) {
      setError(err.message || 'Failed to load sent messages.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const labels = useMemo(() => {
    const unique = new Set(messages.map((m) => m.category).filter(Boolean))
    return ['All Labels', ...Array.from(unique)]
  }, [messages])

  const filtered = messages.filter((message) => {
    if (label !== 'All Labels' && message.category !== label) return false
    if (query.trim()) {
      const haystack = `${message.subject || ''} ${message.preview || ''} ${message.displayName || ''} ${message.displayEmail || ''}`.toLowerCase()
      if (!haystack.includes(query.trim().toLowerCase())) return false
    }
    return true
  })

  const activeMessage = useMemo(
    () => filtered.find((message) => message.id === activeId) || filtered[0] || null,
    [filtered, activeId]
  )
  const allSelected = filtered.length > 0 && filtered.every((message) => selected.has(message.id))

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) => {
      if (allSelected) return new Set()
      return new Set(filtered.map((message) => message.id))
    })
  }

  // Opens modal for confirmation
  const promptDelete = (ids) => {
    setPendingDeleteIds(ids)
  }

  // Handles actual deletion logic with animations & API sync
  const confirmDelete = async () => {
    if (!pendingDeleteIds || pendingDeleteIds.size === 0) return

    const targetIds = new Set(pendingDeleteIds)
    setIsDeleting(true)

    // Trigger row exit animation
    setDeletingIds(targetIds)

    try {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('access_token') : null

      // API request to delete
      if (token) {
        await fetch(`${API_BASE}/api/gmail/messages/delete`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
           body: JSON.stringify({
          message_ids: Array.from(selected),
        }),
        }).catch((e) => console.error('Delete API call warning:', e))
      }

      // Wait for exit animation to complete (300ms)
      setTimeout(() => {
        setMessages((prev) => prev.filter((message) => !targetIds.has(message.id)))
        setSelected((prev) => {
          const next = new Set(prev)
          targetIds.forEach((id) => next.delete(id))
          return next
        })

        if (activeId && targetIds.has(activeId)) {
          const remaining = filtered.find((message) => !targetIds.has(message.id))
          setActiveId(remaining?.id ?? null)
        }

        setDeletingIds(new Set())
        setPendingDeleteIds(null)
        setIsDeleting(false)
        fetchSent()
      }, 300)
    } catch (err) {
      console.error('Failed to delete messages', err)
      setDeletingIds(new Set())
      setPendingDeleteIds(null)
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="p-6 max-w-7xl mx-auto space-y-6 pb-32">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Sent
            </h1>
            <p className="mt-2 text-sm text-slate-500 max-w-2xl">
              Review recently sent messages, filter by category, and inspect the full content with AI summaries.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow transition"
            >
              <ArrowRight size={16} /> Back home
            </Link>
            <button
              onClick={fetchSent}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:from-indigo-500 hover:to-blue-500 transition"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/80 backdrop-blur shadow-sm overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between bg-white/60">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={toggleAll}
                disabled={filtered.length === 0}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
              <button
                onClick={() => promptDelete(selected)}
                disabled={selected.size === 0}
                className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={16} /> Delete {selected.size ? `(${selected.size})` : ''}
              </button>
              <button
                onClick={() => setShowAI(!showAI)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  showAI
                    ? 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700'
                    : 'border border-slate-200 bg-white text-slate-500'
                }`}
              >
                <Sparkles size={16} /> AI {showAI ? 'On' : 'Off'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 focus-within:ring-2 focus-within:ring-indigo-200">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search sent"
                  className="bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 w-32"
                />
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500">
                <Filter size={16} />
                <select
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="bg-transparent outline-none text-sm text-slate-700 cursor-pointer"
                >
                  {labels.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] p-5">
            <div className="space-y-3">
              {loading && (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-[26px] border border-slate-100 bg-slate-50 p-4 animate-pulse">
                      <div className="h-4 w-1/2 bg-slate-200 rounded mb-3" />
                      <div className="h-3 w-full bg-slate-200 rounded mb-2" />
                      <div className="h-3 w-2/3 bg-slate-200 rounded" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && error && (
                <div className="rounded-[26px] border border-red-100 bg-red-50 p-6 text-center">
                  <AlertCircle className="mx-auto mb-2 text-red-500" size={22} />
                  <p className="text-sm font-medium text-red-700">{error}</p>
                  <button
                    onClick={fetchSent}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 transition"
                  >
                    <RefreshCw size={14} /> Try again
                  </button>
                </div>
              )}

              {!loading && !error && filtered.length === 0 && (
                <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-10 text-center">
                  <Inbox className="mx-auto mb-3 text-slate-300" size={32} />
                  <p className="text-sm text-slate-500">No sent messages match this filter.</p>
                </div>
              )}

              {!loading &&
                !error &&
                filtered.map((message) => {
                  const isActive = message.id === activeMessage?.id
                  const badgeClass = LABEL_COLORS[message.category] || 'bg-slate-100 text-slate-600'
                  const isBeingDeleted = deletingIds.has(message.id)

                  return (
                    <div
                      key={message.id}
                      className={`group rounded-[26px] border p-4 transition-all duration-300 cursor-pointer ${
                        isBeingDeleted ? 'opacity-0 scale-95 translate-x-4 max-h-0 overflow-hidden py-0 my-0 border-0' : ''
                      } ${
                        isActive
                          ? 'border-indigo-300 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-sm'
                          : 'border-slate-100 bg-white hover:border-indigo-100 hover:bg-slate-50'
                      }`}
                      onClick={() => setActiveId(message.id)}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSelect(message.id)
                          }}
                          className="mt-1 rounded-full border border-slate-200 bg-white p-1.5 text-slate-400 transition hover:border-slate-300"
                        >
                          {selected.has(message.id) ? (
                            <CheckSquare size={16} className="text-indigo-600" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>

                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(
                            message.displayEmail || message.id
                          )} text-xs font-semibold text-white shadow-sm`}
                        >
                          {initials(message.displayName, message.displayEmail)}
                        </div>

                        <div className="min-w-0 flex-1" onClick={() => router.push(`/email/${message.id}`)}>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <h2 className="text-[15px] font-semibold text-slate-900 truncate flex items-center gap-1.5">
                                {importanceIcon(message.importance)}
                                {message.subject || '(no subject)'}
                              </h2>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className={`rounded-full px-2.5 py-1 font-medium ${badgeClass}`}>
                                  {message.category || 'General'}
                                </span>
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-600 font-medium">
                                  {message.status}
                                </span>
                                <span className="text-slate-400">To {message.displayName || message.displayEmail}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <Clock size={12} />
                              <span>{message.time}</span>
                              <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 transition" />
                            </div>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-500 truncate">{message.preview}</p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              promptDelete(new Set([message.id]))
                            }}
                            className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 opacity-0 transition group-hover:opacity-100 hover:bg-red-100"
                          >
                            Delete
                          </button>
                          {message.hasAttachment && <Paperclip size={16} className="text-slate-300" />}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>

            <div className="rounded-[26px] border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-5 lg:sticky lg:top-6 h-fit">
              {activeMessage ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Sent message preview
                      </p>
                      <h2 className="mt-2 text-lg font-bold text-slate-900 truncate">{activeMessage.subject}</h2>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                      {activeMessage.status}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">To</p>
                      <p className="mt-1.5 text-sm text-slate-800">
                        {activeMessage.displayName} · {activeMessage.displayEmail}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Sent</p>
                      <p className="mt-1.5 text-sm text-slate-800">{activeMessage.sentTime}</p>
                    </div>
                    <div className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Message</p>
                      <p className="mt-1.5 text-sm leading-7 text-slate-600 whitespace-pre-line">
                        {activeMessage.body}
                      </p>
                    </div>
                    {showAI && (
                      <div className="rounded-[20px] border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50 p-4">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-500">
                          <Sparkles size={12} /> AI summary
                        </div>
                        <p className="mt-1.5 text-sm text-violet-900">
                          {activeMessage.aiSummary || 'Summary not available for this message.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:from-indigo-500 hover:to-blue-500 transition">
                      <ArrowRight size={16} /> Open full thread
                    </button>
                    <button
                      onClick={() => promptDelete(new Set([activeMessage.id]))}
                      className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-[20px] border border-slate-100 bg-white p-8 text-center">
                  <Inbox className="mx-auto mb-2 text-slate-300" size={26} />
                  <p className="text-sm text-slate-500">Select a sent message to preview its full content.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {pendingDeleteIds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-opacity animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[28px] border border-slate-100 bg-white p-6 shadow-xl transition-all scale-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-red-600 font-semibold text-lg">
                <div className="p-2 bg-red-50 rounded-full">
                  <Trash2 size={20} />
                </div>
                Confirm Deletion
              </div>
              <button
                onClick={() => setPendingDeleteIds(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to delete {pendingDeleteIds.size === 1 ? 'this message' : `these ${pendingDeleteIds.size} messages`}? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setPendingDeleteIds(null)}
                disabled={isDeleting}
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 transition disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <AgentAssistant
        page="sent"
        title="Sent Assistant"
        subtitle="Follow-up, review, and refine sent mail"
        contextLabel="Sent"
        contextSummary={label !== 'All Labels' ? label : 'All sent mail'}
        itemCount={filtered.length}
        selectedMessageIds={Array.from(selected)}
        allMessageIds={filtered.map((m) => m.id)}
        buttons={[
          {
            id: 'follow-up',
            label: 'Follow-up ideas',
            description: 'Suggest what to send next',
            icon: Sparkles,
            reply: 'I’m reviewing the sent context and suggesting practical follow-up actions.',
          },
          {
            id: 'review-tone',
            label: 'Review tone',
            description: 'Check message tone and clarity',
            icon: Search,
            reply: 'I’m reviewing the current sent context for tone and clarity improvements.',
          },
          {
            id: 'draft-reply',
            label: 'Draft follow-up',
            description: 'Create a polished follow-up message',
            icon: Send,
            reply: 'I’m drafting a follow-up based on the current sent conversation context.',
          },
        ]}
      />
    </div>
  )
}