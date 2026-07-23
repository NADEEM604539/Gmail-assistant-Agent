"use client"
import {
  Mail, Calendar, Clock, CheckCircle2, Sparkles, TrendingUp,
  Shield, Star, Zap, BarChart3, Edit2, ExternalLink, Award,
} from 'lucide-react'

const TIMELINE = [
  { action: 'Sent AI-drafted reply to Marcus Webb', time: '18 min ago', icon: Sparkles, color: 'text-violet-600 bg-violet-50' },
  { action: 'Finance workflow processed 3 emails', time: '1 hour ago', icon: Zap, color: 'text-amber-600 bg-amber-50' },
  { action: 'Signed Q3 budget PDF', time: '2 hours ago', icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
  { action: 'Responded to Priya about meeting reschedule', time: 'Yesterday 3:14 PM', icon: Mail, color: 'text-blue-600 bg-blue-50' },
  { action: 'Created "Finance Email Sorter" workflow', time: 'Nov 26', icon: Zap, color: 'text-amber-600 bg-amber-50' },
  { action: 'Connected jane@gmail.com to Mailgent', time: 'Nov 20', icon: Mail, color: 'text-blue-600 bg-blue-50' },
]

const ACHIEVEMENTS = [
  { label: 'Power User', desc: '7 days streak', icon: Award, earned: true, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { label: 'AI Adopter', desc: '50+ AI replies sent', icon: Sparkles, earned: true, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { label: 'Inbox Zero', desc: 'Clear your inbox', icon: CheckCircle2, earned: false, color: 'text-[#9aa0a6] bg-[#f1f3f4] border-[#e8eaed]' },
  { label: 'Automation Pro', desc: '5 workflows created', icon: Zap, earned: false, color: 'text-[#9aa0a6] bg-[#f1f3f4] border-[#e8eaed]' },
]

export default function Profile({ navigate }) {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Profile header */}
      <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
        {/* Cover */}
        <div className="h-24 bg-gradient-to-r from-[#1a1a2e] via-[#2d2d55] to-[#1a1a2e] relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-blue-500/10" />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md">
              JD
            </div>
            <button
              onClick={() => navigate('settings')}
              className="flex items-center gap-1.5 text-xs text-[#5f6368] border border-[#e8eaed] px-3 py-2 rounded-full hover:bg-[#f8fafc] transition-colors font-medium"
            >
              <Edit2 size={12} /> Edit profile
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#202124]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Jane Doe</h1>
              <p className="text-[#5f6368] text-sm">Chief Financial Officer · Acme Corporation</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-[#9aa0a6]">
                  <Mail size={13} /> jane@gmail.com
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#9aa0a6]">
                  <Calendar size={13} /> Joined Nov 2024
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-violet-50 text-violet-600 border border-violet-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Sparkles size={11} /> Pro Plan
              </span>
              <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-2.5 py-1.5 rounded-full font-medium flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Active
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-5">
          {/* Connected accounts */}
          <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#f1f3f4]">
              <h2 className="font-semibold text-[#202124] text-sm">Connected Accounts</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-lg border border-[#e8eaed]">
                <div className="w-8 h-8 bg-white border border-[#e8eaed] rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#202124] truncate">jane@gmail.com</div>
                  <div className="flex items-center gap-1 text-[10px] text-green-600">
                    <CheckCircle2 size={9} /> Connected
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#f1f3f4]">
              <h2 className="font-semibold text-[#202124] text-sm">Subscription</h2>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Sparkles size={17} className="text-violet-600" />
                </div>
                <div>
                  <div className="font-bold text-[#202124] text-sm">Pro Plan</div>
                  <div className="text-xs text-[#9aa0a6]">$19/month · Renews Dec 20</div>
                </div>
              </div>
              <div className="space-y-1.5 mb-3">
                {['Unlimited AI usage', '5 Gmail accounts', 'Advanced workflows', 'Priority support'].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                    <span className="text-xs text-[#5f6368]">{f}</span>
                  </div>
                ))}
              </div>
              <button className="w-full text-xs text-[#1a73e8] font-semibold border border-[#e8eaed] rounded-lg py-2 hover:bg-[#f8fafc] transition-colors flex items-center justify-center gap-1.5">
                <ExternalLink size={11} /> Manage subscription
              </button>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#f1f3f4]">
              <h2 className="font-semibold text-[#202124] text-sm">Achievements</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2.5">
              {ACHIEVEMENTS.map(a => {
                const Icon = a.icon
                return (
                  <div key={a.label} className={`flex flex-col items-center p-3 rounded-xl border text-center ${a.color} ${!a.earned ? 'opacity-50' : ''}`}>
                    <Icon size={18} className="mb-1.5" />
                    <div className="text-[11px] font-bold">{a.label}</div>
                    <div className="text-[10px] opacity-70">{a.desc}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Usage stats */}
          <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f1f3f4]">
              <h2 className="font-semibold text-[#202124]">Usage Statistics</h2>
              <p className="text-xs text-[#9aa0a6] mt-0.5">Since joining Mailgent</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 p-5 gap-4">
              {[
                { label: 'Emails Processed', value: '1,247', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'AI Replies Sent', value: '183', icon: Sparkles, color: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'Hours Saved', value: '18.6h', icon: Clock, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Workflows Run', value: '3,412', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map(s => {
                const Icon = s.icon
                return (
                  <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                    <Icon size={20} className={`${s.color} mx-auto mb-2`} />
                    <div className={`text-2xl font-extrabold ${s.color} mb-0.5`}>{s.value}</div>
                    <div className="text-xs text-[#9aa0a6]">{s.label}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Productivity scores */}
          <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f1f3f4]">
              <h2 className="font-semibold text-[#202124]">Productivity Scores</h2>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Overall productivity', score: 94, max: 100, color: 'bg-blue-500' },
                { label: 'Response rate', score: 87, max: 100, color: 'bg-green-500' },
                { label: 'AI adoption', score: 73, max: 100, color: 'bg-violet-500' },
                { label: 'Inbox management', score: 91, max: 100, color: 'bg-amber-500' },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[#202124] font-medium">{s.label}</span>
                    <span className="text-sm font-bold text-[#202124]">{s.score}/100</span>
                  </div>
                  <div className="h-2 bg-[#f1f3f4] rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${s.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity timeline */}
          <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f1f3f4]">
              <h2 className="font-semibold text-[#202124]">Activity Timeline</h2>
            </div>
            <div className="p-5">
              <div className="space-y-4 relative">
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-[#f1f3f4]" />
                {TIMELINE.map((item, i) => {
                  const Icon = item.icon
                  const [colorClass, bgClass] = item.color.split(' ')
                  return (
                    <div key={i} className="flex items-start gap-4 relative">
                      <div className={`w-10 h-10 ${bgClass} rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-white`}>
                        <Icon size={15} className={colorClass} />
                      </div>
                      <div className="flex-1 pt-2 pb-2">
                        <div className="text-sm text-[#202124]">{item.action}</div>
                        <div className="text-xs text-[#9aa0a6] mt-0.5">{item.time}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
