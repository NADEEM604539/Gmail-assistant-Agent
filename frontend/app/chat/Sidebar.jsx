"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChatBubbleLeftRight, Plus } from "lucide-react";

const STORAGE_KEY = "mailgent_chat_threads";
const defaultThreads = [
  { id: "welcome", title: "Welcome to Mailgent" },
  { id: "urgent-emails", title: "Urgent emails summary" },
  { id: "draft-reply", title: "Draft a reply for client" },
];

function loadThreads() {
  if (typeof window === "undefined") return defaultThreads;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultThreads;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultThreads;
  } catch {
    return defaultThreads;
  }
}

function saveThreads(threads) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

export default function Sidebar({ activeId }) {
  const router = useRouter();
  const [threads, setThreads] = useState(defaultThreads);

  useEffect(() => {
    setThreads(loadThreads());
  }, []);

  const handleNewChat = () => {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const next = [{ id, title: "New chat" }, ...threads];
    setThreads(next);
    saveThreads(next);
    router.push(`/chat/${id}`);
  };

  const handleSelect = (id) => {
    router.push(`/chat/${id}`);
  };

  return (
    <aside className="hidden xl:flex flex-col gap-4 rounded-[26px] border border-white/10 bg-slate-950/95 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.3)]">
      <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-black/10">
        <span className="flex items-center gap-2 text-slate-100">
          <ChatBubbleLeftRight size={18} />
          Mailgent
        </span>
        <button
          type="button"
          onClick={handleNewChat}
          className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          <Plus size={14} />
          New chat
        </button>
      </div>

      <div className="space-y-3 overflow-hidden rounded-[26px] border border-white/10 bg-slate-900/90 p-3">
        {threads.map((thread) => (
          <button
            key={thread.id}
            type="button"
            onClick={() => handleSelect(thread.id)}
            className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
              activeId === thread.id
                ? "bg-cyan-500/20 text-white"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {thread.title}
          </button>
        ))}
      </div>

      <div className="rounded-[26px] border border-white/10 bg-slate-900/90 p-4 text-sm text-slate-400">
        <p className="font-semibold text-slate-100">Tips</p>
        <ul className="mt-3 space-y-2">
          <li>• Ask about unread or urgent emails.</li>
          <li>• Request draft replies for any thread.</li>
          <li>• Use the sidebar to return to older chats.</li>
        </ul>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-slate-900/90 p-4 text-sm text-slate-400">
        <Link href="/" className="text-cyan-300 hover:text-cyan-200">
          Back to dashboard
        </Link>
      </div>
    </aside>
  );
}
