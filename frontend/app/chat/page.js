"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Sparkles, Paperclip, Mic, Send } from "lucide-react";
import Sidebar from "./Sidebar";

const suggestions = [
  "Summarize unread emails",
  "Find invoices from last month",
  "Draft a reply to Sarah",
  "Show important emails",
];

function loadThreads() {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(localStorage.getItem("mailgent_threads") || "[]");
  } catch {
    return [];
  }
}

function saveThread(thread) {
  const stored = loadThreads();
  localStorage.setItem(
    "mailgent_threads",
    JSON.stringify([thread, ...stored])
  );
}

export default function HomePage() {
  const router = useRouter();

  const [input, setInput] = useState("");
  const [threads, setThreads] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setThreads(loadThreads());
  }, []);

  const handleSend = (text) => {
    const message = (text ?? input).trim();

    if (!message) return;

    const id = `thread-${Date.now()}`;

    const thread = {
      id,
      title: message,
      preview: message,
      updated: "Just now",
      messages: [
        {
          role: "user",
          text: message,
        },
      ],
    };

    saveThread(thread);

    router.push(`/chat/${id}`);
  };

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-white">

      <Sidebar
        conversations={threads}
        onNew={() => router.push("/")}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        activeId={null}
      />

      <main className="flex-1 flex flex-col">

        {/* Center */}

        <div className="flex-1 flex items-center justify-center px-6">

          <div className="w-full max-w-2xl text-center">

            <div className="mx-auto mb-8 w-20 h-20 rounded-3xl bg-gradient-to-br from-[#7C3AED] to-[#4285F4] flex items-center justify-center">
              <Mail size={34} />
            </div>

            <h1 className="text-4xl font-semibold mb-3">
              How can I help you today?
            </h1>

            <p className="text-[#8e8ea0] mb-10">
              Ask Mailgent anything about your Gmail.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {suggestions.map((item) => (
                <button
                  key={item}
                  onClick={() => handleSend(item)}
                  className="rounded-2xl border border-[#2a2a2a] bg-[#171717] p-4 text-left hover:border-[#7C3AED]"
                >
                  <div className="flex gap-3 items-center">
                    <Sparkles
                      size={16}
                      className="text-[#7C3AED]"
                    />
                    <span>{item}</span>
                  </div>
                </button>
              ))}
            </div>

          </div>

        </div>

        {/* Input */}

        <div className="px-6 pb-6">

          <div className="max-w-3xl mx-auto rounded-3xl border border-[#2a2a2a] bg-[#171717] p-3">

            <textarea
              rows={1}
              placeholder="Message Mailgent..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="w-full bg-transparent outline-none resize-none text-sm"
            />

            <div className="flex justify-between items-center mt-3">

              <div className="flex gap-2">

                <button className="p-2 hover:bg-[#222] rounded-lg">
                  <Paperclip size={16} />
                </button>

                <button className="p-2 hover:bg-[#222] rounded-lg">
                  <Mic size={16} />
                </button>

              </div>

              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="bg-[#7C3AED] px-4 py-2 rounded-xl disabled:opacity-40"
              >
                <Send size={16} />
              </button>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}