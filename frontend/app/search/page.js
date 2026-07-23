"use client"
import { useState } from 'react'
import { Search as SearchIcon, Sparkles, Clock, X, Star, Paperclip, ChevronDown, SlidersHorizontal, Mail } from 'lucide-react'

const RECENT = ['budget review', 'emails from stripe', 'meeting rescheduled', 'invoice november']

const SUGGESTED = [
  { q: 'Emails needing a reply', icon: Mail, color: 'text-blue-600 bg-blue-50' },
  { q: 'High priority this week', icon: Sparkles, color: 'text-violet-600 bg-violet-50' },
  { q: 'Emails with attachments', icon: Paperclip, color: 'text-amber-600 bg-amber-50' },
  { q: 'Starred emails', icon: Star, color: 'text-yellow-600 bg-yellow-50' },
]

const RESULTS = [
  { from: 'Sarah Chen', email: 'sarah@stripe.com', subject: 'Q4 budget review — need your sign-off by EOD', preview: "Hi Jane, I've attached the full Q4 budget proposal. We need CFO sign-off before tomorrow's board meeting.", time: '9:42 AM', starred: true, hasAttachment: true, label: 'Finance', avatar: 'SC' },
  { from: 'Tom Richards', email: 'tom@acme.io', subject: 'Urgent: Monthly budget overspend alert — Q4 tracking', preview: 'Our Q4 tracking shows we are 8% over budget in the engineering department. Need to discuss options.', time: 'Nov 25', starred: false, hasAttachment: false, label: 'Finance', avatar: 'TR' },
  { from: 'Finance Team', email: 'finance@company.com', subject: 'Budget review calendar for Q4 — please confirm attendance', preview: 'The quarterly budget review is scheduled for Thursday Dec 5 at 2pm. Please confirm your attendance by Nov 30.', time: 'Nov 22', starred: false, hasAttachment: true, label: 'Finance', avatar: 'FT' },
  { from: 'Priya Nair', email: 'priya@notion.so', subject: 'Q4 product roadmap — budget implications', preview: "Hi team, wanted to share the Q4 product roadmap for your awareness. There are some budget implications we should discuss.", time: 'Nov 20', starred: false, hasAttachment: false, label: 'Product', avatar: 'PN' },
]

const FILTERS = ['From', 'To', 'Date', 'Has attachment', 'Label', 'Is unread', 'Is starred']

export default function Search({ navigate }) {
  const [query, setQuery] = useState('')
  const [aiSearch, setAiSearch] = useState(true)
  const [showResults, setShowResults] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeFilters, setActiveFilters] = useState(new Set())

  const handleSearch = (q) => {
    setQuery(q || query)
    if (q || query.trim()) setShowResults(true)
  }

  const toggleFilter = (f) => {
    const next = new Set(activeFilters)
    if (next.has(f)) next.delete(f); else next.add(f)
    setActiveFilters(next)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#202124] mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Search</h1>
        <p className="text-sm text-[#9aa0a6]">Search emails, contacts, attachments, or ask AI</p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <div className={`flex items-center gap-3 bg-white border rounded-2xl px-4 py-3.5 transition-all shadow-sm ${showResults ? 'border-[#1a73e8] shadow-blue-100' : 'border-[#e8eaed] hover:border-[#dadce0]'}`}>
          {aiSearch ? (
            <Sparkles size={18} className="text-violet-500 flex-shrink-0" />
          ) : (
            <SearchIcon size={18} className="text-[#9aa0a6] flex-shrink-0" />
          )}
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={aiSearch ? 'Ask AI: "Show emails from Stripe about invoices this month"' : 'Search by subject, sender, content...'}
            className="flex-1 text-sm text-[#202124] placeholder-[#9aa0a6] bg-transparent focus:outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => { setQuery(''); setShowResults(false) }} className="text-[#9aa0a6] hover:text-[#5f6368]">
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-1.5 rounded-lg transition-colors ${showAdvanced ? 'bg-[#1a73e8] text-white' : 'text-[#9aa0a6] hover:text-[#5f6368] hover:bg-[#f1f3f4]'}`}
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>

        {/* AI toggle */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAiSearch(!aiSearch)}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${aiSearch ? 'bg-violet-50 text-violet-600 border-violet-200' : 'border-[#e8eaed] text-[#9aa0a6]'}`}
            >
              <Sparkles size={11} /> AI Search
            </button>
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={!query.trim()}
            className="text-xs font-semibold text-[#1a73e8] hover:text-[#1557b0] disabled:text-[#9aa0a6] transition-colors"
          >
            Search →
          </button>
        </div>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="bg-white border border-[#e8eaed] rounded-xl p-4">
          <div className="text-xs font-semibold text-[#202124] mb-3">Quick filters</div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => toggleFilter(f)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${activeFilters.has(f) ? 'bg-[#1a73e8] text-white border-[#1a73e8]' : 'border-[#e8eaed] text-[#5f6368] hover:border-[#dadce0]'}`}
              >
                {f}
              </button>
            ))}
          </div>
          {activeFilters.size > 0 && (
            <div className="mt-3 space-y-2">
              {Array.from(activeFilters).slice(0, 2).map(f => (
                <div key={f} className="flex items-center gap-2">
                  <span className="text-xs text-[#5f6368] w-24">{f}:</span>
                  <input
                    placeholder={`Enter ${f.toLowerCase()}...`}
                    className="flex-1 border border-[#e8eaed] rounded-lg px-3 py-1.5 text-xs text-[#202124] placeholder-[#9aa0a6] focus:outline-none focus:border-[#1a73e8] transition-colors"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!showResults ? (
        <div className="space-y-5">
          {/* Recent searches */}
          {RECENT.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#5f6368] uppercase tracking-wide">Recent searches</span>
                <button className="text-xs text-[#9aa0a6] hover:text-[#5f6368]">Clear all</button>
              </div>
              <div className="space-y-1">
                {RECENT.map(r => (
                  <button
                    key={r}
                    onClick={() => handleSearch(r)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f8fafc] text-left transition-colors group"
                  >
                    <Clock size={14} className="text-[#dadce0] group-hover:text-[#9aa0a6] flex-shrink-0" />
                    <span className="text-sm text-[#5f6368] group-hover:text-[#202124] flex-1">{r}</span>
                    <X size={13} className="text-[#dadce0] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggested searches */}
          <div>
            <div className="text-xs font-semibold text-[#5f6368] uppercase tracking-wide mb-2">Suggested</div>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTED.map(s => {
                const Icon = s.icon
                return (
                  <button
                    key={s.q}
                    onClick={() => handleSearch(s.q)}
                    className="flex items-center gap-2.5 p-3 bg-white border border-[#e8eaed] rounded-xl hover:border-[#dadce0] hover:shadow-sm text-left transition-all"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color.split(' ')[1]}`}>
                      <Icon size={14} className={s.color.split(' ')[0]} />
                    </div>
                    <span className="text-xs font-medium text-[#202124]">{s.q}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* AI interpretation */}
          {aiSearch && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <div className="flex items-start gap-2.5">
                <Sparkles size={14} className="text-violet-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-violet-700 mb-1">AI Search Interpretation</div>
                  <p className="text-xs text-[#5f6368]">Searching for emails related to "<strong>{query || 'budget review'}</strong>" — found 4 matching results across Finance and Product labels from the past 30 days.</p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#f1f3f4] flex items-center justify-between">
              <span className="text-sm font-semibold text-[#202124]">{RESULTS.length} results</span>
              <button className="text-xs text-[#9aa0a6] flex items-center gap-1 hover:text-[#5f6368]">
                Sort by: Relevance <ChevronDown size={12} />
              </button>
            </div>
            <div className="divide-y divide-[#f8fafc]">
              {RESULTS.map((r, i) => (
                <div
                  key={i}
                  onClick={() => navigate('email-detail')}
                  className="flex items-start gap-3 px-4 py-3.5 hover:bg-[#f8fafc] cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {r.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-[#202124] truncate">{r.from}</span>
                      {r.starred && <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
                      {r.hasAttachment && <Paperclip size={12} className="text-[#9aa0a6] flex-shrink-0" />}
                      <span className="text-[10px] bg-[#f1f3f4] text-[#5f6368] px-1.5 py-0.5 rounded font-medium flex-shrink-0">{r.label}</span>
                    </div>
                    <div className="text-sm text-[#202124] font-medium truncate mb-0.5">{r.subject}</div>
                    <div className="text-xs text-[#9aa0a6] truncate">{r.preview}</div>
                  </div>
                  <span className="text-xs text-[#9aa0a6] flex-shrink-0">{r.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
