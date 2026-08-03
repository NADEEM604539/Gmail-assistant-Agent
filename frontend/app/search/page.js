"use client"
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search as SearchIcon, Sparkles, Clock, X, Star, Paperclip, ChevronDown, SlidersHorizontal, Mail } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

const SUGGESTED = [
  { q: 'Emails needing a reply', icon: Mail, color: 'text-blue-600 bg-blue-50' },
  { q: 'High priority this week', icon: Sparkles, color: 'text-violet-600 bg-violet-50' },
  { q: 'Emails with attachments', icon: Paperclip, color: 'text-amber-600 bg-amber-50' },
  { q: 'Starred emails', icon: Star, color: 'text-yellow-600 bg-yellow-50' },
]

const FILTERS = ['From', 'To', 'Date', 'Has attachment', 'Label', 'Is unread', 'Is starred']

function normalizeRecentSearches(items = []) {
  const seen = new Set()
  return items.filter((item) => {
    const query = typeof item?.query === 'string' ? item.query.trim() : ''
    if (!query) return false

    const normalized = query.toLowerCase()
    if (seen.has(normalized)) return false

    seen.add(normalized)
    return true
  })
}

function getInitials(from = {}) {
  const source = from?.name || from?.email || 'Mail'
  if (!source) return 'M'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export default function Search({ navigate }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [aiSearch, setAiSearch] = useState(true)
  const [showResults, setShowResults] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeFilters, setActiveFilters] = useState(new Set())
  const [results, setResults] = useState([])
  const [recent, setRecent] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('access_token') : null
    if (!token) return

    fetch(`${API}/api/search/recent`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRecent(normalizeRecentSearches(data?.recent || [])))
      .catch(() => setRecent([]))
  }, [])

  const handleSearch = async (value) => {
    const nextQuery = (value ?? query).trim()
    if (!nextQuery) return

    setQuery(nextQuery)
    setShowResults(true)
    setIsLoading(true)
    setError('')

    try {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('access_token') : null
      if (!token) throw new Error('Please sign in again.')

      const res = await fetch(`${API}/api/search/gmail?q=${encodeURIComponent(nextQuery)}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401 || res.status === 403) {
        window.localStorage.removeItem('access_token')
        router.push('/')
        throw new Error('Please sign in again.')
      }

      if (!res.ok) {
        throw new Error('Search failed')
      }

      const data = await res.json()
      setResults(data.results || [])
      setRecent((prev) => normalizeRecentSearches([
        { query: nextQuery },
        ...prev.filter((item) => item?.query?.trim().toLowerCase() !== nextQuery.toLowerCase()),
      ]).slice(0, 6))
    } catch (err) {
      setError(err.message || 'Search failed')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFilter = (f) => {
    const next = new Set(activeFilters)
    if (next.has(f)) next.delete(f); else next.add(f)
    setActiveFilters(next)
  }

  const summaryText = useMemo(() => {
    if (!query) return 'Start typing to search your Gmail inbox.'
    if (isLoading) return 'Searching your mailbox…'
    if (error) return error
    if (results.length === 0) return 'No matching emails found.'
    return `${results.length} matching emails found for “${query}”.`
  }, [error, isLoading, query, results.length])

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#202124] mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Search</h1>
        <p className="text-sm text-[#9aa0a6]">Search your Gmail inbox with a semantic-style query.</p>
      </div>

      <div className="relative">
        <div className={`flex items-center gap-3 bg-white border rounded-2xl px-4 py-3.5 transition-all shadow-sm ${showResults ? 'border-[#1a73e8] shadow-blue-100' : 'border-[#e8eaed] hover:border-[#dadce0]'}`}>
          {aiSearch ? (
            <Sparkles size={18} className="text-violet-500 flex-shrink-0" />
          ) : (
            <SearchIcon size={18} className="text-[#9aa0a6] flex-shrink-0" />
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
            placeholder={aiSearch ? 'Ask AI: "Show emails from Stripe about invoices this month"' : 'Search by subject, sender, content...'}
            className="flex-1 text-sm text-[#202124] placeholder-[#9aa0a6] bg-transparent focus:outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => { setQuery(''); setShowResults(false); setResults([]); setError('') }} className="text-[#9aa0a6] hover:text-[#5f6368]">
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
            onClick={() => handleSearch(query)}
            disabled={!query.trim() || isLoading}
            className="text-xs font-semibold text-[#1a73e8] hover:text-[#1557b0] disabled:text-[#9aa0a6] transition-colors"
          >
            {isLoading ? 'Searching…' : 'Search →'}
          </button>
        </div>
      </div>

      {showAdvanced && (
        <div className="bg-white border border-[#e8eaed] rounded-xl p-4">
          <div className="text-xs font-semibold text-[#202124] mb-3">Quick filters</div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => toggleFilter(f)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${activeFilters.has(f) ? 'bg-[#1a73e8] text-white border-[#1a73e8]' : 'border-[#e8eaed] text-[#5f6368] hover:border-[#dadce0]'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {!showResults ? (
        <div className="space-y-5">
          {recent.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#5f6368] uppercase tracking-wide">Recent searches</span>
              </div>
              <div className="space-y-1">
                {recent.map((item, index) => (
                  <button
                    key={`${item.query}-${index}`}
                    onClick={() => handleSearch(item.query)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f8fafc] text-left transition-colors group"
                  >
                    <Clock size={14} className="text-[#dadce0] group-hover:text-[#9aa0a6] flex-shrink-0" />
                    <span className="text-sm text-[#5f6368] group-hover:text-[#202124] flex-1">{item.query}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-[#5f6368] uppercase tracking-wide mb-2">Suggested</div>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTED.map((s) => {
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
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
            <div className="flex items-start gap-2.5">
              <Sparkles size={14} className="text-violet-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-violet-700 mb-1">AI Search Interpretation</div>
                <p className="text-xs text-[#5f6368]">{summaryText}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#f1f3f4] flex items-center justify-between">
              <span className="text-sm font-semibold text-[#202124]">{results.length} results</span>
              <button className="text-xs text-[#9aa0a6] flex items-center gap-1 hover:text-[#5f6368]">
                Sort by: Relevance <ChevronDown size={12} />
              </button>
            </div>
            <div className="divide-y divide-[#f8fafc]">
              {results.map((r, index) => (
                <div
                  key={r.id || `${r.subject || 'result'}-${index}`}
                  onClick={() => r.id && router.push(`/email/${r.id}`)}
                  className="flex items-start gap-3 px-4 py-3.5 hover:bg-[#f8fafc] cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {getInitials(r.from)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-[#202124] truncate">{r.from?.name || r.from?.email || 'Unknown sender'}</span>
                      {r.starred && <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
                      {r.hasAttachment && <Paperclip size={12} className="text-[#9aa0a6] flex-shrink-0" />}
                      <span className="text-[10px] bg-[#f1f3f4] text-[#5f6368] px-1.5 py-0.5 rounded font-medium flex-shrink-0">{r.category || 'Inbox'}</span>
                    </div>
                    <div className="text-sm text-[#202124] font-medium truncate mb-0.5">{r.subject || 'No subject'}</div>
                    <div className="text-xs text-[#9aa0a6] truncate">{r.preview || r.body || 'No preview available.'}</div>
                  </div>
                  <span className="text-xs text-[#9aa0a6] flex-shrink-0">{r.time || ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
