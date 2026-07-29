"use client"
import { useState } from 'react'
import {
  User, Mail, Bell, Palette, Shield, Globe, Download,
  Trash2, ChevronRight, CheckCircle2, Sparkles, Moon, Sun,
  Smartphone, Key, Lock, Eye, EyeOff,
} from 'lucide-react'
import Preferences from '../components/Preferences'
import Gmail from '../components/Gmail'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'gmail', label: 'Gmail Account', icon: Mail },
  { id: 'ai', label: 'AI Preferences', icon: Sparkles },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'language', label: 'Language & Region', icon: Globe },
  { id: 'data', label: 'Data & Export', icon: Download },
]

const Toggle = ({ on, onChange }) => (
  <button
    onClick={onChange}
    className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-[#1a73e8]' : 'bg-[#dadce0]'}`}
    style={{ height: '22px', width: '40px' }}
  >
    <div className={`absolute top-0.5 w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform ${on ? 'translate-x-[20px]' : 'translate-x-0.5'}`} />
  </button>
)

export default function Settings() {
  const [section, setSection] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [settings, setSettings] = useState({
    emailNotifs: true, aiSuggestions: true, weeklyReport: true, securityAlerts: true,
    pushNotifs: false, darkMode: false, autoReply: false, smartReply: true,
    spamDetection: true, priorityDetection: true, summaries: true,
    twoFactor: false, loginAlerts: true,
    language: 'English (US)', timezone: 'Pacific Time (PT)', theme: 'System',
  })

  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }))

  const SettingRow = ({ label, desc, settingKey }) => (
    <div className="flex items-center justify-between py-3.5 border-b border-[#f8fafc] last:border-0">
      <div>
        <div className="text-sm font-medium text-[#202124]">{label}</div>
        {desc && <div className="text-xs text-[#9aa0a6] mt-0.5">{desc}</div>}
      </div>
      <Toggle on={settings[settingKey]} onChange={() => toggle(settingKey)} />
    </div>
  )

  return (
    <div className="flex h-full">
      {/* Settings nav */}
      <div className="w-60 border-r border-[#e8eaed] bg-white flex-shrink-0">
        <div className="p-4 border-b border-[#e8eaed]">
          <h1 className="font-bold text-[#202124]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Settings</h1>
        </div>
        <nav className="p-2">
          {SECTIONS.map(s => {
            const Icon = s.icon
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${section === s.id ? 'bg-blue-50 text-[#1a73e8] font-semibold' : 'text-[#5f6368] hover:text-[#202124] hover:bg-[#f8fafc]'}`}
              >
                <Icon size={16} />
                {s.label}
                {section === s.id && <ChevronRight size={14} className="ml-auto" />}
              </button>
            )
          })}
          <div className="mt-4 pt-4 border-t border-[#e8eaed]">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 size={16} />
              Delete account
            </button>
          </div>
        </nav>
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-6">
        <div className="max-w-2xl space-y-6">
          {section === 'profile' && (
            <>
              <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#f1f3f4]"><h2 className="font-semibold text-[#202124]">Profile Information</h2></div>
                <div className="p-5 space-y-4">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xl font-bold">JD</div>
                    <div>
                      <button className="text-sm text-[#1a73e8] font-medium hover:underline">Change photo</button>
                      <p className="text-xs text-[#9aa0a6] mt-0.5">JPG, PNG or GIF up to 5MB</p>
                    </div>
                  </div>
                  {[
                    { label: 'Display name', value: 'Jane Doe', type: 'text' },
                    { label: 'Email address', value: 'jane@gmail.com', type: 'email' },
                    { label: 'Job title', value: 'Chief Financial Officer', type: 'text' },
                    { label: 'Company', value: 'Acme Corporation', type: 'text' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-xs font-semibold text-[#5f6368] block mb-1.5">{f.label}</label>
                      <input
                        type={f.type}
                        defaultValue={f.value}
                        className="w-full border border-[#e8eaed] rounded-lg px-4 py-2.5 text-sm text-[#202124] focus:outline-none focus:border-[#1a73e8] transition-colors"
                      />
                    </div>
                  ))}
                  <button className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors">
                    Save changes
                  </button>
                </div>
              </div>
            </>
          )}

          {section === 'gmail' && <Gmail/>}

          {section === 'ai' && <Preferences/>}

          {section === 'notifications' && (
            <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f1f3f4]"><h2 className="font-semibold text-[#202124]">Notification Settings</h2></div>
              <div className="px-5 py-3">
                <SettingRow label="Email notifications" desc="Get notified for new emails and replies" settingKey="emailNotifs" />
                <SettingRow label="AI suggestions" desc="Notify when AI generates a draft or insight" settingKey="aiSuggestions" />
                <SettingRow label="Weekly reports" desc="Receive your productivity summary every Monday" settingKey="weeklyReport" />
                <SettingRow label="Security alerts" desc="Important account security notifications" settingKey="securityAlerts" />
                <SettingRow label="Push notifications" desc="Browser and mobile push notifications" settingKey="pushNotifs" />
              </div>
            </div>
          )}

          {section === 'appearance' && (
            <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f1f3f4]"><h2 className="font-semibold text-[#202124]">Appearance & Theme</h2></div>
              <div className="p-5 space-y-5">
                <div>
                  <label className="text-xs font-semibold text-[#5f6368] block mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: 'Light', icon: Sun, preview: 'bg-white border-2' },
                      { name: 'Dark', icon: Moon, preview: 'bg-[#1a1a2e] border-2' },
                      { name: 'System', icon: Smartphone, preview: 'bg-gradient-to-br from-white to-[#1a1a2e] border-2' },
                    ].map(t => {
                      const Icon = t.icon
                      return (
                        <button
                          key={t.name}
                          onClick={() => setSettings(s => ({ ...s, theme: t.name }))}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${settings.theme === t.name ? 'border-[#1a73e8] bg-blue-50' : 'border-[#e8eaed] hover:border-[#dadce0]'}`}
                        >
                          <div className={`w-8 h-8 rounded-lg ${t.preview} flex items-center justify-center`}>
                            <Icon size={16} className={t.name === 'Dark' ? 'text-white' : 'text-[#5f6368]'} />
                          </div>
                          <span className={`text-xs font-medium ${settings.theme === t.name ? 'text-[#1a73e8]' : 'text-[#5f6368]'}`}>{t.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <SettingRow label="Dark mode" desc="Override system theme with dark mode" settingKey="darkMode" />
              </div>
            </div>
          )}

          {section === 'security' && (
            <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f1f3f4]"><h2 className="font-semibold text-[#202124]">Security Settings</h2></div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl border border-[#e8eaed]">
                  <div className="flex items-center gap-3">
                    <Key size={18} className="text-[#5f6368]" />
                    <div>
                      <div className="text-sm font-semibold text-[#202124]">Two-factor authentication</div>
                      <div className="text-xs text-[#9aa0a6]">Not enabled</div>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-[#1a73e8] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">Enable 2FA</button>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5f6368] block mb-1.5">Current password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} defaultValue="••••••••••" className="w-full border border-[#e8eaed] rounded-lg px-4 py-2.5 text-sm text-[#202124] focus:outline-none focus:border-[#1a73e8] pr-10 transition-colors" />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa0a6]">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <SettingRow label="Login alerts" desc="Get notified of new sign-ins to your account" settingKey="loginAlerts" />
                <div className="mt-2">
                  <div className="text-xs font-semibold text-[#5f6368] mb-2">Active Sessions</div>
                  {[
                    { device: 'MacBook Pro · Chrome', location: 'San Francisco, CA', time: 'Current session', current: true },
                    { device: 'iPhone 15 Pro · Safari', location: 'San Francisco, CA', time: '2 days ago', current: false },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-[#f8fafc] last:border-0">
                      <div>
                        <div className="text-xs font-medium text-[#202124]">{s.device}</div>
                        <div className="text-[10px] text-[#9aa0a6]">{s.location} · {s.time}</div>
                      </div>
                      {s.current ? (
                        <span className="text-[10px] bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full font-semibold">Active</span>
                      ) : (
                        <button className="text-[10px] text-red-500 hover:text-red-600 font-medium">Revoke</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === 'language' && (
            <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f1f3f4]"><h2 className="font-semibold text-[#202124]">Language & Region</h2></div>
              <div className="p-5 space-y-4">
                {[
                  { label: 'Language', options: ['English (US)', 'English (UK)', 'Spanish', 'French', 'German', 'Japanese'], current: 'English (US)' },
                  { label: 'Timezone', options: ['Pacific Time (PT)', 'Eastern Time (ET)', 'UTC', 'Central European Time'], current: 'Pacific Time (PT)' },
                  { label: 'Date format', options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], current: 'MM/DD/YYYY' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-xs font-semibold text-[#5f6368] block mb-1.5">{f.label}</label>
                    <select className="w-full border border-[#e8eaed] rounded-lg px-4 py-2.5 text-sm text-[#202124] focus:outline-none focus:border-[#1a73e8] transition-colors bg-white">
                      {f.options.map(o => <option key={o} selected={o === f.current}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'data' && (
            <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f1f3f4]"><h2 className="font-semibold text-[#202124]">Data & Export</h2></div>
              <div className="p-5 space-y-4">
                {[
                  { label: 'Export email data', desc: 'Download all your email data in JSON or CSV format', action: 'Export', color: 'text-[#1a73e8] bg-blue-50 border-blue-200 hover:bg-blue-100' },
                  { label: 'Export AI conversation history', desc: 'Download your AI chat history and generated content', action: 'Export', color: 'text-[#1a73e8] bg-blue-50 border-blue-200 hover:bg-blue-100' },
                  { label: 'Export workflow data', desc: 'Download all your automation rules and workflow history', action: 'Export', color: 'text-[#1a73e8] bg-blue-50 border-blue-200 hover:bg-blue-100' },
                  { label: 'Delete all AI data', desc: 'Permanently delete all AI summaries and generated content', action: 'Delete', color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl border border-[#e8eaed]">
                    <div>
                      <div className="text-sm font-semibold text-[#202124]">{item.label}</div>
                      <div className="text-xs text-[#9aa0a6] mt-0.5">{item.desc}</div>
                    </div>
                    <button className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors flex-shrink-0 ml-4 ${item.color}`}>
                      {item.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(section === 'privacy') && (
            <div className="bg-white border border-[#e8eaed] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f1f3f4]">
                <div className="flex items-center gap-2">
                  <Lock size={15} className="text-[#5f6368]" />
                  <h2 className="font-semibold text-[#202124]">Privacy Settings</h2>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={15} className="text-green-600" />
                    <span className="text-sm font-semibold text-green-700">Privacy Commitment</span>
                  </div>
                  <p className="text-xs text-green-700 leading-relaxed">Your emails are processed ephemerally and never stored on Mailgent servers. We are SOC 2 Type II certified, GDPR compliant, and never use your data to train AI models.</p>
                </div>
                {[
                  { label: 'Share usage analytics', desc: 'Help improve Mailgent with anonymous usage data' },
                  { label: 'Personalization', desc: 'Allow AI to learn from your email patterns to improve suggestions' },
                  { label: 'Read receipts', desc: 'Let senders know when you read their emails' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-[#f8fafc] last:border-0">
                    <div>
                      <div className="text-sm font-medium text-[#202124]">{item.label}</div>
                      <div className="text-xs text-[#9aa0a6] mt-0.5">{item.desc}</div>
                    </div>
                    <Toggle on={i === 1} onChange={() => {}} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
