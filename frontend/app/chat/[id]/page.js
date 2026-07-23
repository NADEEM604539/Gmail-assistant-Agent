"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Sparkles,
  Paperclip,
  Mic,
  Send,
} from "lucide-react";
import Sidebar from "../Sidebar";

function loadThreads() {
  if (typeof window === "undefined") return [];

  return JSON.parse(localStorage.getItem("mailgent_threads") || "[]");
}

function saveThreads(threads) {
  localStorage.setItem(
    "mailgent_threads",
    JSON.stringify(threads)
  );
}

export default function ChatPage() {
  const router = useRouter();
  const { id } = useParams();

  const [threads, setThreads] = useState([]);
  const [thread, setThread] = useState({ messages: [] });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    const all = loadThreads();

    setThreads(all);

    const thread = all.find((t) => t.id === id);

    if (thread) {
      setThread(thread);
      setMessages(thread.messages || []);
    }
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  function sendMessage() {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      text: input,
    };

    const assistantMessage = {
      role: "assistant",
      text: "This is where your LangGraph response will appear.",
    };

    const updatedMessages = [
      ...messages,
      userMessage,
      assistantMessage,
    ];

    setMessages(updatedMessages);

    const updatedThreads = threads.map((thread) =>
      thread.id === id
        ? {
            ...thread,
            preview: input,
            updated: "Just now",
            messages: updatedMessages,
          }
        : thread
    );

    setThreads(updatedThreads);

    saveThreads(updatedThreads);

    setInput("");
  }

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-white">

      <Sidebar
        conversations={threads}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        activeId={id}
        onNew={() => router.push("/chat")}
      />

      <main className="flex-1 flex flex-col">

        {/* Messages */}

        <div className="flex-1 overflow-y-auto">

          <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

            {messages.map((message, index) => (

              <div
                key={index}
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >

                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4285F4] flex items-center justify-center mr-3">
                    <Sparkles size={14} />
                  </div>
                )}

                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                    message.role === "user"
                      ? "bg-[#171717] border border-[#2a2a2a]"
                      : ""
                  }`}
                >
                  {message.text}
                </div>

              </div>

            ))}

            <div ref={bottomRef} />

          </div>

        </div>

        {/* Input */}

        <div className="px-6 pb-6">

          <div className="max-w-3xl mx-auto bg-[#171717] border border-[#2a2a2a] rounded-3xl p-3">

            <textarea
              rows={1}
              value={input}
              placeholder="Message Mailgent..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="w-full resize-none bg-transparent outline-none text-sm"
            />

            <div className="flex items-center justify-between mt-3">

              <div className="flex gap-2">

                <button className="p-2 rounded-lg hover:bg-[#222]">
                  <Paperclip size={16} />
                </button>

                <button className="p-2 rounded-lg hover:bg-[#222]">
                  <Mic size={16} />
                </button>

              </div>

              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="bg-[#7C3AED] hover:bg-[#6d28d9] disabled:opacity-40 rounded-xl px-4 py-2"
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