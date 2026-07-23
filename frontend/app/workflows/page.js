"use client"
import { useState } from 'react'
import {
  Zap, Plus, Play, Pause, Trash2, MoreHorizontal, CheckCircle2,
  AlertCircle, Clock, Mail, Tag, ArrowRight, Settings,
  ChevronRight, Activity, TrendingUp, Filter, Sparkles,
} from 'lucide-react'


const WORKFLOWS= [
  {
    id: 1, name: 'Finance Email Sorter', description: 'Auto-label and prioritize all finance-related emails',
    trigger: 'Email received from *@stripe.com or contains "invoice", "payment", "budget"',
    actions: ['Apply label: Finance', 'Mark as high priority', 'Send me a push notification'],
    status: 'active', runs: 847, lastRun: '2 min ago', category: 'Organization',
  },
  {
    id: 2, name: 'Daily Digest', description: 'Compile and summarize unread emails every morning at 8am',
    trigger: 'Schedule: Every day at 8:00 AM',
    actions: ['Summarize all unread emails', 'Compose digest email', 'Send to jane@gmail.com'],
    status: 'active', runs: 124, lastRun: 'Today 8:00 AM', category: 'Productivity',
  },
  {
    id: 3, name: 'Auto-Archive Newsletters', description: 'Archive newsletters after 3 days if unread',
    trigger: 'Email category: Promotions, unread for 3+ days',
    actions: ['Archive email', 'Apply label: Auto-archived'],
    status: 'active', runs: 2341, lastRun: '1 hour ago', category: 'Cleanup',
  },
  {
    id: 4, name: 'Meeting Request Handler', description: 'Detect meeting requests and add to calendar',
    trigger: 'Email contains meeting request or calendar invite',
    actions: ['Extract meeting details', 'Create calendar event', 'Send acknowledgment reply'],
    status: 'paused', runs: 89, lastRun: 'Nov 25', category: 'Calendar',
  },
  {
    id: 5, name: 'VIP Sender Alert', description: 'Instant notification for emails from key contacts',
    trigger: 'Email from: ceo@company.com, board@company.com, or marked VIP',
    actions: ['Send phone notification', 'Mark as important', 'Add to daily summary top section'],
    status: 'active', runs: 34, lastRun: 'Yesterday', category: 'Alerts',
  },
  {
    id: 6, name: 'Reply SLA Monitor', description: 'Alert when emails go unread longer than 24 hours',
    trigger: 'Email in Primary > 24 hours, unread and not snoozed',
    actions: ['Send reminder to self', 'Apply label: Needs Response', 'Escalate if 48h'],
    status: 'draft', runs: 0, lastRun: 'Never', category: 'SLA',
  },
]

const TRIGGER_TEMPLATES = [
  { icon: Mail, label: 'Email received', desc: 'When a new email arrives', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { icon: Clock, label: 'Schedule', desc: 'At a specific time or interval', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { icon: Filter, label: 'Email filter', desc: 'Based on sender, subject, or content', color: 'bg-violet-50 text-violet-600 border-violet-200' },
  { icon: Tag, label: 'Label applied', desc: 'When a label is added', color: 'bg-green-50 text-green-600 border-green-200' },
]

const statusColor = (s) => {
  if (s === 'active') return 'bg-green-50 text-green-600 border-green-200'
  if (s === 'paused') return 'bg-amber-50 text-amber-600 border-amber-200'
  return 'bg-[#f1f3f4] text-[#9aa0a6] border-[#e8eaed]'
}

export default function Workflows() {
  const [workflows, setWorkflows] = useState(WORKFLOWS)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState(1)

  const toggleStatus = (id) => {
    setWorkflows(prev => prev.map(w =>
      w.id === id ? { ...w, status: w.status === 'active' ? 'paused' : 'active' } : w
    ))
  }

  const selectedWorkflow = workflows.find(w => w.id === selected)

  return (
    <div className="flex h-full">
      {/* Workflow list */}
      <div className="w-80 border-r border-[#e8eaed] flex flex-col bg-white flex-shrink-0">
        <div className="p-4 border-b border-[#e8eaed]">
          <div className="flex items-center justify-between mb-1">
            <h1 className="font-bold text-[#202124]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Workflows</h1>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
            >
              <Plus size={13} /> Create
            </button>
          </div>
          <div className="flex gap-3 text-xs text-[#9aa0a6]">
            <span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-green-500" />{workflows.filter(w => w.status === 'active').length} active</span>
            <span className="flex items-center gap-1"><Pause size={11} className="text-amber-500" />{workflows.filter(w => w.status === 'paused').length} paused</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#f8fafc]">
          {workflows.map(w => (
            <div
              key={w.id}
              onClick={() => setSelected(w.id)}
              className={`p-4 cursor-pointer transition-colors hover:bg-[#f8fafc] ${selected === w.id ? 'bg-blue-50/50 border-l-2 border-l-[#1a73e8]' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${w.status === 'active' ? 'bg-green-100' : w.status === 'paused' ? 'bg-amber-100' : 'bg-[#f1f3f4]'}`}>
                    <Zap size={14} className={w.status === 'active' ? 'text-green-600' : w.status === 'paused' ? 'text-amber-600' : 'text-[#9aa0a6]'} />
                  </div>
                  <span className="font-semibold text-[#202124] text-sm">{w.name}</span>
                </div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${statusColor(w.status)}`}>{w.status}</span>
              </div>
              <p className="text-xs text-[#9aa0a6] mb-2 truncate">{w.description}</p>
              <div className="flex items-center gap-3 text-[10px] text-[#9aa0a6]">
                <span className="flex items-center gap-1"><Activity size={10} /> {w.runs.toLocaleString()} runs</span>
                <span>Last: {w.lastRun}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
        {!showCreate && selectedWorkflow ? (
          <div className="p-6 max-w-3xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedWorkflow.status === 'active' ? 'bg-green-100' : 'bg-amber-100'}`}>
                    <Zap size={18} className={selectedWorkflow.status === 'active' ? 'text-green-600' : 'text-amber-600'} />
                  </div>
                  <h2 className="text-xl font-bold text-[#202124]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{selectedWorkflow.name}</h2>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColor(selectedWorkflow.status)}`}>{selectedWorkflow.status}</span>
                </div>
                <p className="text-sm text-[#5f6368]">{selectedWorkflow.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleStatus(selectedWorkflow.id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${selectedWorkflow.status === 'active' ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100' : 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'}`}
                >
                  {selectedWorkflow.status === 'active' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Enable</>}
                </button>
                <button className="p-2 border border-[#e8eaed] bg-white rounded-lg text-[#5f6368] hover:bg-[#f8fafc] transition-colors">
                  <Settings size={15} />
                </button>
                <button className="p-2 border border-[#e8eaed] bg-white rounded-lg text-[#5f6368] hover:bg-[#f8fafc] transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total runs', val: selectedWorkflow.runs.toLocaleString(), icon: Activity, color: 'text-blue-600' },
                { label: 'Last run', val: selectedWorkflow.lastRun, icon: Clock, color: 'text-green-600' },
                { label: 'Category', val: selectedWorkflow.category, icon: Tag, color: 'text-violet-600' },
              ].map(s => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="bg-white border border-[#e8eaed] rounded-xl p-4">
                    <Icon size={16} className={`${s.color} mb-2`} />
                    <div className="text-base font-bold text-[#202124]">{s.val}</div>
                    <div className="text-xs text-[#9aa0a6]">{s.label}</div>
                  </div>
                )
              })}
            </div>

            {/* Workflow builder */}
            <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f1f3f4]">
                <h3 className="font-semibold text-[#202124]">Workflow Logic</h3>
              </div>
              <div className="p-5 space-y-3">
                {/* Trigger */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap size={15} className="text-blue-600" />
                  </div>
                  <div className="flex-1 border border-blue-200 bg-blue-50 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Trigger</span>
                    </div>
                    <p className="text-sm font-medium text-[#202124]">{selectedWorkflow.trigger}</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-start ml-4">
                  <div className="w-0.5 h-5 bg-[#dadce0]" />
                </div>

                {/* Actions */}
                {selectedWorkflow.actions.map((action, i) => (
                  <div key={i}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <ArrowRight size={14} className="text-violet-600" />
                      </div>
                      <div className="flex-1 border border-[#e8eaed] bg-white rounded-xl p-3.5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">Action {i + 1}</span>
                        </div>
                        <p className="text-sm font-medium text-[#202124]">{action}</p>
                      </div>
                    </div>
                    {i < selectedWorkflow.actions.length - 1 && (
                      <div className="flex justify-start ml-4 mt-1">
                        <div className="w-0.5 h-4 bg-[#dadce0]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Run history */}
            <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f1f3f4] flex items-center justify-between">
                <h3 className="font-semibold text-[#202124]">Recent Runs</h3>
                <button className="text-xs text-[#1a73e8] font-medium">View all</button>
              </div>
              <div className="divide-y divide-[#f8fafc]">
                {[
                  { time: '2 min ago', status: 'success', matched: 1, actioned: 3 },
                  { time: '1 hour ago', status: 'success', matched: 2, actioned: 6 },
                  { time: '3 hours ago', status: 'success', matched: 1, actioned: 3 },
                  { time: 'Yesterday 4:22 PM', status: 'error', matched: 1, actioned: 1 },
                ].map((run, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    {run.status === 'success'
                      ? <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                      : <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                    }
                    <div className="flex-1">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-[#202124] font-medium">{run.time}</span>
                        <span className="text-[#9aa0a6]">{run.matched} email matched</span>
                        <span className="text-[#9aa0a6]">{run.actioned} actions</span>
                      </div>
                    </div>
                    <TrendingUp size={13} className="text-[#9aa0a6]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Create workflow panel */
          <div className="p-6 max-w-2xl space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setShowCreate(false)} className="text-sm text-[#9aa0a6] hover:text-[#5f6368]">← Back</button>
              <h2 className="text-xl font-bold text-[#202124]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Create Workflow</h2>
            </div>

            <div className="bg-white border border-[#e8eaed] rounded-xl p-5">
              <h3 className="font-semibold text-[#202124] mb-3 text-sm">Workflow name</h3>
              <input
                placeholder="e.g. Finance Email Sorter"
                className="w-full border border-[#e8eaed] rounded-lg px-4 py-2.5 text-sm text-[#202124] placeholder-[#9aa0a6] focus:outline-none focus:border-[#1a73e8] transition-colors"
              />
            </div>

            <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f1f3f4]">
                <h3 className="font-semibold text-[#202124]">Choose a trigger</h3>
                <p className="text-xs text-[#9aa0a6] mt-0.5">When should this workflow run?</p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {TRIGGER_TEMPLATES.map(t => {
                  const Icon = t.icon
                  return (
                    <button key={t.label} className={`flex items-start gap-3 p-4 border rounded-xl text-left hover:shadow-sm transition-all ${t.color}`}>
                      <Icon size={16} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-xs">{t.label}</div>
                        <div className="text-[11px] opacity-70 mt-0.5">{t.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-violet-600" />
                <span className="font-semibold text-violet-700 text-sm">AI Workflow Builder</span>
              </div>
              <p className="text-xs text-[#5f6368] mb-3">Describe your workflow in plain English and AI will build it for you.</p>
              <div className="flex gap-2">
                <input
                  placeholder='e.g. "Archive newsletters older than 3 days"'
                  className="flex-1 bg-white border border-violet-200 rounded-lg px-3 py-2 text-xs text-[#202124] placeholder-[#9aa0a6] focus:outline-none focus:border-violet-400 transition-colors"
                />
                <button className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5">
                  <Sparkles size={11} /> Build
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
