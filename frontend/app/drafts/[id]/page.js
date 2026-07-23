"use client"
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Send, Save, Trash2, Sparkles, Tag, Clock, MoreHorizontal } from 'lucide-react'
import { DRAFTS } from '../data'

export default function DraftDetailPage() {
  const params = useParams()
  const draft = DRAFTS.find((item) => item.id === params?.id)
  const [body, setBody] = useState(draft?.body || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const draftMeta = useMemo(() => ({
    Updated: draft?.updated || 'Unknown',
    Label: draft?.label || 'None',
    Status: draft?.draftStatus || 'Draft',
    Recipients: draft?.recipients || '—',
  }), [draft])

  if (!draft) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Link href="/drafts" className="text-sm text-[#1a73e8] hover:underline">← Back to drafts</Link>
        <div className="mt-8 rounded-3xl border border-[#e8eaed] bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-[#202124]">Draft not found</h1>
          <p className="mt-2 text-sm text-[#5f6368]">Double-check the draft ID or return to the main drafts list.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/drafts" className="inline-flex items-center gap-2 text-sm text-[#1a73e8] hover:underline">
            <ArrowLeft size={16} /> Back to drafts
          </Link>
          <h1 className="mt-4 text-3xl font-semibold text-[#202124]">{draft.subject}</h1>
          <p className="mt-2 text-sm text-[#5f6368]">Open this draft for full draft controls, status, and send options.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1662d9]">
            <Send size={16} /> Send draft
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-[#e8eaed] bg-white px-4 py-2 text-sm text-[#202124] transition hover:bg-[#f8fafc]">
            <Save size={16} /> Save changes
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="inline-flex items-center gap-2 rounded-full border border-[#f28b82] bg-[#fce8e6] px-4 py-2 text-sm font-semibold text-[#b02129] transition hover:bg-[#f8d3d0]">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="space-y-6 rounded-3xl border border-[#e8eaed] bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.16em] text-[#5f6368]">Recipients</div>
              <p className="text-sm text-[#202124]">{draft.recipients}</p>
            </div>
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.16em] text-[#5f6368]">Label</div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#e8f0ff] px-3 py-1 text-xs font-semibold text-[#1a73e8]">
                <Tag size={14} /> {draft.label}
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-[#e8eaed] bg-[#f8fafc] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-[#5f6368]">Draft body</div>
                <p className="mt-2 text-sm text-[#5f6368]">Edit or review the current draft message before sending.</p>
              </div>
              <span className="rounded-full bg-[#fff8e1] px-3 py-1 text-xs font-semibold text-[#9a5800]">{draft.draftStatus}</span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="mt-5 w-full resize-none rounded-3xl border border-[#e8eaed] bg-white p-4 text-sm leading-6 text-[#202124] outline-none transition focus:border-[#1a73e8] focus:ring-2 focus:ring-[#d2e3fc]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(draftMeta).map(([key, value]) => (
              <div key={key} className="rounded-3xl border border-[#e8eaed] bg-[#ffffff] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#5f6368]">{key}</p>
                <p className="mt-2 text-sm text-[#202124]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-6 rounded-3xl border border-[#e8eaed] bg-white p-5 shadow-sm">
          <div className="rounded-3xl bg-[#f8fafc] p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#5f6368]">AI suggestion</p>
                <p className="mt-2 text-sm text-[#202124]">Writing tone is set to professional. Use the button below to rewrite if needed.</p>
              </div>
              <Sparkles size={18} className="text-[#7C3AED]" />
            </div>
            <div className="mt-4 rounded-3xl border border-[#dcdfe3] bg-white p-4 text-sm text-[#5f6368]">
              This draft is a strong starting point. Review the recipient and update the closing line if you want it to sound more personal.
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 text-sm text-[#5f6368]">
              <span>Quick actions</span>
              <MoreHorizontal size={16} />
            </div>
            <div className="grid gap-3">
              <button className="rounded-3xl border border-[#e8eaed] bg-[#f8fafc] px-4 py-3 text-left text-sm text-[#202124] hover:border-[#d6b167] hover:bg-[#fff7d6] transition-colors">Rewrite as a friendly reply</button>
              <button className="rounded-3xl border border-[#e8eaed] bg-[#f8fafc] px-4 py-3 text-left text-sm text-[#202124] hover:border-[#d6b167] hover:bg-[#fff7d6] transition-colors">Add next-step details</button>
              <button className="rounded-3xl border border-[#e8eaed] bg-[#f8fafc] px-4 py-3 text-left text-sm text-[#202124] hover:border-[#d6b167] hover:bg-[#fff7d6] transition-colors">Mark as ready to send</button>
            </div>
          </div>

          <div className="rounded-3xl border border-[#e8eaed] bg-[#fef7ef] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[#9a5800]">Draft status</p>
            <p className="mt-2 text-sm text-[#202124]">{draft.draftStatus}</p>
            <p className="mt-3 text-xs text-[#5f6368]">Use the publish button above when you are ready to send this message.</p>
          </div>
        </aside>
      </div>

      {showDeleteConfirm && (
        <div className="rounded-3xl border border-[#f28b82] bg-[#fef0ef] p-5 text-sm text-[#9a2c2c] shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Confirm delete</p>
              <p className="mt-1 text-[#5f6368]">This will permanently remove the draft from your inbox. This action cannot be undone.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="rounded-full border border-[#f28b82] bg-white px-4 py-2 text-sm text-[#9a2c2c] hover:bg-[#ffe8e6] transition">
                Cancel
              </button>
              <button className="rounded-full bg-[#d93025] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b31412] transition">
                Delete draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
