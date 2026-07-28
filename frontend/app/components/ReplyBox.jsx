"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Reply,
  ReplyAll,
  Forward,
  X,
  SendHorizontal,
  Loader2,
  AlertCircle,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  FileArchive,
  File as FileIcon,
  Save,
  Check,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function normalizeRecipient(value = "") {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : trimmed;
}

function isValidEmail(value = "") {
  return EMAIL_REGEX.test(normalizeRecipient(value));
}

function getInitials(name, email) {
  const source = (name || email || "?").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.substring(0, 2).toUpperCase();
}

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

function fileIcon(mimeType = "") {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return Film;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("zip") || mimeType.includes("compressed"))
    return FileArchive;
  return FileIcon;
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/**
 * ReplyBox
 * --------
 * Fully self-contained Reply / Reply-all / Forward control.
 * Owns its own UI state AND its own API calls — the parent page
 * only needs to render it and (optionally) react to `onSent` / `onDraftSaved`.
 *
 * Draft support: clicking "Save as draft" POSTs the in-progress reply to
 * `${apiBase}/api/gmail/email/${emailId}/draft`. The first save creates the
 * draft and the returned id is kept internally, so every save after that
 * PATCHes the same draft instead of creating duplicates. Sending (or
 * discarding) clears that internal id.
 *
 * Props:
 *  - emailId        (string, required)  id of the email being replied to
 *  - email           (object, required)  the email object (needs .from, .to, .cc)
 *  - apiBase         (string, optional)  overrides NEXT_PUBLIC_API_BASE_URL
 *  - onSent          (fn, optional)      called after a successful send/forward
 *  - onDraftSaved    (fn, optional)      called with the draft id after a successful draft save
 *  - getAuthHeader   (fn, optional)      override for building the auth header.
 *                                        Defaults to reading "access_token" from
 *                                        localStorage and redirecting to "/" if missing.
 */
export default function ReplyBox({
  emailId,
  email,
  apiBase = API,
  onSent,
  onDraftSaved,
  getAuthHeader,
}) {
  const router = useRouter();

  const [mode, setMode] = useState(null); // 'reply' | 'replyAll' | 'forward' | null
  const [body, setBody] = useState("");
  const [forwardTo, setForwardTo] = useState("");
  const [attachments, setAttachments] = useState([]); // File[]
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const [draftId, setDraftId] = useState(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const defaultAuthHeader = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      router.push("/");
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  const authedFetch = async (url, options = {}) => {
    const headers = (getAuthHeader || defaultAuthHeader)();
    if (!headers) return null;

    const res = await fetch(url, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });

    if (res.status === 401) {
      if (typeof window !== "undefined") localStorage.removeItem("access_token");
      router.push("/");
      return null;
    }

    return res;
  };

  const openMode = (nextMode) => {
    setError(null);
    if (mode === nextMode) {
      setMode(null);
      return;
    }
    setMode(nextMode);
    setBody("");
    setForwardTo("");
    setAttachments([]);
    setDraftId(null);
    setDraftSaved(false);
  };

  const closeBox = () => {
    setMode(null);
    setBody("");
    setForwardTo("");
    setAttachments([]);
    setError(null);
    setDraftId(null);
    setDraftSaved(false);
  };

  const handleAttachmentPick = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = ""; // allow re-picking the same file later
    if (!files.length) return;

    const tooBig = files.find((f) => f.size > MAX_ATTACHMENT_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" is over the 25MB attachment limit.`);
      return;
    }

    setError(null);
    setDraftSaved(false);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setDraftSaved(false);
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const recipientPreview = useMemo(() => {
    if (!email) return "";
    if (mode === "reply") {
      return email.from?.name || email.from?.email || "";
    }
    if (mode === "replyAll") {
      const all = [
        email.from,
        ...(email.to || []),
        ...(email.cc || []),
      ].filter(Boolean);
      const names = all.map((r) => r.name || r.email);
      if (!names.length) return "";
      return names.length > 2
        ? `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`
        : names.join(", ");
    }
    return "";
  }, [mode, email]);

  const buildFormData = () => {
    const formData = new FormData();
    formData.append("body", body);

    if (mode === "forward") {
      forwardTo
        .split(",")
        .map((r) => normalizeRecipient(r))
        .filter(Boolean)
        .forEach((r) => formData.append("to", r));
    } else {
      formData.append("reply_all", mode === "replyAll" ? "true" : "false");
    }

    attachments.forEach((file) => formData.append("attachments", file));
    return formData;
  };

  const handleSend = async () => {
    if (!emailId) return;

    if (mode === "forward") {
      const recipients = forwardTo
        .split(",")
        .map((r) => normalizeRecipient(r))
        .filter(Boolean);

      if (!recipients.length || !recipients.every(isValidEmail)) {
        setError("Enter at least one valid recipient to forward to.");
        return;
      }
    }

    if (!body.trim()) {
      setError("Message can't be empty.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const isForward = mode === "forward";
      const url = isForward
        ? `${apiBase}/api/gmail/email/${emailId}/forward`
        : `${apiBase}/api/gmail/email/${emailId}/reply`;

      // Backend routes are multipart-only (Form(...) params), so this is
      // always FormData — even with zero attachments.
      const res = await authedFetch(url, {
        method: "POST",
        body: buildFormData(),
      });

      if (!res) return;
      if (!res.ok) throw new Error("Send failed");

      closeBox();
      onSent?.(mode);
    } catch {
      setError("Couldn't send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Saving a reply/reply-all/forward as a draft:
  //  - first save → POST creates a new draft linked to this email/thread
  //  - later saves (same mode still open) → PATCH updates that same draft
  //    so re-clicking "Save as draft" doesn't spawn duplicates
  const handleSaveDraft = async () => {
    if (!emailId || !mode) return;

    if (!body.trim() && !forwardTo.trim() && attachments.length === 0) {
      setError("Nothing to save yet.");
      return;
    }

    setSavingDraft(true);
    setError(null);

    try {
      // Create: POST /email/{emailId}/draft   — needs the ORIGINAL email's id
      // Update: PATCH /email/{draftId}/draft  — needs only the DRAFT's own id
      const url = draftId
        ? `${apiBase}/api/gmail/email/${draftId}/draft`
        : `${apiBase}/api/gmail/email/${emailId}/draft`;
      const method = draftId ? "PATCH" : "POST";

      const formData = buildFormData();
      if (!draftId) {
        // Only needed on create — updates infer everything from the
        // draft's own current state.
        formData.append("mode", mode);
      }

      const res = await authedFetch(url, { method, body: formData });

      if (!res) return; // redirected to login
      if (!res.ok) throw new Error("Draft save failed");

      const data = await res.json().catch(() => null);
      const savedId = data?.id || data?.draft_id || draftId;

      if (savedId) setDraftId(savedId);
      setDraftSaved(true);
      onDraftSaved?.(savedId);
    } catch {
      setError("Couldn't save draft. Please try again.");
    } finally {
      setSavingDraft(false);
    }
  };

  const MODES = [
    { key: "reply", label: "Reply", Icon: Reply },
    { key: "replyAll", label: "Reply all", Icon: ReplyAll },
    { key: "forward", label: "Forward", Icon: Forward },
  ];

  return (
    <div className="border-t border-[#e8eaed] pt-5">
      {/* Mode selector */}
      <div className="flex flex-wrap gap-3">
        {MODES.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => openMode(key)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              mode === key
                ? "border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]"
                : "border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Expanded compose box */}
      {mode && (
        <div className="mt-4 rounded-xl border border-[#dadce0] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e8eaed] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{ backgroundColor: avatarColor(email?.from?.email) }}
              >
                {getInitials(email?.from?.name, email?.from?.email)}
              </div>
              <div className="text-[13px] text-[#5f6368]">
                {mode === "forward" ? (
                  <span>Forwarding message</span>
                ) : (
                  <span>
                    {mode === "replyAll" ? "Replying to all: " : "Replying to "}
                    <span className="font-medium text-[#202124]">
                      {recipientPreview}
                    </span>
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={closeBox}
              className="rounded-full p-1.5 hover:bg-[#f1f3f4]"
              title="Close"
            >
              <X size={15} className="text-[#5f6368]" />
            </button>
          </div>

          {mode === "forward" && (
            <div className="flex items-center gap-3 border-b border-[#e8eaed] px-4 py-3">
              <span className="w-8 shrink-0 text-[13px] text-[#5f6368]">To</span>
              <input
                value={forwardTo}
                onChange={(e) => {
                  setForwardTo(e.target.value);
                  if (draftSaved) setDraftSaved(false);
                }}
                placeholder="Recipients, separated by commas"
                className="flex-1 bg-transparent text-[13px] text-[#202124] outline-none placeholder:text-[#9aa0a6]"
              />
            </div>
          )}

          <div className="px-4 py-3">
            <textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (draftSaved) setDraftSaved(false);
              }}
              rows={6}
              autoFocus
              placeholder={
                mode === "forward" ? "Add a message…" : "Write your reply…"
              }
              className="w-full resize-none border-none bg-transparent text-[14px] leading-6 text-[#202124] outline-none placeholder:text-[#9aa0a6]"
            />

            {attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {attachments.map((file, index) => {
                  const Icon = fileIcon(file.type);
                  return (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-2 rounded-full border border-[#dadce0] bg-[#f8f9fa] py-1.5 pl-2 pr-1 text-[12px] text-[#202124]"
                    >
                      <Icon size={14} className="shrink-0 text-[#5f6368]" />
                      <span className="max-w-[160px] truncate">{file.name}</span>
                      <span className="shrink-0 text-[#9aa0a6]">
                        {formatBytes(file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        title="Remove attachment"
                        className="rounded-full p-0.5 hover:bg-[#e8eaed]"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg bg-[#fce8e6] px-3 py-2 text-[12px] text-[#d93025]">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e8eaed] px-4 py-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={closeBox}
                className="rounded-full px-4 py-2 text-sm font-medium text-[#5f6368] transition hover:bg-[#f1f3f4]"
              >
                Cancel
              </button>
              <label
                title="Attach files"
                className="flex cursor-pointer items-center justify-center rounded-full p-2 text-[#5f6368] transition hover:bg-[#f1f3f4]"
              >
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleAttachmentPick}
                />
                <Paperclip size={17} />
              </label>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft || sending}
                title="Save as draft"
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-[#5f6368] transition hover:bg-[#f1f3f4] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingDraft ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : draftSaved ? (
                  <Check size={15} className="text-[#188038]" />
                ) : (
                  <Save size={15} />
                )}
                <span className={draftSaved ? "text-[#188038]" : ""}>
                  {savingDraft
                    ? "Saving…"
                    : draftSaved
                    ? "Saved"
                    : "Save as draft"}
                </span>
              </button>
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#1765cc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <SendHorizontal size={15} />
              )}
              {sending
                ? "Sending…"
                : mode === "forward"
                ? "Forward"
                : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
