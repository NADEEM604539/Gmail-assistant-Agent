"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Archive,
  Trash2,
  AlertOctagon,
  Clock,
  MoreVertical,
  Star,
  Reply,
  ReplyAll,
  Forward,
  Paperclip,
  Download,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  ChevronDown,
  ChevronUp,
  Printer,
  ExternalLink,
  Mail,
  MailOpen,
  Info,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Music,
  Film,
  FileArchive,
  Tag,
  X,
  RefreshCw,
  AlertTriangle,
  Inbox as InboxIcon,
  Send,
  Users,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AVATAR_PALETTE = [
  "#1a73e8",
  "#d93025",
  "#188038",
  "#e37400",
  "#8430ce",
  "#c5221f",
  "#12805c",
  "#b0682e",
];

function avatarColor(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function getInitials(name, email) {
  const source = (name || email || "?").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.substring(0, 2).toUpperCase();
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatFullDate(date) {
  if (!date) return "";
  try {
    return new Date(date).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function fileIcon(mimeType = "") {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return Film;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("zip") || mimeType.includes("compressed"))
    return FileArchive;
  return FileIcon;
}

function securityBadge(verdict) {
  const value = (verdict || "").toLowerCase();
  if (value === "pass") {
    return { icon: ShieldCheck, color: "#188038", bg: "#e6f4ea", label: "Pass" };
  }
  if (value === "fail" || value === "softfail") {
    return { icon: ShieldAlert, color: "#d93025", bg: "#fce8e6", label: "Fail" };
  }
  return {
    icon: ShieldQuestion,
    color: "#5f6368",
    bg: "#f1f3f4",
    label: value ? value : "Unknown",
  };
}

const FOLDER_META = {
  inbox: { label: "Inbox", icon: InboxIcon },
  sent: { label: "Sent", icon: Send },
  draft: { label: "Draft", icon: FileText },
  trash: { label: "Trash", icon: Trash2 },
  spam: { label: "Spam", icon: AlertOctagon },
  chat: { label: "Chat", icon: Mail },
  other: { label: "Mail", icon: Mail },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [starred, setStarred] = useState(false);
  const [unread, setUnread] = useState(false);
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [replyMode, setReplyMode] = useState(null); // 'reply' | 'replyAll' | 'forward' | null
  const [iframeHeight, setIframeHeight] = useState(200);

  const iframeRef = useRef(null);

  useEffect(() => {
    if (id) fetchEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchEmail = async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/");
      return;
    }

    try {
      const response = await fetch(`${API}/api/gmail/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        router.replace("/");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load this email");
      }

      const data = await response.json();
      setEmail(data);
      setStarred(!!data.flags?.starred);
      setUnread(!!data.flags?.unread);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleIframeLoad = () => {
    try {
      const doc = iframeRef.current?.contentWindow?.document;
      if (doc?.body) {
        setIframeHeight(doc.body.scrollHeight + 24);
      }
    } catch {
      // cross-origin or empty doc — ignore
    }
  };

  const allRecipients = useMemo(() => {
    if (!email) return [];
    return [
      ...(email.to || []),
      ...(email.cc || []),
      ...(email.bcc || []),
      ...(email.reply_to || []),
    ];
  }, [email]);

  const recipientSummary = useMemo(() => {
    if (!email?.to?.length) return "";
    const names = email.to.map((r) => r.name || r.email);
    if (names.length === 1) return `to ${names[0]}`;
    return `to ${names.slice(0, 2).join(", ")}${
      names.length > 2 ? ` and ${names.length - 2} more` : ""
    }`;
  }, [email]);

  const folderMeta = FOLDER_META[email?.folder] || FOLDER_META.other;

  // -------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6f8fc]">
        <div className="flex flex-col items-center">
          <div className="relative">
            <RefreshCw size={42} className="animate-spin text-[#1a73e8]" />
            <div className="absolute inset-0 rounded-full border-4 border-[#e8f0fe]" />
          </div>
          <h2 className="mt-6 text-lg font-semibold text-[#202124]">
            Loading message
          </h2>
          <p className="mt-2 text-sm text-[#5f6368]">
            Fetching this email...
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------
  if (error || !email) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#f6f8fc]">
        <AlertTriangle size={40} className="text-[#d93025]" />
        <h2 className="mt-4 text-lg font-semibold text-[#202124]">
          {error || "Email not found"}
        </h2>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-full border border-[#dadce0] px-4 py-2 text-sm text-[#5f6368] hover:bg-[#f1f3f4]"
          >
            Go back
          </button>
          <button
            onClick={fetchEmail}
            className="rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1765cc]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const sec = email.security || {};
  const thread = email.thread || {};
  const mailingList = email.mailing_list || {};

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-1 border-b border-[#e8eaed] bg-[#f8f9fa] px-3 py-2">
        <button
          onClick={() => router.back()}
          title="Back"
          className="rounded-full p-2 hover:bg-[#e8eaed]"
        >
          <ArrowLeft size={19} className="text-[#5f6368]" />
        </button>

        <div className="mx-1 h-6 w-px bg-[#dadce0]" />

        <button title="Archive" className="rounded-full p-2 hover:bg-[#e8eaed]">
          <Archive size={18} className="text-[#5f6368]" />
        </button>
        <button
          title="Report spam"
          className="rounded-full p-2 hover:bg-[#e8eaed]"
        >
          <AlertOctagon size={18} className="text-[#5f6368]" />
        </button>
        <button title="Delete" className="rounded-full p-2 hover:bg-[#e8eaed]">
          <Trash2 size={18} className="text-[#5f6368]" />
        </button>

        <div className="mx-1 h-6 w-px bg-[#dadce0]" />

        <button
          title={unread ? "Mark as read" : "Mark as unread"}
          onClick={() => setUnread((v) => !v)}
          className="rounded-full p-2 hover:bg-[#e8eaed]"
        >
          {unread ? (
            <Mail size={18} className="text-[#5f6368]" />
          ) : (
            <MailOpen size={18} className="text-[#5f6368]" />
          )}
        </button>
        <button title="Snooze" className="rounded-full p-2 hover:bg-[#e8eaed]">
          <Clock size={18} className="text-[#5f6368]" />
        </button>
        <button title="Labels" className="rounded-full p-2 hover:bg-[#e8eaed]">
          <Tag size={18} className="text-[#5f6368]" />
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button title="Print" className="rounded-full p-2 hover:bg-[#e8eaed]">
            <Printer size={18} className="text-[#5f6368]" />
          </button>
          <button
            title="Open in new window"
            className="rounded-full p-2 hover:bg-[#e8eaed]"
          >
            <ExternalLink size={18} className="text-[#5f6368]" />
          </button>
          <button title="More" className="rounded-full p-2 hover:bg-[#e8eaed]">
            <MoreVertical size={18} className="text-[#5f6368]" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-6">
          {/* Subject + badges */}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] font-normal leading-8 text-[#202124]">
              {email.subject || "(no subject)"}
            </h1>

            <span className="flex items-center gap-1 rounded-full bg-[#f1f3f4] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-[#5f6368]">
              <folderMeta.icon size={11} />
              {folderMeta.label}
            </span>

            {email.category && (
              <span className="rounded-full bg-[#e8f0fe] px-2.5 py-1 text-[11px] font-medium capitalize text-[#1a73e8]">
                {email.category}
              </span>
            )}

            {thread.is_reply && (
              <span className="rounded-full bg-[#fef7e0] px-2.5 py-1 text-[11px] font-medium text-[#b06000]">
                Reply
              </span>
            )}
            {thread.is_forward && (
              <span className="rounded-full bg-[#fef7e0] px-2.5 py-1 text-[11px] font-medium text-[#b06000]">
                Forward
              </span>
            )}
            {email.flags?.important && (
              <span className="rounded-full bg-[#fce8e6] px-2.5 py-1 text-[11px] font-medium text-[#d93025]">
                Important
              </span>
            )}
          </div>

          {/* Sender card */}
          <div className="mt-5 flex items-start gap-4 border-b border-[#e8eaed] pb-5">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold text-white"
              style={{ backgroundColor: avatarColor(email.from?.email) }}
            >
              {getInitials(email.from?.name, email.from?.email)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-[15px] font-semibold text-[#202124]">
                  {email.from?.name || email.from?.email}
                </span>
                <span className="text-[13px] text-[#5f6368]">
                  &lt;{email.from?.email}&gt;
                </span>
              </div>

              <button
                onClick={() => setRecipientsOpen((v) => !v)}
                className="mt-0.5 flex items-center gap-1 text-[13px] text-[#5f6368] hover:text-[#202124]"
              >
                {recipientSummary}
                {recipientsOpen ? (
                  <ChevronUp size={13} />
                ) : (
                  <ChevronDown size={13} />
                )}
              </button>

              {recipientsOpen && (
                <div className="mt-3 space-y-2 rounded-lg border border-[#e8eaed] bg-[#f8f9fa] p-3 text-[13px]">
                  {["to", "cc", "bcc", "reply_to"].map((type) => {
                    const list = email[type === "reply_to" ? "reply_to" : type];
                    if (!list?.length) return null;
                    const labelMap = {
                      to: "To",
                      cc: "Cc",
                      bcc: "Bcc",
                      reply_to: "Reply-To",
                    };
                    return (
                      <div key={type} className="flex gap-3">
                        <span className="w-16 shrink-0 text-[#5f6368]">
                          {labelMap[type]}
                        </span>
                        <span className="text-[#202124]">
                          {list
                            .map((r) => r.name ? `${r.name} <${r.email}>` : r.email)
                            .join(", ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="text-[13px] text-[#5f6368]">
                {formatFullDate(email.date)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setStarred((v) => !v)}
                  title={starred ? "Unstar" : "Star"}
                  className="rounded-full p-1.5 hover:bg-[#f1f3f4]"
                >
                  <Star
                    size={18}
                    className={
                      starred
                        ? "fill-[#fbbc04] text-[#fbbc04]"
                        : "text-[#9aa0a6]"
                    }
                  />
                </button>
                <button
                  onClick={() => setDetailsOpen((v) => !v)}
                  title="Show details"
                  className="rounded-full p-1.5 hover:bg-[#f1f3f4]"
                >
                  <Info size={17} className="text-[#9aa0a6]" />
                </button>
              </div>
            </div>
          </div>

          {/* Details / security / threading panel */}
          {detailsOpen && (
            <div className="mt-4 rounded-lg border border-[#e8eaed] bg-[#f8f9fa] p-4 text-[13px]">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-2 font-medium text-[#202124]">
                    Authentication
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["spf", "dkim", "dmarc"].map((mech) => {
                      const badge = securityBadge(sec[mech]);
                      const Icon = badge.icon;
                      return (
                        <span
                          key={mech}
                          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          <Icon size={13} />
                          {mech.toUpperCase()}: {badge.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-2 font-medium text-[#202124]">
                    Message details
                  </div>
                  <div className="space-y-1 text-[#5f6368]">
                    <div className="truncate">
                      <span className="text-[#202124]">Message-ID:</span>{" "}
                      {thread.message_id || "—"}
                    </div>
                    <div className="truncate">
                      <span className="text-[#202124]">In-Reply-To:</span>{" "}
                      {thread.in_reply_to || "—"}
                    </div>
                    <div>
                      <span className="text-[#202124]">References:</span>{" "}
                      {thread.reference_count || 0}
                    </div>
                    <div>
                      <span className="text-[#202124]">Thread ID:</span>{" "}
                      {email.thread_id}
                    </div>
                  </div>
                </div>
              </div>

              {(mailingList.list_id || mailingList.list_unsubscribe) && (
                <div className="mt-4 flex items-center justify-between border-t border-[#e8eaed] pt-3">
                  <div className="flex items-center gap-2 text-[#5f6368]">
                    <Users size={14} />
                    <span>
                      {mailingList.list_id
                        ? `Mailing list: ${mailingList.list_id}`
                        : "This looks like a mailing list message"}
                    </span>
                  </div>
                  {mailingList.list_unsubscribe && (
                    <span className="cursor-default rounded-full border border-[#dadce0] px-3 py-1 text-[12px] text-[#5f6368]">
                      Unsubscribe available
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Body */}
          <div className="mt-5">
            {email.body_html ? (
              <iframe
                ref={iframeRef}
                title="email-body"
                sandbox="allow-same-origin allow-popups"
                onLoad={handleIframeLoad}
                style={{ height: iframeHeight }}
                className="w-full rounded-lg border-0"
                srcDoc={`<html><head><base target="_blank"><meta name="viewport" content="width=device-width, initial-scale=1" /><style>
                  * { box-sizing: border-box; }
                  body { margin:0; padding:4px 2px; font-family: Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#202124; word-wrap:break-word; overflow-wrap:break-word; }
                  img { max-width:100%; height:auto; }
                  a { color:#1a73e8; }
                  table { max-width:100%; }
                  pre { white-space:pre-wrap; }
                </style></head><body>${email.body_html}</body></html>`}
              />
            ) : (
              <pre className="whitespace-pre-wrap break-words font-sans text-[14px] leading-6 text-[#202124]">
                {email.body_plain || email.body || "(no content)"}
              </pre>
            )}
          </div>

          {/* Attachments */}
          {email.attachments?.length > 0 && (
            <div className="mt-6 border-t border-[#e8eaed] pt-5">
              <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-[#5f6368]">
                <Paperclip size={15} />
                {email.attachment_count} attachment
                {email.attachment_count === 1 ? "" : "s"}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {email.attachments.map((att) => {
                  const Icon = fileIcon(att.mime_type);
                  return (
                    <div
                      key={att.attachment_id || att.filename}
                      className="group flex flex-col gap-2 rounded-lg border border-[#dadce0] p-3 transition hover:border-[#1a73e8] hover:shadow-sm"
                    >
                      <div className="flex h-16 items-center justify-center rounded-md bg-[#f1f3f4]">
                        <Icon size={26} className="text-[#5f6368]" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[12px] font-medium text-[#202124]">
                          {att.filename || "attachment"}
                        </div>
                        <div className="text-[11px] text-[#5f6368]">
                          {formatBytes(att.size)}
                        </div>
                      </div>
                      <button
                        title="Download"
                        className="flex items-center justify-center gap-1 self-start rounded-full border border-[#dadce0] px-2.5 py-1 text-[11px] text-[#5f6368] opacity-0 transition group-hover:opacity-100 hover:bg-[#f1f3f4]"
                      >
                        <Download size={12} />
                        Download
                      </button>
                    </div>
                  );
                })}
              </div>

              {email.inline_attachments?.length > 0 && (
                <p className="mt-3 text-[12px] text-[#9aa0a6]">
                  {email.inline_attachments.length} inline image
                  {email.inline_attachments.length === 1 ? "" : "s"} embedded
                  in this message
                </p>
              )}
            </div>
          )}

          {/* Reply / Forward action bar */}
          <div className="mt-8 border-t border-[#e8eaed] pt-5">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  setReplyMode(replyMode === "reply" ? null : "reply")
                }
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  replyMode === "reply"
                    ? "border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]"
                    : "border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]"
                }`}
              >
                <Reply size={15} />
                Reply
              </button>
              <button
                onClick={() =>
                  setReplyMode(replyMode === "replyAll" ? null : "replyAll")
                }
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  replyMode === "replyAll"
                    ? "border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]"
                    : "border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]"
                }`}
              >
                <ReplyAll size={15} />
                Reply all
              </button>
              <button
                onClick={() =>
                  setReplyMode(replyMode === "forward" ? null : "forward")
                }
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  replyMode === "forward"
                    ? "border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]"
                    : "border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]"
                }`}
              >
                <Forward size={15} />
                Forward
              </button>
            </div>

            {replyMode && (
              <div className="mt-4 rounded-2xl border border-[#dadce0] shadow-sm">
                <div className="flex items-center justify-between border-b border-[#e8eaed] px-4 py-2.5">
                  <span className="text-[13px] font-medium text-[#5f6368]">
                    {replyMode === "reply" && `Reply to ${email.from?.name || email.from?.email}`}
                    {replyMode === "replyAll" && "Reply to all"}
                    {replyMode === "forward" && "Forward message"}
                  </span>
                  <button
                    onClick={() => setReplyMode(null)}
                    className="rounded-full p-1 hover:bg-[#f1f3f4]"
                  >
                    <X size={15} className="text-[#5f6368]" />
                  </button>
                </div>
                <textarea
                  rows={5}
                  placeholder="Write your message..."
                  className="w-full resize-none rounded-b-2xl px-4 py-3 text-[14px] text-[#202124] outline-none placeholder:text-[#9aa0a6]"
                />
                <div className="flex items-center justify-between border-t border-[#e8eaed] px-4 py-2.5">
                  <button className="rounded-full bg-[#1a73e8] px-5 py-2 text-sm font-medium text-white hover:bg-[#1765cc]">
                    Send
                  </button>
                  <button
                    onClick={() => setReplyMode(null)}
                    className="rounded-full p-2 hover:bg-[#f1f3f4]"
                  >
                    <Trash2 size={16} className="text-[#5f6368]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}