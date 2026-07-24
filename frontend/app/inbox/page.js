"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  Star,
  Sparkles,
  Paperclip,
  RefreshCw,
  ChevronDown,
  Filter,
  Archive,
  Trash2,
  MoreHorizontal,
  CheckSquare,
  Square,
  Inbox as InboxIcon,
  Send,
  FileText,
  Mail,
  MailOpen,
  AlertCircle,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// High-level filters. `match` decides whether an email passes the filter.
const FILTERS = [
  {
    id: "all",
    label: "All Mail",
    icon: Mail,
    match: () => true,
  },
  {
    id: "unread",
    label: "Unread",
    icon: MailOpen,
    match: (email) => !!email.unread,
  },
  {
    id: "starred",
    label: "Starred",
    icon: Star,
    match: (email) => !!email.starred,
  },
  {
    id: "important",
    label: "Important",
    icon: AlertCircle,
    match: (email) => !!email.important,
  },
  {
    id: "attachments",
    label: "Has attachments",
    icon: Paperclip,
    match: (email) => (email.attachments?.length || 0) > 0,
  },
  {
    id: "inbox",
    label: "Inbox",
    icon: InboxIcon,
    match: (email) => email.labels?.includes("INBOX"),
  },
  {
    id: "sent",
    label: "Sent",
    icon: Send,
    match: (email) => email.labels?.includes("SENT"),
  },
  {
    id: "draft",
    label: "Drafts",
    icon: FileText,
    match: (email) => email.labels?.includes("DRAFT"),
  },
];

// Determine which "category" an email belongs to for routing purposes.
// Priority: draft > sent > inbox (falls back to inbox if nothing matches).
const getEmailCategory = (email) => {
  const labels = email.labels || [];
  if (labels.includes("DRAFT")) return "draft";
  if (labels.includes("SENT")) return "sent";
  if (labels.includes("INBOX")) return "inbox";
  return "inbox";
};

export default function Inbox({ navigate }) {
  const router = useRouter();

  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(new Set());
  const [showAI, setShowAI] = useState(true);

  const [activeFilter, setActiveFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    initialize();
  }, []);

  // Close the filter dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initialize = async () => {
    setLoading(true);

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/");
      return;
    }

    try {
      // Verify authentication
      const authResponse = await fetch(`${API}/api/auth/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!authResponse.ok) {
        localStorage.removeItem("access_token");
        router.replace("/");
        return;
      }

      // Load inbox
      await fetchEmails(token);
    } catch (err) {
      console.error(err);

      localStorage.removeItem("access_token");
      router.replace("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmails = async (
    token = localStorage.getItem("access_token")
  ) => {
    try {
      const response = await fetch(`${API}/api/gmail/inbox`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch emails");
      }

      const data = await response.json();
      console.log(data);
      setEmails(data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selected);

    if (next.has(id)) next.delete(id);
    else next.add(id);

    setSelected(next);
  };

  const allSelected =
    emails.length > 0 &&
    emails.every((email) => selected.has(email.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(emails.map((e) => e.id)));
    }
  };

  // Handle a row click: figure out the email's category and route there
  const handleEmailClick = (email) => {
    const category = getEmailCategory(email);
    navigate?.(`${category}/${email.id}`);
  };

  const activeFilterConfig = useMemo(
    () => FILTERS.find((f) => f.id === activeFilter) || FILTERS[0],
    [activeFilter]
  );

  const filtered = useMemo(
    () => emails.filter((email) => activeFilterConfig.match(email)),
    [emails, activeFilterConfig]
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6f8fc]">
        <div className="flex flex-col items-center">
          <div className="relative">
            <RefreshCw
              size={42}
              className="animate-spin text-[#1a73e8]"
            />

            <div className="absolute inset-0 rounded-full border-4 border-[#e8f0fe]" />
          </div>

          <h2 className="mt-6 text-lg font-semibold text-[#202124]">
            Loading your inbox
          </h2>

          <p className="mt-2 text-sm text-[#5f6368]">
            Fetching your latest emails...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[#e8eaed] bg-[#f8f9fa] px-5 py-3">
        <button
          onClick={toggleAll}
          className="rounded-full p-2 hover:bg-[#e8eaed]"
        >
          {allSelected ? (
            <CheckSquare
              size={18}
              className="text-[#1a73e8]"
            />
          ) : (
            <Square
              size={18}
              className="text-[#5f6368]"
            />
          )}
        </button>

        <button
          onClick={() => fetchEmails()}
          className="rounded-full p-2 hover:bg-[#e8eaed]"
        >
          <RefreshCw
            size={18}
            className="text-[#5f6368]"
          />
        </button>

        <button className="rounded-full p-2 hover:bg-[#e8eaed]">
          <MoreHorizontal
            size={18}
            className="text-[#5f6368]"
          />
        </button>

        {selected.size > 0 && (
          <div className="ml-3 flex items-center gap-2 border-l border-[#dadce0] pl-4">
            <span className="text-sm text-[#5f6368]">
              {selected.size} selected
            </span>

            <button
              title="Archive"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#5f6368] transition-all duration-150 hover:bg-[#fce8e6] hover:text-[#d93025]"
            >
              <Archive size={20} strokeWidth={2.2} />
            </button>

            <button
              title="Delete"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#5f6368] transition-all duration-150 hover:bg-[#fce8e6] hover:text-[#d93025]"
            >
              <Trash2 size={20} strokeWidth={2.2} />
            </button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setShowAI(!showAI)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${showAI
              ? "border-[#d2e3fc] bg-[#e8f0fe] text-[#1a73e8]"
              : "border-[#dadce0] bg-white text-[#5f6368]"
              }`}
          >
            <Sparkles size={14} />
            AI Summary
          </button>

          {/* Filter dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${activeFilter !== "all"
                ? "border-[#d2e3fc] bg-[#e8f0fe] text-[#1a73e8]"
                : "border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f1f3f4]"
                }`}
            >
              <Filter size={14} />
              {activeFilterConfig.label}
              <ChevronDown
                size={14}
                className={`transition-transform ${filterOpen ? "rotate-180" : ""}`}
              />
            </button>

            {filterOpen && (
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-[#dadce0] bg-white py-2 shadow-lg">
                {FILTERS.map((f) => {
                  const Icon = f.icon;
                  const isActive = f.id === activeFilter;
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        setActiveFilter(f.id);
                        setFilterOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${isActive
                        ? "bg-[#e8f0fe] text-[#1a73e8]"
                        : "text-[#3c4043] hover:bg-[#f1f3f4]"
                        }`}
                    >
                      <Icon size={15} />
                      <span className="flex-1">{f.label}</span>
                      {isActive && <Check size={15} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#e8eaed]">
        {filtered.map((email) => (
          <div
            key={email.id}
            onClick={() => handleEmailClick(email)}
            className={`group flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors hover:bg-[#f5f5f5] ${email.unread
              ? "bg-[#f8fbff]"
              : "bg-white"
              }`}
          >
            {/* Checkbox */}
            <div className="mt-1 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(email.id);
                }}
                className={`transition-opacity ${selected.has(email.id)
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
                  }`}
              >
                {selected.has(email.id) ? (
                  <CheckSquare
                    size={18}
                    className="text-[#1a73e8]"
                  />
                ) : (
                  <Square
                    size={18}
                    className="text-[#9aa0a6]"
                  />
                )}
              </button>

              <button
                onClick={(e) => e.stopPropagation()}
              >
                <Star
                  size={17}
                  className={
                    email.starred
                      ? "fill-[#fbbc04] text-[#fbbc04]"
                      : "text-[#dadce0]"
                  }
                />
              </button>
            </div>

            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-sm font-semibold text-white" >
              {(email.from?.name ||
                email.from?.email ||
                "?")
                .substring(0, 2)
                .toUpperCase()}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 overflow-hidden" onClick={()=>router.push(`${getEmailCategory(email)}/${email.id}`)}>
              <div className="flex flex-wrap items-center gap-2" >
                <span
                  className={`text-[14px] leading-5 break-words ${email.unread
                    ? "font-semibold text-[#202124]"
                    : "font-medium text-[#202124]"
                    }`}
                >
                  {email.from?.name ||
                    email.from?.email}
                </span>

                <span className="rounded-full bg-[#f1f3f4] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#5f6368]">
                  {getEmailCategory(email)}
                </span>
              </div>

              <div
                className={`mt-1 text-[14px] leading-5 break-words ${email.unread
                  ? "font-semibold text-[#202124]"
                  : "font-medium text-[#202124]"
                  }`}
              >
                {email.subject || "(no subject)"}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="leading-5 break-words text-[#5f6368]">
                  {email.snippet}
                </span>

                {showAI && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#e8f0fe] px-2 py-1 text-[11px] font-medium text-[#1a73e8]">
                    <Sparkles size={10} />
                    AI Summary
                  </span>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="ml-4 flex shrink-0 flex-col items-end gap-2">
              <span
                className={`text-xs ${email.unread
                  ? "font-semibold text-[#202124]"
                  : "text-[#5f6368]"
                  }`}
              >
                {new Date(
                  email.date
                ).toLocaleDateString()}
              </span>

              <div className="flex items-center gap-2">
                {email.attachments?.length > 0 && (
                  <Paperclip
                    size={14}
                    className="text-[#5f6368]"
                  />
                )}

                {email.unread && (
                  <div className="h-2.5 w-2.5 rounded-full bg-[#1a73e8]" />
                )}
              </div>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-[#5f6368]">
            <span>No emails match this filter.</span>
            {activeFilter !== "all" && (
              <button
                onClick={() => setActiveFilter("all")}
                className="text-sm font-medium text-[#1a73e8] hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex h-12 shrink-0 items-center justify-between border-t border-[#e8eaed] bg-[#f8f9fa] px-5 text-sm text-[#5f6368]">
        <span>
          {filtered.length === 0
            ? 0
            : 1}
          –{filtered.length} of {emails.length}
        </span>

        <div className="flex gap-2">
          <button className="rounded-full p-2 hover:bg-[#e8eaed]">
            <ChevronDown
              size={16}
              className="rotate-90"
            />
          </button>

          <button className="rounded-full p-2 hover:bg-[#e8eaed]">
            <ChevronDown
              size={16}
              className="-rotate-90"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
