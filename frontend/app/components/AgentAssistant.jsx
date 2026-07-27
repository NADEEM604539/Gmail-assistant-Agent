"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  FileText,
  Inbox as InboxIcon,
  MessageSquareText,
  PenSquare,
  Reply,
  Button,
  Search,
  Send,
  Sparkles,
  X,
} from "lucide-react";

const INITIAL_MESSAGES = {
  inbox: [
    {
      role: "assistant",
      text: "I’m here as your Mailgent assistant. I can summarize this inbox view, surface urgent mail, or help draft a response.",
    },
  ],
  sent: [
    {
      role: "assistant",
      text: "I’m ready to review your sent messages, spot follow-ups, or help refine the tone of a reply.",
    },
  ],
  drafts: [
    {
      role: "assistant",
      text: "I can help polish drafts, rewrite tone, and prepare a message before you send it.",
    },
  ],
  email: [
    {
      role: "assistant",
      text: "I can summarize this email, draft a response, list action items, or translate it.",
    },
  ],
};

export default function AgentAssistant({
  page = "inbox",
  title = "Mailgent Assistant",
  subtitle = "One assistant for every page",
  contextLabel = "Current view",
  contextSummary = "",
  itemCount = 0,
  selectedMessageIds = [],
  allMessageIds = [],
  buttons = []
}) {
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";


  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState(() => INITIAL_MESSAGES[page] || INITIAL_MESSAGES.inbox);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [typingDots, setTypingDots] = useState(1);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isLoading) return;
    const interval = window.setInterval(() => {
      setTypingDots((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 500);
    return () => window.clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, isLoading]);

  const handleSend = async (event) => {
    event.preventDefault();
    const userText = draft.trim();
    if (!userText) return;

    setMessages((prev) => [...prev, { role: "user", text: userText }] );
    setDraft("");
    setIsLoading(true);

    const idsToSend = Array.isArray(selectedMessageIds) && selectedMessageIds.length > 0 ? selectedMessageIds : (Array.isArray(allMessageIds) ? allMessageIds : []);

    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null;
      const res = await fetch(`${API}/api/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userText, message_ids: idsToSend }),
      });

      let reply = "Sorry, no response.";
      if (res.ok) {
        const data = await res.json();
        reply = data.reply || data.message || data.result || JSON.stringify(data);
      } else {
        reply = `Error: ${res.status}`;
      }

      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, something went wrong." }]);
    } finally {
      setIsLoading(false);
    }
  };
  // Buttons removed: single-send handling via the compose form.
  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(92vw,360px)]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-lg"
        >
          <Bot size={16} className="text-[#1a73e8]" />
          <span className="text-sm font-semibold text-slate-700">Open assistant</span>
        </button>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-100 bg-gradient-to-r from-[#eef4ff] to-[#f8f9ff] px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a73e8] text-white">
                  <Bot size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{title}</p>
                  <p className="text-xs text-slate-500">{subtitle}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 text-slate-500 hover:bg-white"
            >
              <X size={15} />
            </button>
          </div>

          <div className="space-y-3 border-b border-slate-100 bg-[#fcfdff] px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#e8f0fe] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1a73e8]">
                {contextLabel}
              </span>
              {selectedMessageIds.length > 0 ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {selectedMessageIds.length} items
                </span>
              ):
             (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {itemCount} items
                </span>
             )
              }
              {contextSummary && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {contextSummary}
                </span>
              )}
            </div>

            <div className="grid gap-2">
              {buttons.map((button) => {
                const Icon = button.icon;
                return (
                  <button
                    key={button.id}
                    onClick={() => {
                      setDraft(button.description)
                    }
                    }
                    className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-[#1a73e8] hover:bg-[#f7faff]"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1a73e8]">
                      <Icon size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{button.label}</p>
                      <p className="text-xs text-slate-500">{button.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-h-[280px] space-y-3 overflow-y-auto bg-white px-4 py-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-5 ${message.role === "user"
                    ? "bg-[#1a73e8] text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[65%] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-5 text-slate-700">
                  <span className="font-semibold">Typing</span>
                  <span className="ml-1">{".".repeat(typingDots)}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-slate-100 bg-white p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-[#1a73e8]">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={2}
                placeholder="Ask Mailgent to act or explain..."
                className="flex-1 resize-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a73e8] text-white"
              >
                <Send size={15} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
