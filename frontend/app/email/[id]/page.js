"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReplyBox from "@/app/components/ReplyBox";
import { useRouter, useParams } from "next/navigation";
import AgentAssistant from "../../components/AgentAssistant";
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
  ShieldOff,
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
  SendHorizontal,
  Save,
  RotateCcw,
  Sparkles,
  Loader2,
  Users,
  SearchX,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const SUGGESTED_PROMPTS = [
  "Summarize this email",
  "Draft a reply for me",
  "List any action items",
  "Translate this to Spanish",
];

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

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

function getMessagePreview(message = {}) {
  const text =
    message.body_plain ||
    message.body_html_as_text ||
    message.body ||
    message.snippet ||
    "";

  return text.replace(/\s+/g, " ").trim().slice(0, 220);
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

function normalizeRecipient(value = "") {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : trimmed;
}

function parseRecipientList(values = []) {
  return values
    .map((value) => normalizeRecipient(value))
    .filter(Boolean)
    .join(",");
}

function isValidEmail(value = "") {
  return EMAIL_REGEX.test(normalizeRecipient(value));
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
  const [notFound, setNotFound] = useState(false);

  const [starred, setStarred] = useState(false);
  const [unread, setUnread] = useState(false);
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [replyMode, setReplyMode] = useState(null); // 'reply' | 'replyAll' | 'forward' | null
  const [replyBody, setReplyBody] = useState("");
  const [forwardTo, setForwardTo] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState(null);
  const [iframeHeight, setIframeHeight] = useState(200);

  // Toolbar action state (per-action loading so buttons can disable individually)
  const [actionLoading, setActionLoading] = useState(null);

  // Draft-editing state
  const [draftFields, setDraftFields] = useState({
    subject: "",
    body: "",
  });
  const [draftRecipients, setDraftRecipients] = useState({
    to: [],
    cc: [],
    bcc: [],
  });
  const [draftRecipientInputs, setDraftRecipientInputs] = useState({
    to: "",
    cc: "",
    bcc: "",
  });
  const [draftAttachments, setDraftAttachments] = useState([]);
  const [ccBccOpen, setCcBccOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState("idle"); // idle | saving | saved | error
  const [sending, setSending] = useState(false);

  // AI panel state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiSending, setAiSending] = useState(false);

  const iframeRef = useRef(null);

  useEffect(() => {
    if (id) fetchEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (email && email.folder === "draft") {
      setDraftFields({
        subject: email.subject || "",
        body: email.body_plain || email.body || "",
      });
      setDraftRecipients({
        to: (email.to || []).map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)),
        cc: (email.cc || []).map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)),
        bcc: (email.bcc || []).map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)),
      });
      setDraftRecipientInputs({ to: "", cc: "", bcc: "" });
      setDraftAttachments([]);
      setCcBccOpen(Boolean(email.cc?.length || email.bcc?.length));
    }
  }, [email]);

  // ---- Auth / fetch helpers ----------------------------------------------

  const authHeader = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/");
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  // Wraps fetch with auth header + 401 handling so every action below
  // doesn't have to repeat the same boilerplate.
  const authedFetch = async (url, options = {}) => {
    const headers = authHeader();
    if (!headers) return null;

    const res = await fetch(url, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });

    if (res.status === 401) {
      localStorage.removeItem("access_token");
      router.push("/");
      return null;
    }

    return res;
  };

  const fetchEmail = async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const response = await authedFetch(`${API}/api/gmail/email/${id}`);
      if (!response) return; // redirected to login

      if (response.status === 404) {
        setNotFound(true);
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

  // ---- Mailbox actions (star, read, archive, trash, spam, delete) --------
  // Endpoint names below are a convention — implement matching routes
  // under app/gmail if they don't exist yet.

  const runAction = async (key, url, { method = "POST", body, onSuccess, navigateAway } = {}) => {
    setActionLoading(key);
    try {
      const res = await authedFetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res) return;
      if (!res.ok) throw new Error(`Action "${key}" failed`);

      onSuccess?.();
      if (navigateAway) router.push(navigateAway);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleStar = () => {
    const next = !starred;
    setStarred(next); // optimistic
    runAction(
      "star",
      `${API}/api/gmail/email/${id}/star`,
      {
        body: { starred: next },
        onSuccess: () => {},
      }
    ).catch(() => setStarred(!next));
  };

  const toggleRead = () => {
    const next = !unread;
    setUnread(next);
    runAction("read", `${API}/api/gmail/email/${id}/read`, {
      body: { unread: next },
    });
  };

  const archiveEmail = () =>
    runAction("archive", `${API}/api/gmail/email/${id}/archive`, {
      navigateAway: "/inbox",
    });

  const trashEmail = () =>
    runAction("trash", `${API}/api/gmail/email/${id}/trash`, {
      navigateAway: "/inbox",
    });

  const untrashEmail = () =>
    runAction("untrash", `${API}/api/gmail/email/${id}/untrash`, {
      navigateAway: "/inbox",
    });

  const deleteForever = () =>
    runAction("delete-forever", `${API}/api/gmail/email/${id}`, {
      method: "DELETE",
      navigateAway: "/trash",
    });

  const markSpam = () =>
    runAction("spam", `${API}/api/gmail/email/${id}/spam`, {
      navigateAway: "/inbox",
    });

  const markNotSpam = () =>
    runAction("not-spam", `${API}/api/gmail/email/${id}/not-spam`, {
      navigateAway: "/inbox",
    });

  // ---- Draft actions -----------------------------------------------------

  // Any text still sitting in the recipient input boxes (not yet turned
  // into a chip) needs to be committed before we submit, otherwise a
  // recipient typed right before hitting Send/Save silently gets dropped.
  const getCommittedRecipients = () => {
    const result = { ...draftRecipients };
    ["to", "cc", "bcc"].forEach((field) => {
      const pending = draftRecipientInputs[field].trim();
      if (pending) {
        const normalized = normalizeRecipient(pending);
        if (normalized) result[field] = [...result[field], normalized];
      }
    });
    return result;
  };

  // True only when there's at least one syntactically valid "To" recipient,
  // either already chipped or currently typed in the input box.
  const hasValidRecipient = useMemo(() => {
    const committed = draftRecipients.to.some((r) => isValidEmail(r));
    const pending = isValidEmail(draftRecipientInputs.to);
    return committed || pending;
  }, [draftRecipients.to, draftRecipientInputs.to]);

  const buildDraftFormData = (recipients) => {
    const formData = new FormData();
    formData.append("subject", draftFields.subject || "");
    formData.append("body", draftFields.body || "");
    formData.append("to", parseRecipientList(recipients.to));
    formData.append("cc", parseRecipientList(recipients.cc));
    formData.append("bcc", parseRecipientList(recipients.bcc));
    draftAttachments.forEach((file) => formData.append("attachments", file));
    return formData;
  };

  const persistDraft = async () => {
    const recipients = getCommittedRecipients();
    const formData = buildDraftFormData(recipients);

    const res = await authedFetch(`${API}/api/gmail/draft/${id}`, {
      method: "PATCH",
      body: formData,
    });

    if (!res) return false;
    if (!res.ok) throw new Error();
    return true;
  };

  const handleSaveDraft = async () => {
    setDraftStatus("saving");
    try {
      const ok = await persistDraft();
      if (!ok) return;
      setDraftStatus("saved");
      router.push("/drafts");
    } catch {
      setDraftStatus("error");
    }
  };

  const handleSendDraft = async () => {
    if (!hasValidRecipient) {
      setDraftStatus("error");
      return;
    }

    setSending(true);
    try {
      const recipients = getCommittedRecipients();
      const formData = buildDraftFormData(recipients);

      const res = await authedFetch(`${API}/api/gmail/${id}/send_draft`, {
        method: "POST",
        body: formData,
      });

      if (!res) return;
      if (!res.ok) throw new Error();

      router.push("/drafts");
    } catch {
      setDraftStatus("error");
    } finally {
      setSending(false);
    }
  };

  const handleDiscardDraft = async () => {
    try {
      await authedFetch(`${API}/api/gmail/draft/${id}`, { method: "DELETE" });
    } catch {
      // ignore — still navigate away
    } finally {
      router.push("/drafts");
    }
  };

  const handleRecipientKeyDown = (field, event) => {
    const value = draftRecipientInputs[field].trim();

    if ((event.key === "Enter" || event.key === "," || event.key === "Tab") && value) {
      event.preventDefault();
      const normalized = normalizeRecipient(value);
      if (!normalized) return;
      setDraftRecipients((prev) => ({ ...prev, [field]: [...prev[field], normalized] }));
      setDraftRecipientInputs((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    if (event.key === " " && value) {
      event.preventDefault();
      const normalized = normalizeRecipient(value);
      if (!normalized) return;
      setDraftRecipients((prev) => ({ ...prev, [field]: [...prev[field], normalized] }));
      setDraftRecipientInputs((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    if (event.key === "Backspace" && !value && draftRecipients[field].length) {
      event.preventDefault();
      setDraftRecipients((prev) => ({
        ...prev,
        [field]: prev[field].slice(0, -1),
      }));
    }
  };

  const removeRecipientChip = (field, index) => {
    setDraftRecipients((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleDraftFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setDraftAttachments((prev) => [...prev, ...files]);
    event.target.value = "";
  };

  const removeDraftAttachment = (index) => {
    setDraftAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // ---- Reply / Reply-all / Forward ---------------------------------------

  const openReplyMode = (mode) => {
    setReplyError(null);
    if (replyMode === mode) {
      setReplyMode(null);
      return;
    }
    setReplyMode(mode);
    setReplyBody("");
    setForwardTo("");
  };

  const handleSendReply = async () => {
    if (!email) return;

    if (replyMode === "forward") {
      const recipients = forwardTo
        .split(",")
        .map((r) => normalizeRecipient(r))
        .filter(Boolean);

      if (!recipients.length || !recipients.every(isValidEmail)) {
        setReplyError("Enter at least one valid recipient to forward to.");
        return;
      }
    }

    if (!replyBody.trim()) {
      setReplyError("Message can't be empty.");
      return;
    }

    setReplySending(true);
    setReplyError(null);

    try {
      const isForward = replyMode === "forward";
      const url = isForward
        ? `${API}/api/gmail/email/${id}/forward`
        : `${API}/api/gmail/email/${id}/reply`;

      const payload = isForward
        ? {
            to: forwardTo
              .split(",")
              .map((r) => normalizeRecipient(r))
              .filter(Boolean),
            body: replyBody,
          }
        : {
            body: replyBody,
            reply_all: replyMode === "replyAll",
          };

      const res = await authedFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res) return;
      if (!res.ok) throw new Error();

      setReplyMode(null);
      setReplyBody("");
      setForwardTo("");
      fetchEmail(); // refresh thread with the new message
    } catch {
      setReplyError("Couldn't send. Please try again.");
    } finally {
      setReplySending(false);
    }
  };

  // ---- AI chat -------------------------------------------------------------

  const sendAiMessage = async (override) => {
    const text = (override ?? aiInput).trim();
    if (!text || aiSending) return;

    const userMsg = { id: `${Date.now()}-u`, role: "user", text };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setAiSending(true);

    try {
      const res = await authedFetch(`${API}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_id: id,
          message: text,
          history: aiMessages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      if (!res) return;
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAiMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: "assistant",
          text: data.reply || data.message || "…",
        },
      ]);
    } catch {
      setAiMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-e`,
          role: "assistant",
          text: "Sorry, I couldn't get a response. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setAiSending(false);
    }
  };

  const recipientSummary = useMemo(() => {
    if (!email?.to?.length) return "";
    const names = email.to.map((r) => r.name || r.email);
    if (names.length === 1) return `to ${names[0]}`;
    return `to ${names.slice(0, 2).join(", ")}${
      names.length > 2 ? ` and ${names.length - 2} more` : ""
    }`;
  }, [email]);

  const folderMeta = FOLDER_META[email?.folder] || FOLDER_META.other;
  const threadMessages = useMemo(() => {
    return (email?.thread_messages || []).filter(Boolean);
  }, [email]);

  const isDraft = email?.folder === "draft";
  const isSent = email?.folder === "sent";
  const isTrash = email?.folder === "trash";
  const isSpam = email?.folder === "spam";
  const isInbox = !isDraft && !isSent && !isTrash && !isSpam;

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
  // Not found (404) state
  // -------------------------------------------------------------------
  if (notFound) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#f6f8fc]">
        <SearchX size={40} className="text-[#5f6368]" />
        <h2 className="mt-4 text-lg font-semibold text-[#202124]">
          This email couldn't be found
        </h2>
        <p className="mt-1 text-sm text-[#5f6368]">
          It may have been deleted or moved.
        </p>
        <button
          onClick={() => router.push("/inbox")}
          className="mt-5 rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1765cc]"
        >
          Back to inbox
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Generic error state
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
    <div className="flex h-full bg-white">
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
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

          {/* Folder-specific primary actions */}
          {isTrash && (
            <>
              <button
                onClick={untrashEmail}
                disabled={actionLoading === "untrash"}
                title="Move to inbox"
                className="rounded-full p-2 hover:bg-[#e8eaed] disabled:opacity-50"
              >
                <RotateCcw size={18} className="text-[#5f6368]" />
              </button>
              <button
                onClick={deleteForever}
                disabled={actionLoading === "delete-forever"}
                title="Delete forever"
                className="rounded-full p-2 hover:bg-[#e8eaed] disabled:opacity-50"
              >
                <Trash2 size={18} className="text-[#d93025]" />
              </button>
            </>
          )}

          {isSpam && (
            <>
              <button
                onClick={markNotSpam}
                disabled={actionLoading === "not-spam"}
                title="Not spam"
                className="rounded-full p-2 hover:bg-[#e8eaed] disabled:opacity-50"
              >
                <ShieldOff size={18} className="text-[#5f6368]" />
              </button>
              <button
                onClick={deleteForever}
                disabled={actionLoading === "delete-forever"}
                title="Delete forever"
                className="rounded-full p-2 hover:bg-[#e8eaed] disabled:opacity-50"
              >
                <Trash2 size={18} className="text-[#d93025]" />
              </button>
            </>
          )}

          {isDraft && (
            <button
              onClick={handleDiscardDraft}
              title="Discard draft"
              className="rounded-full p-2 hover:bg-[#e8eaed]"
            >
              <Trash2 size={18} className="text-[#5f6368]" />
            </button>
          )}

          {isSent && (
            <>
              <button
                onClick={archiveEmail}
                disabled={actionLoading === "archive"}
                title="Archive"
                className="rounded-full p-2 hover:bg-[#e8eaed] disabled:opacity-50"
              >
                <Archive size={18} className="text-[#5f6368]" />
              </button>
              <button
                onClick={trashEmail}
                disabled={actionLoading === "trash"}
                title="Delete"
                className="rounded-full p-2 hover:bg-[#e8eaed] disabled:opacity-50"
              >
                <Trash2 size={18} className="text-[#5f6368]" />
              </button>
            </>
          )}

          {isInbox && (
            <>
              <button
                onClick={archiveEmail}
                disabled={actionLoading === "archive"}
                title="Archive"
                className="rounded-full p-2 hover:bg-[#e8eaed] disabled:opacity-50"
              >
                <Archive size={18} className="text-[#5f6368]" />
              </button>
              <button
                onClick={markSpam}
                disabled={actionLoading === "spam"}
                title="Report spam"
                className="rounded-full p-2 hover:bg-[#e8eaed] disabled:opacity-50"
              >
                <AlertOctagon size={18} className="text-[#5f6368]" />
              </button>
              <button
                onClick={trashEmail}
                disabled={actionLoading === "trash"}
                title="Delete"
                className="rounded-full p-2 hover:bg-[#e8eaed] disabled:opacity-50"
              >
                <Trash2 size={18} className="text-[#5f6368]" />
              </button>
              <div className="mx-1 h-6 w-px bg-[#dadce0]" />
              <button
                title={unread ? "Mark as read" : "Mark as unread"}
                onClick={toggleRead}
                disabled={actionLoading === "read"}
                className="rounded-full p-2 hover:bg-[#e8eaed] disabled:opacity-50"
              >
                {unread ? (
                  <Mail size={18} className="text-[#5f6368]" />
                ) : (
                  <MailOpen size={18} className="text-[#5f6368]" />
                )}
              </button>
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            <div className="mx-1 h-6 w-px bg-[#dadce0]" />

            <button
              title="Print"
              onClick={() => window.print()}
              className="rounded-full p-2 hover:bg-[#e8eaed]"
            >
              <Printer size={18} className="text-[#5f6368]" />
            </button>
            <button title="More" className="rounded-full p-2 hover:bg-[#e8eaed]">
              <MoreVertical size={18} className="text-[#5f6368]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          <div className="mx-auto max-w-4xl px-6 py-6">
            {/* Subject + badges */}
            <div className="flex flex-wrap items-center gap-2">
              {isDraft ? (
                <input
                  value={draftFields.subject}
                  onChange={(e) =>
                    setDraftFields((f) => ({ ...f, subject: e.target.value }))
                  }
                  placeholder="Subject"
                  className="min-w-[220px] flex-1 border-none bg-transparent text-[22px] font-normal leading-8 text-[#202124] outline-none placeholder:text-[#9aa0a6]"
                />
              ) : (
                <h1 className="text-[22px] font-normal leading-8 text-[#202124]">
                  {email.subject || "(no subject)"}
                </h1>
              )}

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

            {/* Sender card (inbox / sent / trash / spam) */}
            {!isDraft && (
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
                        const list = email[type];
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
                                .map((r) =>
                                  r.name ? `${r.name} <${r.email}>` : r.email
                                )
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
                      onClick={toggleStar}
                      disabled={actionLoading === "star"}
                      title={starred ? "Unstar" : "Star"}
                      className="rounded-full p-1.5 hover:bg-[#f1f3f4] disabled:opacity-50"
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
            )}

            {/* Compose card (draft) */}
            {isDraft && (
              <div className="mt-5 border-b border-[#e8eaed] pb-5">
                <div className="space-y-2 text-[14px]">
                  <div className="flex items-center gap-3">
                    <span className="w-12 shrink-0 text-[#5f6368]">To</span>
                    <div className="flex min-h-[40px] flex-1 flex-wrap items-center gap-2 rounded-lg border border-[#e8eaed] bg-[#f8f9fa] px-3 py-2">
                      {draftRecipients.to.map((recipient, index) => (
                        <button
                          key={`${recipient}-${index}`}
                          type="button"
                          onClick={() => removeRecipientChip("to", index)}
                          className={`flex items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-[12px] ${
                            isValidEmail(recipient)
                              ? "border-[#dadce0] text-[#202124]"
                              : "border-[#d93025] text-[#d93025]"
                          }`}
                        >
                          {recipient}
                          <X size={12} />
                        </button>
                      ))}
                      <input
                        value={draftRecipientInputs.to}
                        onChange={(e) =>
                          setDraftRecipientInputs((prev) => ({ ...prev, to: e.target.value }))
                        }
                        onKeyDown={(e) => handleRecipientKeyDown("to", e)}
                        placeholder={draftRecipients.to.length ? "" : "Add recipients"}
                        className="min-w-[140px] flex-1 bg-transparent py-1 text-[#202124] outline-none placeholder:text-[#9aa0a6]"
                      />
                    </div>
                    <button
                      onClick={() => setCcBccOpen((v) => !v)}
                      className="shrink-0 text-[13px] text-[#5f6368] hover:text-[#1a73e8]"
                    >
                      Cc/Bcc
                    </button>
                  </div>

                  {ccBccOpen && (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="w-12 shrink-0 text-[#5f6368]">Cc</span>
                        <div className="flex min-h-[40px] flex-1 flex-wrap items-center gap-2 rounded-lg border border-[#e8eaed] bg-[#f8f9fa] px-3 py-2">
                          {draftRecipients.cc.map((recipient, index) => (
                            <button
                              key={`${recipient}-${index}`}
                              type="button"
                              onClick={() => removeRecipientChip("cc", index)}
                              className="flex items-center gap-1 rounded-full border border-[#dadce0] bg-white px-2.5 py-1 text-[12px] text-[#202124]"
                            >
                              {recipient}
                              <X size={12} />
                            </button>
                          ))}
                          <input
                            value={draftRecipientInputs.cc}
                            onChange={(e) =>
                              setDraftRecipientInputs((prev) => ({ ...prev, cc: e.target.value }))
                            }
                            onKeyDown={(e) => handleRecipientKeyDown("cc", e)}
                            placeholder={draftRecipients.cc.length ? "" : "Cc recipients"}
                            className="min-w-[120px] flex-1 bg-transparent py-1 text-[#202124] outline-none placeholder:text-[#9aa0a6]"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-12 shrink-0 text-[#5f6368]">Bcc</span>
                        <div className="flex min-h-[40px] flex-1 flex-wrap items-center gap-2 rounded-lg border border-[#e8eaed] bg-[#f8f9fa] px-3 py-2">
                          {draftRecipients.bcc.map((recipient, index) => (
                            <button
                              key={`${recipient}-${index}`}
                              type="button"
                              onClick={() => removeRecipientChip("bcc", index)}
                              className="flex items-center gap-1 rounded-full border border-[#dadce0] bg-white px-2.5 py-1 text-[12px] text-[#202124]"
                            >
                              {recipient}
                              <X size={12} />
                            </button>
                          ))}
                          <input
                            value={draftRecipientInputs.bcc}
                            onChange={(e) =>
                              setDraftRecipientInputs((prev) => ({ ...prev, bcc: e.target.value }))
                            }
                            onKeyDown={(e) => handleRecipientKeyDown("bcc", e)}
                            placeholder={draftRecipients.bcc.length ? "" : "Bcc recipients"}
                            className="min-w-[120px] flex-1 bg-transparent py-1 text-[#202124] outline-none placeholder:text-[#9aa0a6]"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-dashed border-[#dadce0] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[13px] text-[#5f6368]">
                      <Paperclip size={14} />
                      Attach files
                    </div>
                    <label className="cursor-pointer rounded-full border border-[#dadce0] px-3 py-1.5 text-[12px] font-medium text-[#3c4043] transition hover:bg-[#f1f3f4]">
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleDraftFiles}
                      />
                      Add files
                    </label>
                  </div>

                  {draftAttachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {draftAttachments.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center gap-2 rounded-full border border-[#dadce0] bg-[#f8f9fa] px-2.5 py-1.5 text-[12px] text-[#202124]"
                        >
                          <span className="max-w-[180px] truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeDraftAttachment(index)}
                            className="rounded-full p-0.5 hover:bg-[#e8eaed]"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[12px] text-[#9aa0a6]">
                    Draft {email.updated || email.time ? `· saved ${email.updated || email.time}` : ""}
                  </span>
                  {draftStatus === "saving" && (
                    <span className="text-[12px] text-[#5f6368]">Saving…</span>
                  )}
                  {draftStatus === "saved" && (
                    <span className="text-[12px] text-[#188038]">Saved</span>
                  )}
                  {draftStatus === "error" && !hasValidRecipient && (
                    <span className="text-[12px] text-[#d93025]">
                      Add a valid recipient before sending
                    </span>
                  )}
                  {draftStatus === "error" && hasValidRecipient && (
                    <span className="text-[12px] text-[#d93025]">
                      Something went wrong
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Details / security / threading panel */}
            {detailsOpen && !isDraft && (
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
              {isDraft ? (
                <textarea
                  value={draftFields.body}
                  onChange={(e) =>
                    setDraftFields((f) => ({ ...f, body: e.target.value }))
                  }
                  rows={14}
                  placeholder="Compose your message…"
                  className="w-full resize-none rounded-lg border-none bg-transparent text-[14px] leading-6 text-[#202124] outline-none placeholder:text-[#9aa0a6]"
                />
              ) : email.body_html ? (
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
                      <a
                          href={att.download_url || `${API}/api/gmail/email/${id}/attachments/${att.attachment_id}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Download"
                          className="flex items-center justify-center gap-1 self-start rounded-full border border-[#dadce0] px-2.5 py-1 text-[11px] text-[#5f6368] opacity-0 transition group-hover:opacity-100 hover:bg-[#f1f3f4]"
                        >
                          <Download size={12} />
                          Download
                        </a>
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

            {threadMessages.length > 1 && (
              <div className="mt-8 border-t border-[#e8eaed] pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-[#5f6368]">
                    <Users size={15} />
                    Conversation thread
                  </div>
                  <span className="text-[12px] text-[#9aa0a6]">
                    {threadMessages.length} message{threadMessages.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-3">
                  {threadMessages.map((threadMessage) => {
                    const isCurrent = threadMessage.id === email.id;
                    const preview = getMessagePreview(threadMessage);

                    return (
                      <button
                        key={threadMessage.id}
                        type="button"
                        onClick={() => {
                          if (!isCurrent) router.push(`/email/${threadMessage.id}`);
                        }}
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          isCurrent
                            ? "cursor-default border-[#1a73e8] bg-[#f8fbff]"
                            : "border-[#e8eaed] bg-[#fcfcfd] hover:border-[#1a73e8] hover:bg-[#f8fbff]"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-[#202124]">
                              {threadMessage.from?.name || threadMessage.from?.email || "Unknown sender"}
                            </span>
                            {isCurrent && (
                              <span className="rounded-full bg-[#e8f0fe] px-2.5 py-1 text-[11px] font-medium text-[#1a73e8]">
                                Current message
                              </span>
                            )}
                          </div>
                          <span className="text-[12px] text-[#5f6368]">
                            {formatFullDate(threadMessage.date)}
                          </span>
                        </div>

                        <div className="mt-2 text-[13px] leading-6 text-[#5f6368]">
                          {preview || "(no content)"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom action bar: draft compose controls, or reply/forward */}
            {isDraft ? (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#e8eaed] pt-5">
                <div className="flex items-center gap-3">
                  {/* Send button only rendered when there's a valid recipient */}
                  {hasValidRecipient && (
                    <button
                      onClick={handleSendDraft}
                      disabled={sending}
                      className="flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1765cc] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sending ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <SendHorizontal size={15} />
                      )}
                      {sending ? "Sending…" : "Send"}
                    </button>
                  )}
                  <button
                    onClick={handleSaveDraft}
                    className="flex items-center gap-2 rounded-full border border-[#dadce0] px-4 py-2.5 text-sm font-medium text-[#3c4043] transition hover:bg-[#f1f3f4]"
                  >
                    <Save size={15} /> Save draft
                  </button>
                </div>
                <button
                  onClick={handleDiscardDraft}
                  className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[#d93025] transition hover:bg-[#fce8e6]"
                >
                  <Trash2 size={15} /> Discard
                </button>
              </div>
            ) :(
  <ReplyBox
    emailId={id}
    email={email}
    onSent={() => fetchEmail()}  // refresh thread after a reply/forward
  />
)}
           
          </div>
        </div>


      <AgentAssistant
        page="email"
        title="Email Assistant"
        subtitle="Understand, reply, and summarize this message"
        contextLabel={folderMeta.label}
        contextSummary={email?.subject || "Current email"}
        itemCount={email?.attachments?.length || 0}
        selectedMessageIds={id ? [id] : []}
        allMessageIds={threadMessages.length > 0 ? threadMessages.map((m) => m.id) : [id]}
        buttons={[
          {
            id: "summarize",
            label: "Summarize",
            description: "Explain this message briefly",
            icon: Sparkles,
            reply: "I’ve reviewed the message and I’m giving you a concise summary.",
          },
          {
            id: "reply",
            label: "Draft reply",
            description: "Create a response for this email",
            icon: Reply,
            reply: "I’m drafting a strong response based on this message.",
          },
          {
            id: "action-items",
            label: "Action items",
            description: "Extract tasks and follow-ups",
            icon: FileText,
            reply: "I’m extracting the key action items from this email.",
          },
        ]}
      />

      {/* ------------------------------------------------------------ */}
      {/* AI side panel                                                 */}
      {/* ------------------------------------------------------------ */}
      {aiOpen && (
        <div className="flex h-full w-[380px] shrink-0 flex-col border-l border-[#e8eaed] bg-[#f8f9fa]">
          <div className="flex items-center justify-between border-b border-[#e8eaed] bg-white px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4285f4] via-[#9b72cb] to-[#d96570]">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#202124]">
                  AI Assistant
                </div>
                <div className="text-[11px] text-[#5f6368]">
                  Ask about this email
                </div>
              </div>
            </div>
            <button
              onClick={() => setAiOpen(false)}
              className="rounded-full p-1.5 hover:bg-[#f1f3f4]"
            >
              <X size={16} className="text-[#5f6368]" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {aiMessages.length === 0 && (
              <div className="space-y-2">
                <p className="text-[13px] text-[#5f6368]">Try asking:</p>
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendAiMessage(p)}
                    className="block w-full rounded-2xl border border-[#dadce0] bg-white px-3 py-2 text-left text-[13px] text-[#3c4043] transition hover:border-[#1a73e8] hover:bg-[#e8f0fe]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {aiMessages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4285f4] via-[#9b72cb] to-[#d96570]">
                    <Sparkles size={13} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-5 ${
                    m.role === "user"
                      ? "bg-[#1a73e8] text-white"
                      : m.isError
                      ? "bg-[#fce8e6] text-[#d93025]"
                      : "border border-[#e8eaed] bg-white text-[#202124]"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {aiSending && (
              <div className="flex justify-start">
                <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4285f4] via-[#9b72cb] to-[#d96570]">
                  <Sparkles size={13} className="text-white" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl border border-[#e8eaed] bg-white px-3.5 py-2.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9aa0a6] [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9aa0a6] [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9aa0a6]" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[#e8eaed] bg-white p-3">
            <div className="flex items-end gap-2 rounded-3xl border border-[#dadce0] bg-[#f8f9fa] px-3 py-2 focus-within:border-[#1a73e8]">
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendAiMessage();
                  }
                }}
                rows={1}
                placeholder="Ask AI about this email…"
                className="max-h-24 flex-1 resize-none bg-transparent text-[13px] text-[#202124] outline-none placeholder:text-[#9aa0a6]"
              />
              <button
                onClick={() => sendAiMessage()}
                disabled={aiSending || !aiInput.trim()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-white transition hover:bg-[#1765cc] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SendHorizontal size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>)

}