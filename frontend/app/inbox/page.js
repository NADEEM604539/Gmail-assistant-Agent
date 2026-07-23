"use client"
import { useState } from 'react'
import {
  Star, Sparkles, Paperclip, RefreshCw, ChevronDown, Filter,
  Tag, Archive, Trash2, MoreHorizontal, CheckSquare, Square,
  AlertCircle, Clock, CheckCircle2,
} from 'lucide-react'



const EMAILS = [
  { id: 1, from: 'Sarah Chen', email: 'sarah@stripe.com', subject: 'Q4 budget review — need your sign-off by EOD', preview: "Hi Jane, I've attached the full Q4 budget proposal for review. We need your CFO sign-off before tomorrow's board meeting.", time: '9:42 AM', unread: true, starred: true, priority: 'high', hasAttachment: true, label: 'Finance', aiSummary: 'Budget approval needed by 5pm', avatar: 'SC', category: 'Primary' },
  { id: 2, from: 'GitHub Actions', email: 'noreply@github.com', subject: 'Deploy to production succeeded ✓ — main branch', preview: 'Your workflow run completed successfully. All 47 tests passed. Deployment to prod-us-east-1 is live.', time: '9:15 AM', unread: true, starred: false, priority: 'low', hasAttachment: false, label: 'Dev', aiSummary: 'Production deploy successful', avatar: 'GH', category: 'Updates' },
  { id: 3, from: 'Marcus Webb', email: 'marcus@linear.app', subject: 'Re: Partnership proposal — your feedback is needed', preview: "Thanks for sending this over. I had a chance to review the proposal and have some thoughts on the go-to-market strategy that I'd like to discuss.", time: '8:50 AM', unread: false, starred: false, priority: 'medium', hasAttachment: false, label: 'Business', aiSummary: 'Partnership feedback needed', avatar: 'MW', category: 'Primary' },
  { id: 4, from: 'Priya Nair', email: 'priya@notion.so', subject: 'Meeting rescheduled — Thursday 2pm works better', preview: "Quick heads up — I need to push tomorrow's product sync to Thursday at 2pm. Can everyone confirm availability?", time: 'Yesterday', unread: false, starred: true, priority: 'medium', hasAttachment: false, label: 'Meetings', aiSummary: 'Meeting moved to Thu 2pm', avatar: 'PN', category: 'Primary' },
  { id: 5, from: 'Stripe Billing', email: 'billing@stripe.com', subject: 'Invoice #INV-2024-1127 — November statement ready', preview: 'Your monthly invoice for November 2024 is now available for download. Total: $2,450.00. Due: December 15, 2024.', time: 'Yesterday', unread: false, starred: false, priority: 'low', hasAttachment: true, label: 'Finance', aiSummary: 'Invoice $2,450 due Dec 15', avatar: 'SB', category: 'Updates' },
  { id: 6, from: 'Tom Richards', email: 'tom@acme.io', subject: 'Urgent: Server downtime affecting 3 enterprise clients', preview: "We've had a critical incident since 2:30am. Three of our enterprise clients are impacted. I've escalated to engineering and need your approval to offer SLA credits.", time: 'Yesterday', unread: true, starred: false, priority: 'high', hasAttachment: false, label: 'Urgent', aiSummary: 'Critical incident — approval needed for SLA credits', avatar: 'TR', category: 'Primary' },
  { id: 7, from: 'Newsletter: Product Hunt', email: 'noreply@producthunt.com', subject: "Today's top products — AI tools taking over", preview: "Check out today's featured launches: AI-powered code review, smart inbox assistant, and more productivity tools...", time: 'Nov 26', unread: false, starred: false, priority: 'low', hasAttachment: false, label: 'Newsletter', aiSummary: 'Product Hunt daily digest', avatar: 'PH', category: 'Promotions' },
  { id: 8, from: 'Alex Thompson', email: 'alex@design.co', subject: 'Design review feedback for the new onboarding flow', preview: "Hi Jane, I've gone through the latest onboarding designs and have some UX suggestions. Overall it's looking great — just a few tweaks needed.", time: 'Nov 26', unread: false, starred: false, priority: 'medium', hasAttachment: true, label: 'Design', aiSummary: 'Onboarding design feedback attached', avatar: 'AT', category: 'Primary' },
]

const CATEGORIES = ['All', 'Primary', 'Promotions', 'Updates', 'Spam']
const LABELS = ['All Labels', 'Finance', 'Dev', 'Business', 'Urgent', 'Design', 'Meetings']

function priorityIcon(priority) {
  if (priority === 'high') return <AlertCircle size={12} className="text-red-500" />
  if (priority === 'medium') return <Clock size={12} className="text-amber-500" />
  return <CheckCircle2 size={12} className="text-green-500" />
}

export default function Inbox({ navigate }) {
  const [selected, setSelected] = useState(new Set())
  const [category, setCategory] = useState('All')
  const [label, setLabel] = useState('All Labels')
  const [showAI, setShowAI] = useState(true)

  const filtered = EMAILS.filter((e) => {
    if (category !== 'All' && e.category !== category) return false
    if (label !== 'All Labels' && e.label !== label) return false
    return true
  })

  const toggleSelect = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }
  const allSelected = filtered.length > 0 && filtered.every((e) => selected.has(e.id))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((e) => e.id)))

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Inbox toolbar */}
      <div className="border-b border-[#e8eaed] px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={toggleAll} className="p-1.5 hover:bg-[#f1f3f4] rounded text-[#5f6368]">
          {allSelected ? <CheckSquare size={16} className="text-[#1a73e8]" /> : <Square size={16} />}
        </button>
        <button className="p-1.5 hover:bg-[#f1f3f4] rounded text-[#5f6368]" title="Refresh">
          <RefreshCw size={15} />
        </button>
        <button className="p-1.5 hover:bg-[#f1f3f4] rounded text-[#5f6368] flex items-center gap-1 text-xs" title="More options">
          <MoreHorizontal size={15} />
        </button>

        {selected.size > 0 && (
          <div className="flex items-center gap-1 ml-2 border-l border-[#e8eaed] pl-3">
            <span className="text-xs text-[#5f6368] mr-1">{selected.size} selected</span>
            <button className="p-1.5 hover:bg-[#f1f3f4] rounded text-[#5f6368]" title="Archive"><Archive size={15} /></button>
            <button className="p-1.5 hover:bg-[#f1f3f4] rounded text-[#5f6368]" title="Delete"><Trash2 size={15} /></button>
            <button className="p-1.5 hover:bg-[#f1f3f4] rounded text-[#5f6368]" title="Label"><Tag size={15} /></button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowAI(!showAI)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${showAI ? 'bg-violet-50 text-violet-600 border-violet-200' : 'border-[#e8eaed] text-[#5f6368]'}`}
          >
            <Sparkles size={12} /> AI Summaries
          </button>
          <div className="flex items-center gap-1.5 text-xs text-[#5f6368] border border-[#e8eaed] rounded-full px-3 py-1.5">
            <Filter size={12} />
            <select value={label} onChange={e => setLabel(e.target.value)} className="bg-transparent outline-none cursor-pointer">
              {LABELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="border-b border-[#f1f3f4] flex overflow-x-auto">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${category === c ? 'border-[#1a73e8] text-[#1a73e8]' : 'border-transparent text-[#5f6368] hover:text-[#202124] hover:bg-[#f8fafc]'}`}
          >
            {c}
            {c === 'Primary' && <span className="ml-1.5 text-[10px] bg-[#1a73e8] text-white px-1.5 py-0.5 rounded-full font-semibold">8</span>}
          </button>
        ))}
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#f8fafc]">
        {filtered.map((email) => (
          <div
            key={email.id}
            className={`group flex items-start gap-3 px-4 py-3.5 hover:bg-[#f8fafc] cursor-pointer transition-colors ${email.unread ? 'bg-blue-50/20' : ''} ${selected.has(email.id) ? 'bg-blue-50' : ''}`}
            onClick={() => navigate('email-detail')}
          >
            {/* Checkbox + star */}
            <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); toggleSelect(email.id) }}
                className={`p-0.5 transition-opacity ${selected.has(email.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              >
                {selected.has(email.id)
                  ? <CheckSquare size={16} className="text-[#1a73e8]" />
                  : <Square size={16} className="text-[#9aa0a6]" />
                }
              </button>
              <button onClick={(e) => e.stopPropagation()} className="p-0.5">
                <Star size={15} className={email.starred ? 'text-amber-400 fill-amber-400' : 'text-[#dadce0] group-hover:text-[#9aa0a6]'} />
              </button>
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {email.avatar}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-sm truncate ${email.unread ? 'font-bold text-[#202124]' : 'font-medium text-[#5f6368]'}`}>{email.from}</span>
                {priorityIcon(email.priority)}
                <span className="text-xs text-[#9aa0a6] font-normal bg-[#f1f3f4] px-1.5 py-0.5 rounded hidden sm:block">{email.label}</span>
              </div>
              <div className={`text-sm truncate mb-0.5 ${email.unread ? 'font-semibold text-[#202124]' : 'text-[#5f6368]'}`}>{email.subject}</div>
              <div className="flex items-center gap-2 text-xs text-[#9aa0a6]">
                <span className="truncate">{email.preview}</span>
                {showAI && (
                  <span className="flex-shrink-0 flex items-center gap-1 bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded text-[10px] font-medium">
                    <Sparkles size={8} /> {email.aiSummary}
                  </span>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className={`text-xs ${email.unread ? 'text-[#1a73e8] font-semibold' : 'text-[#9aa0a6]'}`}>{email.time}</span>
              <div className="flex gap-1">
                {email.hasAttachment && <Paperclip size={12} className="text-[#9aa0a6]" />}
                {email.unread && <div className="w-2 h-2 bg-[#1a73e8] rounded-full" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="border-t border-[#e8eaed] px-4 py-2.5 flex items-center justify-between text-xs text-[#5f6368] flex-shrink-0">
        <span>1–{filtered.length} of {EMAILS.length}</span>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded hover:bg-[#f1f3f4] transition-colors"><ChevronDown size={14} className="rotate-90" /></button>
          <button className="p-1.5 rounded hover:bg-[#f1f3f4] transition-colors"><ChevronDown size={14} className="-rotate-90" /></button>
        </div>
      </div>
    </div>
  )
}
