"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Clock3,
  FileText,
  MessageSquare,
  Send,
  Sparkles,
  Star,
  Plus,
} from "lucide-react";

const recentChats = [
  "Draft reply for client email",
  "Summarize unread newsletter",
  "Find urgent messages",
];

const suggestions = [
  "Show me the most important unread emails",
  "Draft a response to the latest support request",
  "Summarize today’s meetings and action items",
];

const messages = [
  {
    role: "assistant",
    text: "Hi! I’m Mailgent, your Gmail AI assistant. Ask me to summarize emails, draft replies, or find urgent messages.",
  },
  {
    role: "user",
    text: "Show me the top 3 unread emails I should reply to.",
  },
  {
    role: "assistant",
    text: "I found 3 unread emails from your manager, your client, and a security alert that need attention first.",
  },
];

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-[#0B1220] px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 xl:grid xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden xl:flex flex-col gap-5 rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-black/10">
            <span>Mailgent</span>
            <Plus size={18} />
          </div>

          <div className="space-y-3">
            <button className="w-full rounded-2xl bg-white/10 px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-white/15">
              + New chat
            </button>
            {recentChats.map((chat) => (
              <button
                key={chat}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10"
              >
                {chat}
              </button>
            ))}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div className="mb-3 flex items-center gap-2 text-white">
              <Sparkles size={16} />
              Suggestions
            </div>
            <div className="space-y-3">
              {suggestions.map((item) => (
                <div key={item} className="rounded-2xl bg-slate-950/70 px-4 py-3 text-sm leading-6">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="rounded-[32px] border border-white/10 bg-slate-950/95 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
          <div className="border-b border-white/10 bg-slate-950/95 px-6 py-5 sm:flex sm:items-center sm:justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-200">
                <ArrowLeft size={16} />
                Back to dashboard
              </Link>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Mailgent Chat
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Ask anything about your inbox, summarize threads, and draft responses instantly.
              </p>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-200 sm:mt-0">
              <Bot className="text-cyan-300" size={18} />
              Live Gmail assistant
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:px-8 xl:py-8">
            <div className="flex h-full flex-col rounded-[28px] border border-white/10 bg-[#111827]/80 p-4 shadow-inner shadow-white/5 sm:p-6">
              <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-300 shadow-sm">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-cyan-300" />
                  <span className="font-semibold text-white">GPT-4 Mailgent</span>
                </div>
                <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Connected
                </span>
              </div>

              <div className="mt-6 flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/90">
                <div className="max-h-[66vh] overflow-y-auto px-4 py-5 sm:px-5">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[88%] rounded-[24px] px-4 py-4 text-sm leading-7 shadow-[0_4px_20px_rgba(0,0,0,0.08)] sm:max-w-[78%] ${
                            message.role === "user"
                              ? "bg-gradient-to-br from-sky-500 to-cyan-400 text-slate-950"
                              : "border border-white/10 bg-slate-900/90 text-slate-100"
                          }`}
                        >
                          {message.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[28px] border border-white/10 bg-slate-950/95 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.12)] sm:p-5">
                <form className="flex flex-col gap-3">
                  <label className="sr-only" htmlFor="chat-input">
                    Chat prompt
                  </label>
                  <textarea
                    id="chat-input"
                    rows={2}
                    placeholder="Type your message..."
                    className="min-h-[96px] w-full resize-none rounded-2xl border border-white/10 bg-slate-900/95 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2 text-[13px] text-slate-400">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Shift + Enter for newline</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">AI-powered Gmail context</span>
                    </div>
                    <button className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                      <Send size={16} className="mr-2" />
                      Send message
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <aside className="space-y-6 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:p-6">
              <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-sm text-slate-300">
                <div className="mb-3 flex items-center gap-2 text-white">
                  <Sparkles size={16} />
                  Quick tips
                </div>
                <p className="leading-6 text-slate-400">
                  Use the chat to summarize emails, draft responses, and surface key info from your inbox.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-sm text-slate-300">
                <div className="mb-3 flex items-center gap-2 text-white">
                  <Clock3 size={16} />
                  Recent actions
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl bg-white/5 px-4 py-3">Summarize latest thread</div>
                  <div className="rounded-2xl bg-white/5 px-4 py-3">Draft reply to support ticket</div>
                  <div className="rounded-2xl bg-white/5 px-4 py-3">Find urgent sender threads</div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-sm text-slate-300">
                <div className="mb-3 flex items-center gap-2 text-white">
                  <Star size={16} />
                  Why Mailgent?
                </div>
                <ul className="space-y-3 pl-4 text-slate-400">
                  <li>• Smart email summaries</li>
                  <li>• Instant reply generation</li>
                  <li>• Priority inbox insights</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
