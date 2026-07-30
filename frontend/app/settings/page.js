"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, Mail, Bell, Palette, Shield, Globe, Download,
  Trash2, ChevronRight, CheckCircle2, Sparkles, Moon, Sun,
  Smartphone, Key, Lock, Eye, EyeOff, LogOut, AlertTriangle
} from 'lucide-react'
import Preferences from '../components/Preferences'
import Gmail from '../components/Gmail'
import Profile from '../components/Profile'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'gmail', label: 'Gmail Account', icon: Mail },
  { id: 'ai', label: 'AI Preferences', icon: Sparkles }
]

export default function Settings() {
  const [section, setSection] = useState('profile')
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const router = useRouter()

  // 1. Auth Check on Mount
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = window.localStorage.getItem("access_token");

      if (!accessToken) {
        setStatus("unauthenticated");
        router.push('/');
        return;
      }

      try {
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

        const response = await fetch(`${apiBaseUrl}/api/auth/user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          window.localStorage.removeItem("access_token");
          setUser(null);
          setStatus("unauthenticated");
          router.push('/');
          return;
        }

        const data = await response.json();
        setUser(data);
        setStatus("authenticated");
      } catch (error) {
        window.localStorage.removeItem("access_token");
        setUser(null);
        setStatus("unauthenticated");
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  // 2. Perform Logout action
  const handleConfirmLogout = () => {
    window.localStorage.removeItem("access_token");
    setUser(null);
    setStatus("unauthenticated");
    setShowLogoutModal(false);
    router.push('/');
  }

  // Prevent rendering UI until initial auth check finishes
  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center bg-[#f8fafc]">
        <div className="text-[#5f6368] text-sm font-medium">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="flex h-full relative">
      {/* Settings nav */}
      <div className="w-60 border-r border-[#e8eaed] bg-white flex-shrink-0 flex flex-col justify-between">
        <div>
          <div className="p-4 border-b border-[#e8eaed]">
            <h1 className="font-bold text-[#202124]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Settings
            </h1>
          </div>
          <nav className="p-2 space-y-1">
            {SECTIONS.map(s => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    section === s.id 
                      ? 'bg-blue-50 text-[#1a73e8] font-semibold' 
                      : 'text-[#5f6368] hover:text-[#202124] hover:bg-[#f8fafc]'
                  }`}
                >
                  <Icon size={16} />
                  {s.label}
                  {section === s.id && <ChevronRight size={14} className="ml-auto" />}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Logout Action Button */}
        <div className="p-2 border-t border-[#e8eaed]">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-6">
        <div className="max-w-2xl space-y-6">
          {section === 'profile' && <Profile />}
          {section === 'gmail' && <Gmail />}
          {section === 'ai' && <Preferences />}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#e8eaed] space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#202124]">Confirm Log Out</h3>
            </div>

            <p className="text-sm text-[#5f6368] leading-relaxed">
              Are you sure you want to log out? Logging out will <strong>stop all automated email handling</strong> and <strong>auto-replying features</strong> will no longer function.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#5f6368] hover:bg-[#f8fafc] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}