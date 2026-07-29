import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  Bot, 
  Mail, 
  Loader2,
  Unplug
} from 'lucide-react';

const GmailAccountManager = () => {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [error, setError] = useState(null);

  // Safely resolve base API URL (falls back to relative path if omitted)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  // Helper to construct headers with the Authorization Bearer Token
  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  };

  // 1. Fetch Account Details
  useEffect(() => {
    const fetchAccountDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/gmail/account`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        
        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        setAccount(data);
      } catch (err) {
        console.error('API Fetch Error:', err);
        setError('Failed to load Gmail account details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountDetails();
  }, [API_BASE_URL]);

  // 2. Toggle Auto-Reply State
  const handleToggleAutoReply = async () => {
    if (!account || toggleLoading) return;

    const nextAutoReplyState = !account.auto_reply;
    setToggleLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/gmail/account/auto-reply`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ auto_reply: nextAutoReplyState }), // Only sending auto_reply state
      });

      if (!response.ok) {
        throw new Error('Failed to update auto-reply status on server.');
      }

      // Sync state on successful server response
      setAccount((prev) => ({ ...prev, auto_reply: nextAutoReplyState }));
    } catch (err) {
      console.error('Toggle Error:', err);
      alert('Could not update auto-reply setting. Please check your connection.');
    } finally {
      setToggleLoading(false);
    }
  };

  // Helper: Format Date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper: Get Initials
  const getInitials = (email) => {
    return email ? email.substring(0, 2).toUpperCase() : 'GM';
  };

  // Loading UI State
  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-12 bg-white border border-[#e8eaed] rounded-2xl flex flex-col items-center justify-center space-y-3 shadow-sm">
        <Loader2 className="w-7 h-7 text-[#1a73e8] animate-spin" />
        <p className="text-xs text-[#5f6368] font-medium">Fetching account details...</p>
      </div>
    );
  }

  // Error UI State
  if (error) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs text-center font-medium flex flex-col items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white border border-[#e8eaed] rounded-2xl shadow-sm overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#f1f3f4] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-[#1a73e8]" />
            <h2 className="font-semibold text-[#202124] text-sm sm:text-base">Connected Gmail Account</h2>
          </div>

          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            account?.status === 'ACTIVE' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
              : 'bg-amber-50 text-amber-700 border border-amber-200/60'
          }`}>
            {account?.status === 'ACTIVE' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            {account?.status}
          </span>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Account Profile Card */}
          <div className="flex items-center justify-between gap-4 p-4 bg-[#f8fafc] rounded-xl border border-[#e8eaed]">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-inner shrink-0">
                {getInitials(account?.email_address)}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[#202124] text-sm sm:text-base">{account?.email_address}</span>
                  {account?.is_primary && (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-[#1a73e8] border border-blue-200/80 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      <ShieldCheck size={11} /> Primary
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-[#5f6368] mt-1">
                  <Clock size={12} className="text-[#9aa0a6]" />
                  <span>Connected {formatDate(account?.connected_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Single Auto-Reply Toggle Card */}
          <div className="p-4 sm:p-5 border border-[#e8eaed] rounded-xl bg-white flex items-center justify-between gap-4 hover:border-[#d2e3fc] transition-colors">
            
            <div className="flex items-center gap-3.5">
              <div className={`p-2.5 rounded-xl transition-colors ${account?.auto_reply ? 'bg-blue-50 text-[#1a73e8]' : 'bg-[#f1f3f4] text-[#9aa0a6]'}`}>
                <Bot size={22} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#202124]">Auto-Reply Mode</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    account?.auto_reply ? 'bg-blue-50 text-[#1a73e8]' : 'bg-[#f1f3f4] text-[#5f6368]'
                  }`}>
                    {account?.auto_reply ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-xs text-[#5f6368] mt-0.5">
                  Send automated replies for incoming messages received on this account.
                </p>
              </div>
            </div>

            {/* Interactive Switch */}
            <button
              onClick={handleToggleAutoReply}
              disabled={toggleLoading}
              aria-label="Toggle auto reply mode"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                account?.auto_reply ? 'bg-[#1a73e8]' : 'bg-[#dadce0]'
              } ${toggleLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                  account?.auto_reply ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                {toggleLoading && <Loader2 size={10} className="animate-spin text-[#1a73e8]" />}
              </span>
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};

export default GmailAccountManager;