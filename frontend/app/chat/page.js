"use client";

import Link from "next/link";
import { ArrowLeft, Bot, Sparkles, SendHorizonal, Wand2 } from "lucide-react";

const quickPrompts = [
  "Summarize my unread emails",
  "Find important emails from today",
  "Draft a reply to the last client email",
  "Show emails that need follow-up",
];

const messages = [
  {
    role: "assistant",
    text: "Hello! I can help summarize mail, draft replies, and surface important messages.",
  },
  {
    role: "user",
    text: "Show me the urgent emails first.",
  },
  {
    role: "assistant",
    text: "I found 3 messages marked important and 2 security alerts that need attention.",
  },
];

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-[#F6F8FC] px-4 py-4 text-[#202124] sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <section className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[30px] border border-[#DADCE0] bg-white shadow-[0_1px_2px_rgba(60,64,67,0.08),0_18px_48px_rgba(60,64,67,0.12)]">
          <div className="h-1 w-full bg-[linear-gradient(90deg,_#EA4335,_#FBBC05,_#34A853,_#4285F4)]" />

          <div className="flex flex-col gap-6 border-b border-[#F1F3F4] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#5F6368] transition hover:text-[#202124]">
                <ArrowLeft size={16} />
                Back to dashboard
              </Link>
              <h1 className="mt-4 text-[2rem] font-semibold tracking-[-0.04em] text-[#202124] sm:text-[2.6rem] lg:text-[3rem]">
                Chat with Agent
              </h1>
              <p className="mt-2 max-w-2xl text-[1rem] leading-7 text-[#5F6368]">
                Ask Mailgent to summarize, search, prioritize, or draft replies from your inbox.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[#E8EAED] bg-[#F8FAFF] px-4 py-3 text-sm text-[#5F6368] shadow-sm">
              <Bot className="text-[#1A73E8]" size={22} />
              <div>
                <p className="font-medium text-[#202124]">AI Agent ready</p>
                <p>Connected to your Gmail session</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,360px)] lg:p-6">
            <div className="rounded-[28px] border border-[#E8EAED] bg-[#F8FAFF] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-[#1A73E8]">
                <Sparkles size={16} />
                Conversation
              </div>

              <div className="mt-5 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[75%] ${
                        message.role === "user"
                          ? "bg-[#4285F4] text-white"
                          : "border border-[#E8EAED] bg-white text-[#202124]"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    className="rounded-2xl border border-[#E8EAED] bg-white px-4 py-3 text-left text-sm font-medium text-[#202124] transition hover:border-[#D2E3FC] hover:bg-[#EEF4FF]"
                  >
                    <Wand2 size={16} className="mb-2 text-[#1A73E8]" />
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-[24px] border border-[#DADCE0] bg-white px-4 py-3 shadow-sm">
                <input
                  type="text"
                  placeholder="Ask me anything about your emails..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#202124] outline-none placeholder:text-[#80868B]"
                />
                <button className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#4285F4] text-white transition hover:bg-[#1A73E8]">
                  <SendHorizonal size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <SidePanel title="What I can do" items={[
                "Summarize long threads",
                "Find urgent or important messages",
                "Draft and refine replies",
                "Review recent drafts",
              ]} />
              <SidePanel title="Suggested next steps" items={[
                "Summarize unread mail",
                "Show emails from this week",
                "Draft a response to the latest client message",
                "Find anything marked important",
              ]} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SidePanel({ title, items }) {
  return (
    <div className="rounded-[28px] border border-[#E8EAED] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#202124]">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="rounded-2xl bg-[#F8FAFF] px-4 py-3 text-sm leading-6 text-[#3C4043]">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
