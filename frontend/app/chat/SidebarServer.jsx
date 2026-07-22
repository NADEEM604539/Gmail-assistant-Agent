import Link from "next/link";
import { ChatBubbleLeftRight, Plus } from "lucide-react";
import { loadThreads } from "./chatStorage";

export default function Sidebar({ activeId }) {
  const threads = loadThreads();

  return (
    <aside className="hidden xl:flex flex-col gap-4 rounded-[26px] border border-white/10 bg-slate-950/95 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.3)]">
      <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-black/10">
        <span className="flex items-center gap-2 text-slate-100">
          <ChatBubbleLeftRight size={18} />
          Mailgent
        </span>
        <Link href="/chat" className="rounded-2xl bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400">
          + New chat
        </Link>
      </div>

      <div className="space-y-3 overflow-hidden rounded-[26px] border border-white/10 bg-slate-900/90 p-3">
        {threads.map((thread) => (
          <Link
            key={thread.id}
            href={`/chat/${thread.id}`}
            className={`block rounded-2xl px-4 py-3 text-sm transition ${
              activeId === thread.id
                ? "bg-cyan-500/20 text-white"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {thread.title}
          </Link>
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
