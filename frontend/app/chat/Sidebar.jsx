import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  ChevronLeft,
  Plus,
  Search,
  Settings,
  LayoutDashboard,
  Inbox,
  LogOut,
  Menu,
  MessageSquare,
} from "lucide-react";



export default function Sidebar({
  conversations = [],
  activeId,
  onNew,
  collapsed,
  onToggle,
}) {
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = conversations.filter((c) => {
    if (!c || typeof c.title !== "string") return false;
    return c.title.toLowerCase().includes(normalizedSearch);
  });

  // -----------------------------
  // Collapsed Sidebar
  // -----------------------------
  if (collapsed) {
    return (
      <aside className="flex h-screen w-[64px] shrink-0 flex-col items-center border-r border-zinc-800 bg-[#0b0b0b] py-4">
        <button
          onClick={onToggle}
          className="mb-5 rounded-xl p-2.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          <Menu size={18} />
        </button>

        <button
          onClick={onNew}
          className="rounded-xl border border-zinc-700 bg-zinc-900 p-2.5 text-white transition hover:bg-zinc-800"
        >
          <Plus size={18} />
        </button>

        <div className="flex-1" />

        <button className="mb-2 rounded-xl p-2.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white">
          <Settings size={18} />
        </button>

        <button className="rounded-xl p-2.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white">
          <LogOut size={18} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex h-screen w-[285px] shrink-0 flex-col border-r border-zinc-800 bg-[#0b0b0b] text-white">

      {/* =======================
            Header
      ======================= */}

      <div className="border-b border-zinc-800 px-5 py-5">

        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
              <Mail size={18} className="text-black" />
            </div>

            <div>
              <h2 className="text-[16px] font-semibold tracking-tight">
                Mailgent
              </h2>

              <p className="text-xs text-zinc-500">
                AI Email Assistant
              </p>
            </div>
          </div>

          <button
            onClick={onToggle}
            className="rounded-xl p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* New Chat */}

        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-medium transition-all hover:bg-zinc-800"
        >
          <Plus size={17} />
          New Conversation
        </button>

      </div>

      {/* =======================
            Search
      ======================= */}

      <div className="border-b border-zinc-800 p-4">

        <div className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3">

          <Search
            size={16}
            className="text-zinc-500"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
          />

        </div>

      </div>

      {/* =======================
          Recent Conversations
      ======================= */}

      <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide">

        <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Recent
        </p>

        <div className="space-y-1">

          {filtered.map((conversation) => (

            <Link
              key={conversation.id}
              href={`/chat/${conversation.id}`}
              className={`group flex items-start gap-3 rounded-2xl px-3 py-3 transition-all duration-200

              ${
                activeId === conversation.id
                  ? "bg-zinc-800"
                  : "hover:bg-zinc-900"
              }
              
              `}
            >

              <MessageSquare
                size={16}
                className="mt-0.5 shrink-0 text-zinc-500 group-hover:text-white"
              />

              <div className="min-w-0 flex-1">

                <div className="flex items-center justify-between gap-2">

                  <h3 className="truncate text-sm font-medium text-white">
                    {conversation.title || "Untitled Conversation"}
                  </h3>

                  <span className="text-[10px] text-zinc-500">
                    {conversation.timestamp || "Now"}
                  </span>

                </div>

                <p className="mt-1 truncate text-xs text-zinc-500">
                  {conversation.preview || "No preview available."}
                </p>

              </div>

            </Link>

          ))}

        </div>

      </div>

      {/* =======================
            Footer
      ======================= */}

      <div className="border-t border-zinc-800 p-3">

        {[
          {
            icon: <LayoutDashboard size={17} />,
            label: "Dashboard",
          },
          {
            icon: <Inbox size={17} />,
            label: "Inbox",
          },
          {
            icon: <Settings size={17} />,
            label: "Settings",
          },
        ].map((item) => (
          <button
            key={item.label}
            className="mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-zinc-400 transition-all hover:bg-zinc-900 hover:text-white"
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        <div className="my-3 border-t border-zinc-800" />

        <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-zinc-400 transition-all hover:bg-zinc-900 hover:text-white">
          <LogOut size={17} />
          Logout
        </button>

      </div>

    </aside>
  );
}