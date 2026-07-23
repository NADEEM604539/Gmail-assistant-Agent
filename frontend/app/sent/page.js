"use client"
import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Square,
  CheckSquare,
  Star,
  Paperclip,
  Filter,
  Search,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  ArrowRight,
  Sparkles,
  Clock,
  AlertCircle,
} from 'lucide-react'

const SENT_MESSAGES = [
  {
    id: 1,
    to: 'Marcus Webb',
    email: 'marcus@linear.app',
    subject: 'Re: Partnership proposal — ready for review',
    preview: "Here is the final reply with feedback and next steps. Let me know if you'd like to follow up with the product team.",
    body: "Hi Marcus, thanks for sharing the proposal. I’ve reviewed the GTM strategy and the budget looks strong. I’ve highlighted the key milestones and added a recommendation for the next leadership sync. Please share this with the ops team before EOD.",
    time: '9:08 AM',
    sentTime: 'Today 9:08 AM',
    label: 'Business',
    status: 'Delivered',
    hasAttachment: true,
    aiSummary: 'Sent finalized partnership proposal response',
    importance: 'high',
  },
  {
    id: 2,
    to: 'Priya Nair',
    email: 'priya@notion.so',
    subject: 'Re: Meeting reschedule confirmed',
    preview: 'Thanks for the update — Thursday 2pm is good on my end. I’ll send the updated agenda shortly.',
    body: "Hi Priya, Thursday 2pm works great. I’ve updated the calendar invite and added the new agenda items for the product sync. Please let me know if we need to loop in engineering.",
    time: 'Yesterday',
    sentTime: 'Yesterday 4:20 PM',
    label: 'Meetings',
    status: 'Sent',
    hasAttachment: false,
    aiSummary: 'Confirmed rescheduled meeting and updated agenda',
    importance: 'medium',
  },
  {
    id: 3,
    to: 'Finance Team',
    email: 'finance@acme.com',
    subject: 'Q4 budget approval request',
    preview: 'I have submitted the final Q4 budget and requested your sign-off before the board meeting.',
    body: "Team, I’ve shared the final Q4 budget draft and highlighted the revisions for headcount and vendor spend. Please review and approve by EOD so we can finalize before Friday’s board meeting.",
    time: 'Nov 26',
    sentTime: 'Nov 26 8:30 AM',
    label: 'Finance',
    status: 'Delivered',
    hasAttachment: true,
    aiSummary: 'Budget approval request sent to finance',
    importance: 'high',
  },
  {
    id: 4,
    to: 'Newsletter Subscribers',
    email: 'subscribers@producthunt.com',
    subject: "Today's top AI tools — launch announcement", 
    preview: 'Sharing the latest launch roundup and our new AI inbox assistant with the community.',
    body: "Hello all, we’re excited to announce our AI inbox assistant launch today. It includes smarter summaries, quick replies, and workflow automation to help teams stay on top of email.",
    time: 'Nov 24',
    sentTime: 'Nov 24 11:15 AM',
    label: 'Updates',
    status: 'Delivered',
    hasAttachment: false,
    aiSummary: 'Sent launch announcement to subscribers',
    importance: 'low',
  },
  {
    id: 5,
    to: 'Tom Richards',
    email: 'tom@acme.io',
    subject: 'Re: Critical incident update and SLA credits',
    preview: 'I’ve approved the SLA credit plan and asked engineering to prioritize incident remediation.',
    body: "Tom, I agree with the proposed SLA credit package. Please move forward with communications and confirm when the incident remediation plan is live.",
    time: 'Nov 23',
    sentTime: 'Nov 23 2:12 PM',
    label: 'Urgent',
    status: 'Sent',
    hasAttachment: false,
    aiSummary: 'Sent incident approval and next-step guidance',
    importance: 'high',
  },
]

const LABELS = ['All Labels', 'Business', 'Meetings', 'Finance', 'Updates', 'Urgent']

function importanceIcon(importance) {
  if (importance === 'high') return <AlertCircle size={12} className="text-red-500" />
  if (importance === 'medium') return <Clock size={12} className="text-amber-500" />
  return <Sparkles size={12} className="text-green-500" />
}

export default function SentPage() {
  const [messages, setMessages] = useState(SENT_MESSAGES)
  const [selected, setSelected] = useState(new Set())
  const [label, setLabel] = useState('All Labels')
  const [showAI, setShowAI] = useState(true)
  const [activeId, setActiveId] = useState(SENT_MESSAGES[0]?.id || null)

  const filtered = messages.filter((message) => {
    if (label !== 'All Labels' && message.label !== label) return false
    return true
  })

  const activeMessage = useMemo(() => filtered.find((message) => message.id === activeId) || filtered[0] || null, [filtered, activeId])
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

  const removeMessages = (ids) => {
    setMessages((prev) => prev.filter((message) => !ids.has(message.id)))
    setSelected((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.delete(id))
      return next
    })
    if (activeId && ids.has(activeId)) {
      setActiveId(filtered.find((message) => !ids.has(message.id))?.id || null)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#202124]">Sent</h1>
          <p className="mt-2 text-sm text-[#5f6368] max-w-2xl">
            Review recently sent messages, filter by label, and inspect the latest email content with AI summaries.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-[#e8eaed] bg-white px-4 py-2 text-sm font-semibold text-[#202124] hover:bg-[#f8fafc] transition">
            <ArrowRight size={16} /> Back home
          </Link>
          <button className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1662d9] transition">
            <Sparkles size={16} /> New sent message
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#e8eaed] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#f1f3f4] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={toggleAll} className="inline-flex items-center gap-2 rounded-full border border-[#e8eaed] bg-[#f8fafc] px-4 py-2 text-sm text-[#202124] hover:bg-[#edf2f7] transition">
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
            <button onClick={() => removeMessages(selected)} disabled={selected.size === 0} className="inline-flex items-center gap-2 rounded-full border border-[#e8eaed] bg-white px-4 py-2 text-sm text-[#b02129] transition hover:bg-[#fef0ef] disabled:cursor-not-allowed disabled:opacity-50">
              <Trash2 size={16} /> Delete {selected.size ? `(${selected.size})` : ''}
            </button>
            <button onClick={() => setShowAI(!showAI)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${showAI ? 'bg-[#e8def8] text-[#5f2eea]' : 'border border-[#e8eaed] bg-white text-[#5f6368]'}`}>
              <Sparkles size={16} /> AI {showAI ? 'On' : 'Off'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e8eaed] bg-[#f8fafc] px-4 py-2 text-sm text-[#5f6368]">
              <Search size={16} /> Search sent
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e8eaed] bg-[#f8fafc] px-4 py-2 text-sm text-[#5f6368]">
              <Filter size={16} />
              <select value={label} onChange={(e) => setLabel(e.target.value)} className="bg-transparent outline-none text-sm text-[#5f6368] cursor-pointer">
                {LABELS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] p-5">
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="rounded-[26px] border border-[#e8eaed] bg-[#f8fafc] p-6 text-center">
                <p className="text-sm text-[#5f6368]">No sent messages match this label. Try another filter.</p>
              </div>
            ) : (
              filtered.map((message) => {
                const isActive = message.id === activeMessage?.id
                return (
                  <div key={message.id} className={`group rounded-[26px] border p-4 transition ${isActive ? 'border-[#1a73e8] bg-[#eef3ff]' : 'border-[#f1f3f4] bg-white hover:border-[#d2e8ff] hover:bg-[#f6f9ff]'}`}>
                    <div className="flex items-start gap-3">
                      <button onClick={() => toggleSelect(message.id)} className="rounded-full border border-[#e8eaed] bg-white p-2 text-[#5f6368] transition hover:border-[#c7cdd6]">
                        {selected.has(message.id) ? <CheckSquare size={18} className="text-[#1a73e8]" /> : <Square size={18} />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <button onClick={() => setActiveId(message.id)} className="text-left">
                              <h2 className="text-base font-semibold text-[#202124] truncate">{message.subject}</h2>
                            </button>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#5f6368]">
                              <span className="rounded-full bg-[#f1f3f4] px-2.5 py-1">{message.label}</span>
                              <span className="rounded-full bg-[#e8f0fe] px-2.5 py-1 text-[#1a73e8]">{message.status}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#5f6368]">
                            <span>{message.time}</span>
                            <ChevronRight size={14} className="text-[#9aa0a6]" />
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[#5f6368] truncate">{message.preview}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button onClick={() => removeMessages(new Set([message.id]))} className="rounded-full bg-[#f8d7da] px-3 py-1.5 text-xs font-semibold text-[#a72a2f] transition hover:bg-[#f3b6bb]">
                          Delete
                        </button>
                        {message.hasAttachment && <Paperclip size={16} className="text-[#9aa0a6]" />}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="rounded-[26px] border border-[#f1f3f4] bg-[#f8fafc] p-5">
            {activeMessage ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[#5f6368]">Sent message preview</p>
                    <h2 className="mt-3 text-xl font-semibold text-[#202124] truncate">{activeMessage.subject}</h2>
                  </div>
                  <span className="rounded-full bg-[#e8f0fe] px-3 py-1 text-xs font-semibold text-[#1a73e8]">{activeMessage.status}</span>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="rounded-[24px] border border-[#e8eaed] bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#5f6368]">To</p>
                    <p className="mt-2 text-sm text-[#202124]">{activeMessage.to} · {activeMessage.email}</p>
                  </div>
                  <div className="rounded-[24px] border border-[#e8eaed] bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#5f6368]">Sent</p>
                    <p className="mt-2 text-sm text-[#202124]">{activeMessage.sentTime}</p>
                  </div>
                  <div className="rounded-[24px] border border-[#e8eaed] bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#5f6368]">Message</p>
                    <p className="mt-2 text-sm leading-7 text-[#5f6368]">{activeMessage.body}</p>
                  </div>
                  {showAI && (
                    <div className="rounded-[24px] border border-[#e8eaed] bg-white p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5f6368]">
                        <Sparkles size={12} /> AI summary
                      </div>
                      <p className="mt-2 text-sm text-[#202124]">{activeMessage.aiSummary}</p>
                    </div>
                  )}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1662d9] transition">
                    <ArrowRight size={16} /> Open full thread
                  </button>
                  <button onClick={() => removeMessages(new Set([activeMessage.id]))} className="inline-flex items-center gap-2 rounded-full bg-[#f8d7da] px-4 py-2 text-sm font-semibold text-[#a72a2f] hover:bg-[#f3b6bb] transition">
                    <Trash2 size={16} /> Delete sent message
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-[24px] border border-[#e8eaed] bg-white p-6 text-center">
                <p className="text-sm text-[#5f6368]">Select a sent message to preview its full content.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
