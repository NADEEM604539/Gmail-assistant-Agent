"use client"
import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, Clock, Mail, Sparkles, Shield, Download, Calendar } from 'lucide-react'

const WEEKLY_DATA = [
  { day: 'Mon', received: 42, sent: 18, aiSaved: 28 },
  { day: 'Tue', received: 58, sent: 24, aiSaved: 35 },
  { day: 'Wed', received: 35, sent: 20, aiSaved: 22 },
  { day: 'Thu', received: 67, sent: 31, aiSaved: 45 },
  { day: 'Fri', received: 51, sent: 27, aiSaved: 38 },
  { day: 'Sat', received: 15, sent: 8, aiSaved: 10 },
  { day: 'Sun', received: 12, sent: 5, aiSaved: 8 },
]

const MONTHLY_DATA = [
  { month: 'Jun', emails: 820, ai: 340, spam: 45 },
  { month: 'Jul', emails: 940, ai: 420, spam: 38 },
  { month: 'Aug', emails: 780, ai: 380, spam: 52 },
  { month: 'Sep', emails: 1050, ai: 510, spam: 31 },
  { month: 'Oct', emails: 1120, ai: 580, spam: 44 },
  { month: 'Nov', emails: 1280, ai: 680, spam: 29 },
]

const RESPONSE_TIME = [
  { hour: '8am', time: 45 }, { hour: '9am', time: 28 }, { hour: '10am', time: 35 },
  { hour: '11am', time: 22 }, { hour: '12pm', time: 55 }, { hour: '1pm', time: 42 },
  { hour: '2pm', time: 18 }, { hour: '3pm', time: 25 }, { hour: '4pm', time: 31 },
  { hour: '5pm', time: 48 },
]

const EMAIL_CATEGORIES = [
  { name: 'Primary', value: 45, color: '#1a73e8' },
  { name: 'Updates', value: 25, color: '#34a853' },
  { name: 'Promotions', value: 18, color: '#fbbc05' },
  { name: 'Social', value: 8, color: '#ea4335' },
  { name: 'Spam', value: 4, color: '#9aa0a6' },
]

const STATS = [
  { label: 'Emails This Week', value: '280', delta: '+12%', trend: 'up', icon: Mail, color: 'text-blue-600', iconBg: 'bg-blue-100' },
  { label: 'Hours Saved (AI)', value: '4.2h', delta: '+18min', trend: 'up', icon: Sparkles, color: 'text-violet-600', iconBg: 'bg-violet-100' },
  { label: 'Avg Response Time', value: '34 min', delta: '-8min', trend: 'down', icon: Clock, color: 'text-green-600', iconBg: 'bg-green-100' },
  { label: 'Spam Blocked', value: '29', delta: '-11%', trend: 'down', icon: Shield, color: 'text-red-600', iconBg: 'bg-red-100' },
  { label: 'AI Replies Sent', value: '43', delta: '+27%', trend: 'up', icon: TrendingUp, color: 'text-amber-600', iconBg: 'bg-amber-100' },
  { label: 'Productivity Score', value: '94/100', delta: '+4pts', trend: 'up', icon: TrendingUp, color: 'text-indigo-600', iconBg: 'bg-indigo-100' },
]

export default function Analytics() {
  const [period, setPeriod] = useState('week')

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#202124]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Analytics</h1>
          <p className="text-sm text-[#9aa0a6] mt-0.5">Email performance and AI productivity insights</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#f1f3f4] rounded-full p-0.5">
            {(['week', 'month']).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${period === p ? 'bg-white text-[#202124] shadow-sm' : 'text-[#9aa0a6]'}`}
              >
                This {p}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 text-xs border border-[#e8eaed] bg-white rounded-full px-3 py-1.5 text-[#5f6368] hover:bg-[#f8fafc] transition-colors font-medium">
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STATS.map(s => {
          const Icon = s.icon
          const isGoodUp = s.trend === 'up' && s.label !== 'Spam Blocked' && s.label !== 'Avg Response Time'
          const isGoodDown = s.trend === 'down' && (s.label === 'Spam Blocked' || s.label === 'Avg Response Time')
          return (
            <div key={s.label} className="bg-white border border-[#e8eaed] rounded-xl p-4">
              <div className={`w-8 h-8 ${s.iconBg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon size={15} className={s.color} />
              </div>
              <div className={`text-xl font-extrabold ${s.color} mb-0.5`}>{s.value}</div>
              <div className="text-[10px] text-[#9aa0a6] font-medium mb-1">{s.label}</div>
              <span className={`text-[10px] font-semibold ${isGoodUp || isGoodDown ? 'text-green-600' : 'text-red-600'}`}>
                {s.trend === 'up' ? '↑' : '↓'} {s.delta}
              </span>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly volume */}
        <div className="lg:col-span-2 bg-white border border-[#e8eaed] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#202124]">Email Volume</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#1a73e8] rounded-sm" />Received</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#34a853] rounded-sm" />Sent</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-violet-500 rounded-sm" />AI Saved</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={WEEKLY_DATA} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, border: '1px solid #e8eaed', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="received" fill="#1a73e8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sent" fill="#34a853" radius={[4, 4, 0, 0]} />
              <Bar dataKey="aiSaved" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category distribution */}
        <div className="bg-white border border-[#e8eaed] rounded-xl p-5">
          <h2 className="font-semibold text-[#202124] mb-4">Email Categories</h2>
          <div className="flex justify-center mb-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={EMAIL_CATEGORIES} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                  {EMAIL_CATEGORIES.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e8eaed', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {EMAIL_CATEGORIES.map(c => (
              <div key={c.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <span className="text-xs text-[#5f6368] flex-1">{c.name}</span>
                <span className="text-xs font-semibold text-[#202124]">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly trend */}
        <div className="bg-white border border-[#e8eaed] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#202124]">6-Month Trend</h2>
            <Calendar size={14} className="text-[#9aa0a6]" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={MONTHLY_DATA}>
              <defs>
                <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#1a73e8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e8eaed', borderRadius: 8 }} />
              <Area type="monotone" dataKey="emails" stroke="#1a73e8" fill="url(#colorEmails)" strokeWidth={2} dot={false} name="Total emails" />
              <Area type="monotone" dataKey="ai" stroke="#7c3aed" fill="url(#colorAI)" strokeWidth={2} dot={false} name="AI-assisted" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Response time */}
        <div className="bg-white border border-[#e8eaed] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#202124]">Avg Response Time (Today)</h2>
            <span className="text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">34 min avg</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={RESPONSE_TIME}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} unit="m" />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e8eaed', borderRadius: 8 }} formatter={(v) => [`${v} min`, 'Response time']} />
              <Line type="monotone" dataKey="time" stroke="#1a73e8" strokeWidth={2} dot={{ fill: '#1a73e8', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Usage */}
      <div className="bg-white border border-[#e8eaed] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={15} className="text-violet-600" />
          <h2 className="font-semibold text-[#202124]">AI Feature Usage This Week</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { feature: 'Email Summaries', count: 156, pct: 87, color: 'bg-violet-500' },
            { feature: 'Smart Replies', count: 43, pct: 24, color: 'bg-blue-500' },
            { feature: 'Spam Detection', count: 29, pct: 100, color: 'bg-red-500' },
            { feature: 'Translation', count: 8, pct: 4, color: 'bg-amber-500' },
          ].map(f => (
            <div key={f.feature} className="bg-[#f8fafc] rounded-xl p-4">
              <div className="text-lg font-extrabold text-[#202124] mb-0.5">{f.count}</div>
              <div className="text-xs text-[#5f6368] mb-3">{f.feature}</div>
              <div className="h-1.5 bg-[#e8eaed] rounded-full overflow-hidden">
                <div className={`h-full ${f.color} rounded-full transition-all`} style={{ width: `${f.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
