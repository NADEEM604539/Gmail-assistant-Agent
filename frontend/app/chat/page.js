"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Bot,
  Gauge,
  Layers3,
  Send,
  Sparkles,
  Mail,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const DEFAULT_TOKENS = {
  input_tokens: 0,
  output_tokens: 0,
  total_tokens: 0,
};

const suggestions = [
  "Summarize the latest inbox updates",
  "Find invoice threads from last week",
  "Draft a polished reply to Sarah",
  "Tell me which messages need attention",
];

function normalizeToolName(tool) {
  if (!tool) return null;
  if (typeof tool === "string") return tool;
  return tool.tool_name || tool.name || tool.id || null;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [typingDots, setTypingDots] = useState(1);
  const [lastMeta, setLastMeta] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const messagesEndRef = useRef(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      if (typeof window === "undefined") return;

      const token = window.localStorage.getItem("access_token");

      if (!token) {
        router.replace("/");
        return;
      }

      try {
        const res = await fetch(`${API}/api/auth/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          window.localStorage.removeItem("access_token");
          router.replace("/");
          return;
        }
      } catch {
        window.localStorage.removeItem("access_token");
        router.replace("/");
        return;
      }

      if (isMounted) {
        setAuthReady(true);
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const hasConversation = messages.length > 0;

  useEffect(() => {
    if (!isLoading) return;
    const interval = window.setInterval(() => {
      setTypingDots((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 500);
    return () => window.clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isLoading]);

  const activeMessageCount = useMemo(() => 0, []);

  const handleSend = async (event) => {
    if (event) event.preventDefault();

    const userText = draft.trim();
    if (!userText) return;

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setDraft("");
    setIsLoading(true);

    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null;
      const res = await fetch(`${API}/api/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userText,
          message_ids: [],
        }),
      });

      let reply = "Sorry, no response.";
      if (res.ok) {
        const data = await res.json();
        const content = data.content || data.final_response || data.reply || data.message || data.result || "";
        const tokenUsage = data.token_usage || DEFAULT_TOKENS;
        const toolNames = (data.tools_called || data.tool_calls || data.backend_details?.tools_called || [])
          .map(normalizeToolName)
          .filter(Boolean);

        setLastMeta({
          tokenUsage: {
            input_tokens: Number(tokenUsage.input_tokens || tokenUsage.prompt_tokens || 0),
            output_tokens: Number(tokenUsage.output_tokens || tokenUsage.completion_tokens || 0),
            total_tokens: Number(tokenUsage.total_tokens || 0),
          },
          toolNames,
          backendDetails: data.backend_details || null,
          agentsCalled: data.agents_called || [],
        });

        reply = content || JSON.stringify(data);
      } else {
        if (res.status === 401 || res.status === 403) {
          window.localStorage.removeItem("access_token");
          router.replace("/");
          return;
        }
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

  const quickPrompt = (prompt) => {
    setDraft(prompt);
  };

  if (!authReady) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      <div className="h-screen w-full px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex h-full flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#111216] shadow-[0_24px_90px_-35px_rgba(0,0,0,0.9)]">
          <div className="flex items-center justify-between border-b border-white/10 bg-[#0f1014] px-4 py-4 sm:px-5">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300">
              Live
            </div>
          </div>

          {!hasConversation ? (
            <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
              <div className="w-full max-w-4xl rounded-[28px] border border-white/10 bg-[#12151b] p-6 text-center shadow-[0_20px_70px_-30px_rgba(0,0,0,0.8)]">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#1a73e8] text-white shadow-lg shadow-violet-950/50">
                  <Bot size={22} />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-300">
                  Mailbox AI
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                  {greeting}, what would you like to explore?
                </h1>
                <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">
                  Ask the assistant to summarize, compare, prioritize, or draft replies across your full Gmail mailbox.
                </p>

                <div className="mt-6 grid gap-2 md:grid-cols-2">
                  {suggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => quickPrompt(item)}
                      className="flex items-start gap-2 rounded-[20px] bg-[#16181d] px-3 py-3 text-left transition hover:bg-[#191c24]"
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-300">
                        <Sparkles size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Suggested prompt</p>
                        <p className="text-xs text-slate-400">{item}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#0d0f14] px-4 py-4 sm:px-5">
              {lastMeta && (
                <div className="sticky top-0 z-10 mb-3 rounded-[22px] bg-[#14161b] p-3 shadow-[0_12px_40px_-25px_rgba(0,0,0,0.9)]">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-200">
                      <Gauge size={14} className="text-violet-300" />
                      Response diagnostics
                    </div>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                      live
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-[#0f1117] px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">Input</div>
                      <div className="mt-1 text-sm font-semibold text-white">{lastMeta.tokenUsage?.input_tokens || 0}</div>
                    </div>
                    <div className="rounded-2xl bg-[#0f1117] px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">Output</div>
                      <div className="mt-1 text-sm font-semibold text-white">{lastMeta.tokenUsage?.output_tokens || 0}</div>
                    </div>
                    <div className="rounded-2xl bg-[#0f1117] px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">Total</div>
                      <div className="mt-1 text-sm font-semibold text-white">{lastMeta.tokenUsage?.total_tokens || 0}</div>
                    </div>
                  </div>

                  {lastMeta.toolNames?.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-200">
                        <Layers3 size={13} className="text-violet-300" />
                        Tools called
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {lastMeta.toolNames.map((tool, index) => (
                          <span
                            key={`${tool}-${index}`}
                            className="rounded-full bg-[#0f1117] px-2.5 py-1 text-[11px] font-medium text-slate-200"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {lastMeta.backendDetails?.agent && (
                    <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#0f1117] px-3 py-2 text-[11px] text-slate-300">
                      <span className="flex items-center gap-1.5 font-medium text-slate-200">
                        <BarChart3 size={13} className="text-violet-300" />
                        Agent
                      </span>
                      <span className="rounded-full bg-violet-500/10 px-2 py-0.5 font-semibold text-violet-300">
                        {lastMeta.backendDetails.agent}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                  <div
                    className={`max-w-[85%] rounded-[22px] px-3 py-2.5 text-sm leading-5 ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-[#7C3AED] to-[#1a73e8] text-white shadow-lg shadow-violet-950/50"
                        : "bg-[#171a21] text-slate-100"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
                ))}

                {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[65%] rounded-[22px] bg-[#171a21] px-3 py-2.5 text-sm leading-5 text-slate-200">
                    <span className="font-semibold">Thinking</span>
                    <span className="ml-1">{".".repeat(typingDots)}</span>
                  </div>
                </div>
              )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="border-t border-white/10 bg-[#111216] p-3 sm:p-4">
            <div className="flex items-end gap-2 rounded-[22px] bg-[#171a21] px-3 py-2.5 transition focus-within:bg-[#181b23]">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={2}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend(event);
                  }
                }}
                placeholder="Ask Mailgent to reason over the whole Gmail mailbox..."
                className="flex-1 resize-none bg-transparent text-[15px] leading-6 text-slate-100 outline-none placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={isLoading || !draft.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#1a73e8] text-white shadow-lg shadow-violet-950/50 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
