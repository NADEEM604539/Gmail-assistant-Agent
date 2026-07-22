"use client";

"use client";

import Sidebar from "./Sidebar";
import { Bot, Sparkles, MessageSquare, ArrowRight, Paperclip, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const welcomeTips = [
  "Ask Mailgent to summarize your unread emails",
  "Draft a reply to any message",
  "Find urgent or important conversations",
];

export default function ChatPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const handleStartChat = (event) => {
    event.preventDefault();
    if (!prompt.trim()) return;
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    router.push(`/chat/${id}`);
  };

  return (
    <main className="min-h-screen bg-[#0B1220] px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 xl:grid xl:grid-cols-[300px_minmax(0,1fr)]">
        <Sidebar />

        <section className="rounded-[32px] border border-white/10 bg-slate-950/95 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
          <div className="border-b border-white/10 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Chat</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Start a new conversation
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                  Send your first prompt and Mailgent will open a new thread for you.
                </p>
              </div>
              <div className="rounded-3xl bg-white/5 px-4 py-3 text-sm text-slate-200">
                <div className="flex items-center gap-2">
                  <Bot className="text-cyan-300" size={18} />
                  Mailgent ready
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-8 xl:px-8 xl:py-10">
            <div className="flex flex-col gap-6 rounded-[28px] border border-white/10 bg-slate-950/90 p-6 text-slate-300 shadow-[0_20px_40px_rgba(0,0,0,0.25)] sm:p-8">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-center text-slate-300 shadow-inner shadow-black/20">
                <MessageSquare size={28} className="mx-auto text-cyan-300" />
                <h2 className="mt-4 text-2xl font-semibold text-white">Your new chat is ready.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Type a prompt below and Mailgent will create a new thread for this conversation.
                </p>
              </div>

              <div className="space-y-4">
                {welcomeTips.map((tip) => (
                  <div key={tip} className="rounded-3xl bg-slate-900/80 px-5 py-4 text-sm text-slate-300">
                    <p className="font-medium text-white">{tip}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleStartChat} className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask Mailgent something about your emails..."
                  className="min-h-[140px] w-full resize-none rounded-[24px] border border-white/10 bg-slate-900/95 px-4 py-4 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-white/5 px-3 py-1">Shift + Enter for newline</span>
                    <span className="rounded-full bg-white/5 px-3 py-1">New thread created on submit</span>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    <Send size={16} className="mr-2" />
                    Start chat
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
