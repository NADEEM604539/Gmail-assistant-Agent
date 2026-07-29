'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  Sliders, 
  X, 
  Search, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  Check,
  Power,
  ShieldAlert,
  ArrowRight
} from 'lucide-react'

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/preferences`

export default function PreferencesPage() {
  const router = useRouter()
  
  const [preferences, setPreferences] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'disabled'
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  
  // Async status state
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    preference_name: '',
    preference_value: '',
    enabled: true
  })

  // Helper to extract Auth Headers from LocalStorage
  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('token') || localStorage.getItem('access_token') 
      : null

    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  }

  // Centralized handle for authentication failures
  const handleAuthError = (status) => {
    if (status === 401 || status === 403) {
      router.push('/')
      return true
    }
    return false
  }

  // Show temporary success notification
  const notifySuccess = (message) => {
    setSuccessMsg(message)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  // 1. GET Request: Load preferences from backend
  const fetchPreferences = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      if (handleAuthError(response.status)) return

      if (!response.ok) {
        throw new Error(`Failed to fetch preferences (Status ${response.status})`)
      }

      const data = await response.json()
      setPreferences(Array.isArray(data) ? data : data.preferences || [])
    } catch (err) {
      console.error('Fetch Error:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPreferences()
  }, [])

  // 2. CREATE (POST) / UPDATE (PUT) Handler
  const handleSavePreference = async (e) => {
    e.preventDefault()
    if (!formData.preference_name.trim() || !formData.preference_value.trim()) return

    setSubmitting(true)
    setError(null)

    const isEditing = Boolean(editingItem)
    const endpoint = isEditing ? `${API_BASE_URL}/${editingItem.id}` : API_BASE_URL
    const method = isEditing ? 'PUT' : 'POST'

    const payload = {
      preference_name: formData.preference_name.trim(),
      preference_value: formData.preference_value.trim(),
      enabled: formData.enabled
    }

    try {
      const response = await fetch(endpoint, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })

      if (handleAuthError(response.status)) return

      if (!response.ok) {
        throw new Error(`Failed to save preference (Status ${response.status})`)
      }

      const resData = await response.json()

      if (isEditing) {
        setPreferences(prev =>
          prev.map(item => item.id === editingItem.id ? { ...item, ...payload } : item)
        )
        notifySuccess('Preference updated successfully!')
      } else {
        const newItem = resData.preference || resData.data || {
          id: resData.id || Date.now(),
          ...payload
        }
        setPreferences(prev => [newItem, ...prev])
        notifySuccess('Preference created successfully!')
      }

      setIsModalOpen(false)
    } catch (err) {
      console.error('Save Error:', err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // 3. TOGGLE ENABLED STATUS (PATCH)
  const handleToggleEnabled = async (item) => {
    const updatedEnabledState = !item.enabled

    // Optimistic UI update
    setPreferences(prev =>
      prev.map(p => p.id === item.id ? { ...p, enabled: updatedEnabledState } : p)
    )

    try {
      const response = await fetch(`${API_BASE_URL}/${item.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ enabled: updatedEnabledState })
      })

      if (handleAuthError(response.status)) return

      if (!response.ok) {
        // Revert on failure
        setPreferences(prev =>
          prev.map(p => p.id === item.id ? { ...p, enabled: item.enabled } : p)
        )
        throw new Error('Failed to update status on server')
      }
    } catch (err) {
      console.error('Toggle Error:', err)
      setError(err.message)
    }
  }

  // 4. DELETE PREFERENCE (DELETE)
  const handleDeletePreference = async (id) => {
    if (!window.confirm('Are you sure you want to delete this preference?')) return

    const originalList = [...preferences]
    setPreferences(prev => prev.filter(item => item.id !== id))

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (handleAuthError(response.status)) return

      if (!response.ok) {
        setPreferences(originalList) // Rollback
        throw new Error('Failed to delete preference from server')
      }
      notifySuccess('Preference removed')
    } catch (err) {
      console.error('Delete Error:', err)
      setError(err.message)
    }
  }

  // Modal Handlers
  const handleOpenCreateModal = () => {
    setEditingItem(null)
    setFormData({
      preference_name: '',
      preference_value: '',
      enabled: true
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item) => {
    setEditingItem(item)
    setFormData({
      preference_name: item.preference_name || '',
      preference_value: item.preference_value || '',
      enabled: item.enabled ?? true
    })
    setIsModalOpen(true)
  }

  // Statistics calculation
  const stats = useMemo(() => {
    const total = preferences.length
    const active = preferences.filter(p => p.enabled).length
    const disabled = total - active
    return { total, active, disabled }
  }, [preferences])

  // Filtered list
  const filteredPreferences = useMemo(() => {
    return preferences.filter(item => {
      const name = (item.preference_name || '').toLowerCase()
      const val = (item.preference_value || '').toLowerCase()
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || val.includes(searchQuery.toLowerCase())
      
      if (statusFilter === 'active') return matchesSearch && item.enabled
      if (statusFilter === 'disabled') return matchesSearch && !item.enabled
      return matchesSearch
    })
  }, [preferences, searchQuery, statusFilter])

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Header Banner */}
        <div className="relative overflow-hidden bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-violet-50 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-500/10">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Preferences</h1>
                  <p className="text-xs text-slate-500">Configure global context rules and user parameters</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-medium text-xs rounded-2xl transition-all shadow-sm hover:shadow-md hover:shadow-violet-600/20 active:scale-[0.99]"
            >
              <Plus size={16} />
              <span>Add Preference</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total</span>
                <span className="text-lg font-bold text-slate-900">{stats.total}</span>
              </div>
              <div className="p-2 bg-white rounded-xl text-slate-600 shadow-sm">
                <SlidersHorizontal size={16} />
              </div>
            </div>

            <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-emerald-600/80 uppercase tracking-wider block">Active</span>
                <span className="text-lg font-bold text-emerald-700">{stats.active}</span>
              </div>
              <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm">
                <Check size={16} />
              </div>
            </div>

            <div className="bg-slate-100/60 p-3.5 rounded-2xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Disabled</span>
                <span className="text-lg font-bold text-slate-700">{stats.disabled}</span>
              </div>
              <div className="p-2 bg-white rounded-xl text-slate-500 shadow-sm">
                <Power size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="flex items-center justify-between bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
              <X size={14} />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-600">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search preferences or values..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 placeholder-slate-400 transition-all"
            />
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            {/* Status Tabs */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  statusFilter === 'all' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  statusFilter === 'active' 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('disabled')}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  statusFilter === 'disabled' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Disabled
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
            <Loader2 size={32} className="mx-auto text-violet-600 animate-spin mb-3" />
            <p className="text-xs text-slate-500 font-medium">Fetching preferences from server...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPreferences.length > 0 ? (
              filteredPreferences.map(item => (
                <div
                  key={item.id}
                  className={`group bg-white rounded-2xl border p-4 sm:p-5 transition-all duration-200 hover:shadow-md ${
                    item.enabled 
                      ? 'border-slate-200 hover:border-slate-300' 
                      : 'border-slate-200/70 bg-slate-50/50 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    
                    {/* Details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-semibold text-slate-900 text-sm">
                          {item.preference_name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                          item.enabled 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {item.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="pt-0.5">
                        <div className="text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200/80 p-3 rounded-xl break-all whitespace-pre-wrap leading-relaxed">
                          {item.preference_value}
                        </div>
                      </div>
                    </div>

                    {/* Actions & Switch Toggle */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                          title="Edit Preference"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeletePreference(item.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                          title="Delete Preference"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

                      {/* Switch Toggle */}
                      <button
                        onClick={() => handleToggleEnabled(item)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${
                          item.enabled ? 'bg-violet-600' : 'bg-slate-300'
                        }`}
                        title={item.enabled ? 'Disable preference' : 'Enable preference'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                            item.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
                <Sliders size={36} className="mx-auto text-slate-300 mb-3" />
                <h3 className="font-semibold text-slate-800 text-sm mb-1">No preferences found</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'No records match your active search or filter criteria.' 
                    : 'Get started by adding custom parameters and preference instructions.'}
                </p>
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 px-4 py-2.5 rounded-xl transition-colors"
                >
                  <Plus size={15} />
                  <span>Create Preference</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden scale-in-95 transition-all">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                  <Sparkles size={18} />
                </div>
                <h2 className="font-bold text-slate-900 text-base">
                  {editingItem ? 'Edit Preference' : 'New Preference'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePreference} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preference Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Tone & Writing Style"
                  value={formData.preference_name}
                  onChange={e => setFormData(prev => ({ ...prev, preference_name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 transition-all placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preference Value *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter specific instructions or config value..."
                  value={formData.preference_value}
                  onChange={e => setFormData(prev => ({ ...prev, preference_value: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 transition-all placeholder-slate-400"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={e => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">Set as Active</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all shadow-sm disabled:opacity-50"
                  >
                    {submitting && <Loader2 size={13} className="animate-spin" />}
                    <span>{editingItem ? 'Save Changes' : 'Create'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}