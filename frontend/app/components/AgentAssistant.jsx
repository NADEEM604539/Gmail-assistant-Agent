"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  FileText,
  Inbox as InboxIcon,
  MessageSquareText,
  PenSquare,
  Reply,
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
  featureButtons = [],
  onAction,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState(() => INITIAL_MESSAGES[page] || INITIAL_MESSAGES.inbox);
  const [draft, setDraft] = useState("");

  const buttons = useMemo(() => {
    if (featureButtons.length) return featureButtons;

    return [
      {
        id: "summarize",
        label: "Summarize",
        description: "Explain the current context",
        icon: Sparkles,
        reply: "I’ve reviewed the current context and I’m summarizing the key details for you.",
      },
      {
        id: "search",
        label: "Search",
        description: "Find what matters fastest",
        icon: Search,
        reply: "I’m narrowing the current view to the most relevant items.",
      },
      {
        id: "draft",
        label: "Draft",
        description: "Create a polished response",
        icon: PenSquare,
        reply: "I’m preparing a ready-to-send draft based on this context.",
      },
    ];
  }, [featureButtons]);

  const handleSend = (event) => {
    event.preventDefault();

    if (!draft.trim()) return;

    const userText = draft.trim();
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: `I’m using your current ${contextLabel.toLowerCase()} context to help with: “${userText}”.`,
      },
    ]);
    setDraft("");
  };

  const handleButton = (button) => {
    if (button.reply) {
      setMessages((prev) => [...prev, { role: "assistant", text: button.reply }]);
    }

    if (onAction) {
      onAction(button.id);
    }
  };

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
              {itemCount > 0 && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {itemCount} items
                </span>
              )}
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
                    onClick={() => handleButton(button)}
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
                  className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-5 ${
                    message.role === "user"
                      ? "bg-[#1a73e8] text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
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
