"use client"
import { useState } from 'react'
import { Bell, Sparkles, Shield, Zap, Mail, CheckCheck, X, Filter, AlertCircle, Info, CheckCircle2 } from 'lucide-react'

const NOTIFICATIONS = [
  { id: 1, type: 'ai', title: 'AI detected a high-priority email', body: 'Sarah Chen sent a budget approval request requiring your sign-off by 5pm today.', time: '2 min ago', read: false, priority: 'high' },
  { id: 2, type: 'security', title: 'Phishing attempt blocked', body: 'An email impersonating PayPal from spoofed@paypa1-support.com was blocked by AI spam detection.', time: '18 min ago', read: false, priority: 'high' },
  { id: 3, type: 'workflow', title: 'Finance workflow triggered', body: 'Your "Finance Email Sorter" workflow processed 3 emails and applied labels + notifications.', time: '1 hour ago', read: false, priority: 'medium' },
  { id: 4, type: 'email', title: '12 unread emails in your inbox', body: 'You have 12 unread emails. 3 are marked high priority. AI Morning Brief is ready.', time: '2 hours ago', read: true, priority: 'medium' },
  { id: 5, type: 'ai', title: 'Smart reply draft ready', body: 'AI drafted a response to Marcus Webb\'s partnership proposal feedback. Review before sending.', time: '3 hours ago', read: true, priority: 'medium' },
  { id: 6, type: 'workflow', title: 'Auto-Archive completed', body: '14 newsletter emails older than 3 days were automatically archived and labeled.', time: '5 hours ago', read: true, priority: 'low' },
  { id: 7, type: 'system', title: 'Weekly productivity report', body: 'Your week in review: 280 emails, 4.2 hours saved with AI, 94/100 productivity score.', time: 'Yesterday 8:00 AM', read: true, priority: 'low' },
  { id: 8, type: 'security', title: 'New device logged in', body: 'Your account was accessed from MacBook Pro on Chrome in San Francisco, CA.', time: 'Yesterday 2:14 PM', read: true, priority: 'medium' },
  { id: 9, type: 'email', title: 'Reply received from Priya Nair', body: 'Priya confirmed the meeting reschedule to Thursday 2pm. She added 2 agenda items.', time: 'Nov 26', read: true, priority: 'low' },
  { id: 10, type: 'ai', title: 'AI Workflow suggestion', body: 'We noticed you frequently label emails from linear.app as "Dev". Want to automate this?', time: 'Nov 26', read: true, priority: 'low' },
]

const typeConfig = {
  ai: { icon: Sparkles, color: 'text-violet-600', bg: 'bg-violet-100', label: 'AI' },
  security: { icon: Shield, color: 'text-red-600', bg: 'bg-red-100', label: 'Security' },
  workflow: { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Workflow' },
  email: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Email' },
  system: { icon: Info, color: 'text-[#5f6368]', bg: 'bg-[#f1f3f4]', label: 'System' },
}

const FILTERS = ['All', 'AI', 'Security', 'Workflow', 'Email', 'System']

export default function Notifications() {
  const [notifs, setNotifs] = useState(NOTIFICATIONS)
  const [filter, setFilter] = useState('All')

  const filtered = notifs.filter(n => filter === 'All' || typeConfig[n.type].label === filter)
  const unreadCount = notifs.filter(n => !n.read).length

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  const dismiss = (id) => setNotifs(prev => prev.filter(n => n.id !== id))
  const markRead = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#202124]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-[#1a73e8] text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 text-xs text-[#1a73e8] hover:text-[#1557b0] font-medium disabled:text-[#9aa0a6] disabled:cursor-not-allowed transition-colors"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${filter === f ? 'bg-[#1a73e8] text-white border-[#1a73e8]' : 'border-[#e8eaed] text-[#5f6368] hover:border-[#dadce0] hover:text-[#202124]'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden divide-y divide-[#f8fafc]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell size={32} className="text-[#dadce0] mb-3" />
            <p className="text-sm text-[#9aa0a6] font-medium">No notifications</p>
          </div>
        ) : (
          filtered.map(n => {
            const cfg = typeConfig[n.type]
            const Icon = cfg.icon
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-[#f8fafc] ${!n.read ? 'bg-blue-50/30' : ''}`}
              >
                {/* Icon */}
                <div className={`w-9 h-9 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon size={16} className={cfg.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0" onClick={() => markRead(n.id)}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm font-semibold ${n.read ? 'text-[#5f6368]' : 'text-[#202124]'}`}>{n.title}</span>
                    {!n.read && <div className="w-1.5 h-1.5 bg-[#1a73e8] rounded-full flex-shrink-0" />}
                    {n.priority === 'high' && (
                      <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#9aa0a6] leading-relaxed">{n.body}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-[#bdc1c6]">{n.time}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>

                {/* Dismiss */}
                <button
                  onClick={() => dismiss(n.id)}
                  className="p-1 text-[#dadce0] hover:text-[#9aa0a6] transition-colors flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
