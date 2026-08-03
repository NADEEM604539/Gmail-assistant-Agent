"use client"
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AgentAssistant from '../components/AgentAssistant'
import NewDraftPopup from '../components/NewDraftPopup'
import {
  PenSquare,
  ArrowRight,
  Sparkles,
  MoreHorizontal,
  Trash2,
  CheckSquare,
  Square,
  Filter,
  Search,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  FileText,
} from 'lucide-react'

const LABELS = ['All Labels', 'Client', 'HR', 'Meetings', 'Finance']

// Base URL of the API host, e.g. NEXT_PUBLIC_BASE_URL=https://mail.example.com
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''
const DRAFTS_ENDPOINT = `${BASE_URL}/api/gmail/draft`
const DELETE_ENDPOINT = `${BASE_URL}/api/gmail/messages/delete`

// --------------------------------------------------
// Maps the backend "Short_email_parser" shape into the
// shape this UI renders.
// --------------------------------------------------
function mapDraftFromApi(raw) {
  const toList = Array.isArray(raw.to) ? raw.to : []
  const recipients =
    toList.map((r) => r.name || r.email).filter(Boolean).join(', ') ||
    'No recipients'

  return {
    id: raw.id,
    subject: raw.subject || '(No subject)',
    recipients,
    label: raw.category || 'General',
    updated: raw.time || raw.sentTime || '',
    draftStatus: raw.status || 'Draft',
    preview: raw.preview || '',
    body: raw.body || '',
  }
}

// --------------------------------------------------
// Skeleton loader piece for loading state
// --------------------------------------------------
function ShimmerBlock({ className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-full bg-[#eef1f4] ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  )
}

function DraftCardSkeleton() {
  return (
    <div className="rounded-[26px] border border-[#f1f3f4] bg-white p-4">
      <div className="flex items-start gap-3">
        <ShimmerBlock className="h-9 w-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <ShimmerBlock className="h-4 w-2/5" />
            <ShimmerBlock className="h-3 w-16" />
          </div>
          <div className="flex gap-2">
            <ShimmerBlock className="h-5 w-16" />
            <ShimmerBlock className="h-5 w-20" />
          </div>
          <ShimmerBlock className="h-3 w-full" />
          <ShimmerBlock className="h-3 w-4/5" />
        </div>
      </div>
    </div>
  )
}

export default function DraftsPage() {
  const router = useRouter()

  const [label, setLabel] = useState('All Labels')
  const [drafts, setDrafts] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [showAI, setShowAI] = useState(true)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showNewDraftPopup, setShowNewDraftPopup] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Loading / error state for the live fetch
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null) // 'auth' | 'fetch' | null

  const fetchDrafts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const accessToken =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('access_token')
          : null

      if (!accessToken) {
        setError('auth')
        setDrafts([])
        return
      }

      const res = await fetch(DRAFTS_ENDPOINT, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('access_token')
        router.push('/')
        setError('auth')
        setDrafts([])
        return
      }

      if (!res.ok) {
        setError('fetch')
        setDrafts([])
        return
      }

      const data = await res.json()
      const rawList = Array.isArray(data)
        ? data
        : data.drafts || data.messages || data.results || []

      const mapped = rawList.map(mapDraftFromApi)
      setDrafts(mapped)
    } catch (err) {
      setError('fetch')
      setDrafts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDrafts()
  }, [fetchDrafts])

  const filtered = drafts.filter((draft) => label === 'All Labels' || draft.label === label)
  const allSelected = filtered.length > 0 && filtered.every((draft) => selected.has(draft.id))
  const selectedCount = selected.size

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(() => {
      if (allSelected) return new Set()
      return new Set(filtered.map((draft) => draft.id))
    })
  }

  const manageDelete = async () => {
    if (selected.size === 0) return

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

    if (!token) {
      setError('auth')
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(DELETE_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_ids: Array.from(selected),
        }),
      })

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('access_token')
        router.push('/')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to permanently delete emails')
      }

      await fetchDrafts()
      setSelected(new Set())
      setShowBulkDeleteModal(false)
    } catch (err) {
      console.error(err)
      alert('Unable to permanently delete emails.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-32">
      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#202124]">Drafts</h1>
          <p className="mt-2 text-sm text-[#5f6368] max-w-2xl">
            Review your in-progress email drafts, select multiple drafts to delete them permanently, or open individual drafts to continue editing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowNewDraftPopup(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#1a73e825] hover:bg-[#1662d9] transition"
          >
            <PenSquare size={16} /> New draft
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-[#fbbc04] px-4 py-2 text-sm font-semibold text-[#202124] transition hover:bg-[#f7b521]">
            <ArrowRight size={16} /> Continue
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#e8eaed] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#f1f3f4] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={toggleAll}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-[#e8eaed] bg-[#f8fafc] px-4 py-2 text-sm text-[#202124] hover:bg-[#edf2f7] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              disabled={!selectedCount || isDeleting}
              className="inline-flex items-center gap-2 rounded-full border border-[#e8eaed] bg-white px-4 py-2 text-sm text-[#b02129] transition hover:bg-[#fef0ef] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} /> Delete {selectedCount ? `(${selectedCount})` : ''}
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-[#e8eaed] bg-white px-4 py-2 text-sm text-[#202124] hover:bg-[#f8fafc] transition">
              <MoreHorizontal size={16} /> More
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e8eaed] bg-[#f8fafc] px-4 py-2 text-sm text-[#5f6368]">
              <Search size={16} /> Search drafts
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e8eaed] bg-[#f8fafc] px-4 py-2 text-sm text-[#5f6368]">
              <Filter size={16} />
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="bg-transparent outline-none text-sm text-[#5f6368]"
              >
                {LABELS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowAI(!showAI)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                showAI ? 'bg-[#e8def8] text-[#5f2eea]' : 'border border-[#e8eaed] bg-white text-[#5f6368]'
              }`}
            >
              <Sparkles size={16} /> AI {showAI ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-5 flex flex-col gap-3 rounded-[22px] border border-[#f8d7da] bg-[#fef7f7] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#a72a2f]" />
              <div>
                <p className="text-sm font-semibold text-[#a72a2f]">
                  {error === 'auth' ? 'You need to sign in to view your drafts.' : "Couldn't load your drafts."}
                </p>
                <p className="mt-1 text-xs text-[#8a5458]">
                  {error === 'auth'
                    ? 'Your session token is missing or has expired.'
                    : 'Something went wrong while contacting the server. Please try again.'}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              {error === 'auth' ? (
                <button
                  onClick={() => router.push('/login')}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1662d9] transition"
                >
                  Sign in
                </button>
              ) : (
                <button
                  onClick={fetchDrafts}
                  className="inline-flex items-center gap-2 rounded-full bg-[#d93025] px-4 py-2 text-xs font-semibold text-white hover:bg-[#b31412] transition"
                >
                  <RefreshCw size={14} /> Retry
                </button>
              )}
            </div>
          </div>
        )}

        <div className="p-5 space-y-4">
          {loading ? (
            <>
              <DraftCardSkeleton />
              <DraftCardSkeleton />
              <DraftCardSkeleton />
            </>
          ) : (
            filtered.map((draft) => (
              <div
                key={draft.id}
                className="group rounded-[26px] border border-[#f1f3f4] bg-white p-4 hover:border-[#d2e8ff] hover:bg-[#f6f9ff] transition"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleSelect(draft.id)}
                    className="rounded-full border border-[#e8eaed] bg-white p-2 text-[#5f6368] transition hover:border-[#c7cdd6]"
                  >
                    {selected.has(draft.id) ? (
                      <CheckSquare size={18} className="text-[#1a73e8]" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <Link href={`/email/${draft.id}`} className="block min-w-0">
                          <h2 className="text-base font-semibold text-[#202124] truncate hover:text-[#1a73e8]">
                            {draft.subject}
                          </h2>
                        </Link>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#5f6368]">
                          <span className="rounded-full bg-[#f1f3f4] px-2.5 py-1">{draft.label}</span>
                          <span className="rounded-full bg-[#fff4dc] px-2.5 py-1 text-[#9a5800]">{draft.draftStatus}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#5f6368]">
                        <span>{draft.updated}</span>
                        <ChevronRight size={14} className="text-[#9aa0a6]" />
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#5f6368]">{draft.preview}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Link
                      href={`/email/${draft.id}`}
                      className="text-xs font-semibold text-[#1a73e8] hover:underline"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="rounded-[24px] border border-[#e8eaed] bg-white p-6 text-center">
              <p className="text-sm text-[#5f6368]">No drafts match this filter. Select a different label or create a new draft.</p>
            </div>
          )}
        </div>
      </div>

      <AgentAssistant
        page="drafts"
        title="Draft Assistant"
        subtitle="Polish, shorten, and prepare drafts"
        contextLabel="Drafts"
        contextSummary={label !== 'All Labels' ? label : 'Draft workspace'}
        itemCount={drafts.length}
        selectedMessageIds={Array.from(selected)}
        allMessageIds={filtered.map((d) => d.id)}
        buttons={[
          {
            id: 'rewrite',
            label: 'Rewrite',
            description: 'Make the draft clearer',
            icon: PenSquare,
            reply: 'I’m refining the draft to improve clarity and flow.',
          },
          {
            id: 'shorten',
            label: 'Shorten',
            description: 'Trim the draft for brevity',
            icon: Sparkles,
            reply: 'I’m tightening the draft so it reads more concisely.',
          },
          {
            id: 'tone',
            label: 'Tone shift',
            description: 'Change the tone to match your style',
            icon: FileText,
            reply: 'I’m adjusting the draft tone to better match your intent.',
          },
        ]}
      />

      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#202124]">Confirm delete</p>
                <p className="mt-2 text-sm text-[#5f6368]">
                  This action will permanently delete {selectedCount} selected {selectedCount === 1 ? 'draft' : 'drafts'}. You cannot undo it.
                </p>
              </div>
              <div className="rounded-full bg-[#f8d7da] px-3 py-1 text-xs font-semibold text-[#a72a2f]">Danger zone</div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isDeleting}
                className="rounded-full border border-[#e8eaed] bg-white px-4 py-2 text-sm text-[#5f6368] hover:bg-[#f8fafc] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={manageDelete}
                disabled={isDeleting}
                className="rounded-full bg-[#d93025] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b31412] transition disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      <NewDraftPopup
        open={showNewDraftPopup}
        onClose={() => setShowNewDraftPopup(false)}
      />
    </div>
  )
}