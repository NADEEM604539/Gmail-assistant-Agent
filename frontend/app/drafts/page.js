"use client"
import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  PenSquare,
  ArrowRight,
  Sparkles,
  MoreHorizontal,
  Trash2,
  Tag,
  CheckSquare,
  Square,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { DRAFTS as INITIAL_DRAFTS } from './data'

const LABELS = ['All Labels', 'Client', 'HR', 'Meetings', 'Finance']

export default function DraftsPage() {
  const [label, setLabel] = useState('All Labels')
  const [drafts, setDrafts] = useState(INITIAL_DRAFTS)
  const [selected, setSelected] = useState(new Set())
  const [showAI, setShowAI] = useState(true)
  const [activeDraftId, setActiveDraftId] = useState(INITIAL_DRAFTS[0]?.id || null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [showBulkDelete, setShowBulkDelete] = useState(false)

  const filtered = drafts.filter((draft) => label === 'All Labels' || draft.label === label)
  const activeDraft = filtered.find((draft) => draft.id === activeDraftId) ?? filtered[0]
  const allSelected = filtered.length > 0 && filtered.every((draft) => selected.has(draft.id))

  const selectedCount = selected.size
  const deleteTarget = confirmDeleteId || (showBulkDelete ? 'bulk' : null)

  const draftSummary = useMemo(() => {
    if (!activeDraft) return null
    return {
      Subject: activeDraft.subject,
      Recipients: activeDraft.recipients,
      Label: activeDraft.label,
      Updated: activeDraft.updated,
      Status: activeDraft.draftStatus,
    }
  }, [activeDraft])

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
      return new Set(filtered.map((draft) => draft.id))
    })
  }

  const handleDelete = (id) => {
    setConfirmDeleteId(id)
  }

  const handleBulkDelete = () => {
    setShowBulkDelete(true)
  }

  const confirmDelete = () => {
    if (deleteTarget === 'bulk') {
      setDrafts((prev) => prev.filter((draft) => !selected.has(draft.id)))
      setSelected(new Set())
      setShowBulkDelete(false)
    } else {
      setDrafts((prev) => prev.filter((draft) => draft.id !== deleteTarget))
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(deleteTarget)
        return next
      })
      if (activeDraftId === deleteTarget) {
        const nextActive = filtered.find((draft) => draft.id !== deleteTarget)?.id
        setActiveDraftId(nextActive || null)
      }
      setConfirmDeleteId(null)
    }
  }

  const cancelDelete = () => {
    setConfirmDeleteId(null)
    setShowBulkDelete(false)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#202124]">Drafts</h1>
          <p className="mt-2 text-sm text-[#5f6368] max-w-2xl">Review your in-progress email drafts, confirm deletion before removing them, and open each draft for detailed controls.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/drafts/new" className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#1a73e825] hover:bg-[#1662d9] transition">
            <PenSquare size={16} /> New draft
          </Link>
          <button className="inline-flex items-center gap-2 rounded-full bg-[#fbbc04] px-4 py-2 text-sm font-semibold text-[#202124] transition hover:bg-[#f7b521]">
            <ArrowRight size={16} /> Continue
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#e8eaed] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#f1f3f4] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={toggleAll} className="inline-flex items-center gap-2 rounded-full border border-[#e8eaed] bg-[#f8fafc] px-4 py-2 text-sm text-[#202124] hover:bg-[#edf2f7] transition">
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
            <button onClick={handleBulkDelete} disabled={!selectedCount} className="inline-flex items-center gap-2 rounded-full border border-[#e8eaed] bg-white px-4 py-2 text-sm text-[#b02129] transition hover:bg-[#fef0ef] disabled:cursor-not-allowed disabled:opacity-50">
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
              <select value={label} onChange={(e) => setLabel(e.target.value)} className="bg-transparent outline-none text-sm text-[#5f6368]">
                {LABELS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <button onClick={() => setShowAI(!showAI)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${showAI ? 'bg-[#e8def8] text-[#5f2eea]' : 'border border-[#e8eaed] bg-white text-[#5f6368]'}`}>
              <Sparkles size={16} /> AI {showAI ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr] p-5">
          <div className="space-y-4">
            {filtered.map((draft) => {
              const isActive = draft.id === activeDraft?.id
              return (
                <div key={draft.id} className={`group rounded-[26px] border p-4 transition ${isActive ? 'border-[#1a73e8] bg-[#eef3ff]' : 'border-[#f1f3f4] bg-white hover:border-[#d2e8ff] hover:bg-[#f6f9ff]'}`}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleSelect(draft.id)} className="rounded-full border border-[#e8eaed] bg-white p-2 text-[#5f6368] transition hover:border-[#c7cdd6]">
                      {selected.has(draft.id) ? <CheckSquare size={18} className="text-[#1a73e8]" /> : <Square size={18} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <Link href={`/drafts/${draft.id}`} className="block min-w-0">
                            <h2 className="text-base font-semibold text-[#202124] truncate">{draft.subject}</h2>
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
                      <button onClick={() => handleDelete(draft.id)} className="rounded-full bg-[#f8d7da] px-3 py-1.5 text-xs font-semibold text-[#a72a2f] transition hover:bg-[#f3b6bb]">
                        Delete
                      </button>
                      <Link href={`/drafts/${draft.id}`} className="text-xs font-semibold text-[#1a73e8] hover:underline">Open</Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="rounded-[26px] border border-[#f1f3f4] bg-[#f8fafc] p-5">
            {activeDraft ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[#5f6368]">Draft preview</p>
                    <h2 className="mt-3 text-xl font-semibold text-[#202124] truncate">{activeDraft.subject}</h2>
                  </div>
                  <span className="rounded-full bg-[#fff4dc] px-3 py-1 text-xs font-semibold text-[#9a5800]">{activeDraft.draftStatus}</span>
                </div>
                <div className="mt-5 grid gap-3">
                  <div className="rounded-[24px] border border-[#e8eaed] bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#5f6368]">Recipients</p>
                    <p className="mt-2 text-sm text-[#202124]">{activeDraft.recipients}</p>
                  </div>
                  <div className="rounded-[24px] border border-[#e8eaed] bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#5f6368]">Last updated</p>
                    <p className="mt-2 text-sm text-[#202124]">{activeDraft.updated}</p>
                  </div>
                  <div className="rounded-[24px] border border-[#e8eaed] bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#5f6368]">Message</p>
                    <p className="mt-2 text-sm leading-7 text-[#5f6368]">{activeDraft.body}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link href={`/drafts/${activeDraft.id}`} className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1662d9] transition">
                    <ArrowRight size={16} /> Open details
                  </Link>
                  <button onClick={() => handleDelete(activeDraft.id)} className="inline-flex items-center gap-2 rounded-full bg-[#f8d7da] px-4 py-2 text-sm font-semibold text-[#a72a2f] hover:bg-[#f3b6bb] transition">
                    <Trash2 size={16} /> Delete draft
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-[24px] border border-[#e8eaed] bg-white p-6 text-center">
                <p className="text-sm text-[#5f6368]">No drafts match this filter. Select a different label or create a new draft.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {(confirmDeleteId || showBulkDelete) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#202124]">Confirm delete</p>
                <p className="mt-2 text-sm text-[#5f6368]">This action will permanently delete {showBulkDelete ? `${selectedCount} selected drafts` : 'this draft'}. You cannot undo it.</p>
              </div>
              <div className="rounded-full bg-[#f8d7da] px-3 py-1 text-xs font-semibold text-[#a72a2f]">Danger zone</div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button onClick={cancelDelete} className="rounded-full border border-[#e8eaed] bg-white px-4 py-2 text-sm text-[#5f6368] hover:bg-[#f8fafc] transition">Cancel</button>
              <button onClick={confirmDelete} className="rounded-full bg-[#d93025] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b31412] transition">Delete permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
