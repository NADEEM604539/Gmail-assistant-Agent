
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Inbox, MessageSquare, Zap, BarChart3,
  Bell, Search, Settings, User, Mail, ChevronLeft,
  ChevronRight, LogOut, Sparkles, Menu, X,
  PenSquare,
} from 'lucide-react';




const NAV_ITEMS = [
  { id: '', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inbox', label: 'Inbox', icon: Inbox, badge: 12 },
  { id: 'chat', label: 'AI Assistant', icon: MessageSquare, isAI: true },
  { id: 'workflows', label: 'AI Workflows', icon: Zap, isAI: true },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell, badge: 3 },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const pathname = usePathname();
  const currentId = pathname?.split('/').filter(Boolean).pop() || 'dashboard';

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = window.localStorage.getItem('access_token');

      if (!accessToken) {
        setCheckedAuth(true);
        return;
      }

      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${apiBaseUrl}/api/auth/user`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          window.localStorage.removeItem('access_token');
          setCheckedAuth(true);
          return;
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        window.localStorage.removeItem('access_token');
      } finally {
        setCheckedAuth(true);
      }
    };

    checkAuth();
  }, []);

  if (!checkedAuth || !user) {
    return null;
  }

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = currentId === item.id;

    return (
      <Link
        key={item.id}
        href={`/${item.id}`}
        onClick={() => setMobileOpen(false)}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
          ${isActive
            ? 'bg-[#1a73e8] text-white shadow-sm'
            : 'text-slate-900/90 hover:text-slate-900 hover:bg-slate-100'}
          ${collapsed ? 'justify-center px-0' : ''}
        `}
        title={collapsed ? item.label : undefined}
      >
        <Icon size={17} className={item.isAI && !isActive ? 'text-[#1a73e8]' : 'text-slate-700'} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {item.isAI && !isActive && (
              <span className="text-[10px] bg-[#1a73e8]/15 text-[#1a73e8] border border-[#1a73e8]/20 px-1.5 py-0.5 rounded-full font-medium">AI</span>
            )}
            {item.badge && (
              <span className="text-[11px] bg-[#1a73e8] text-white px-1.5 py-0.5 rounded-full font-semibold min-w-[18px] text-center">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  const initials = user.name
    ? user.name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'JD';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-200 ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
          <Mail size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-slate-900 font-semibold text-base">Mailgent</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Sparkles size={10} className="text-red-600" />
              <span className="text-slate-500 text-xs font-medium">AI-Powered</span>
            </div>
          </div>
        )}
      </div>

      {!collapsed ? (
        <div className="px-3 pt-4 pb-2">
          <button
            type="button"
            className="w-full flex items-center gap-2 bg-[#1a73e8] hover:bg-[#1669c1] text-white rounded-full px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <PenSquare size={15} />
            Compose
          </button>
        </div>
      ) : (
        <div className="px-2 pt-4 pb-2 flex justify-center">
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center bg-[#1a73e8] hover:bg-[#1669c1] text-white rounded-full transition-colors"
          >
            <PenSquare size={15} />
          </button>
        </div>
      )}

      <nav className="flex-1 px-2 py-2 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map(renderNavItem)}
      </nav>

      <div className={`border-t border-slate-200 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-slate-900 text-sm font-medium truncate">{user.name || 'User'}</div>
              <div className="text-slate-500 text-xs truncate">{user.email || ''}</div>
            </div>
            <button type="button" className="text-slate-500 hover:text-slate-900 transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className={`hidden md:flex flex-col bg-white transition-all duration-200 flex-shrink-0 relative border-r border-slate-200 ${collapsed ? 'w-16' : 'w-56'}`}>
        {sidebarContent}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors z-10"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 rounded-lg bg-white p-2 shadow-lg text-slate-600"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col border-r border-slate-200">
            <div className="flex items-center justify-between px-4 py-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                  <Mail size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-slate-900 font-semibold">Mailgent</div>
                  <div className="text-slate-500 text-xs">AI-Powered</div>
                </div>
              </div>
              <button type="button" onClick={() => setMobileOpen(false)} className="text-slate-500 hover:text-slate-900">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {NAV_ITEMS.map(renderNavItem)}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
