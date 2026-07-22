import Link from "next/link";
import { ArrowLeft, Bot, Clock3, Download, Sparkles, UserCircle2, Layers, ShieldCheck } from "lucide-react";

const threadMessages = [
  {
    role: "assistant",
    label: "Mailgent",
    text: "Welcome back! Here’s the latest email summary and the top actions for this thread.",
  },
  {
    role: "user",
    label: "You",
    text: "Summarize the third email in this thread and draft a short reply.",
  },
  {
    role: "assistant",
    label: "Mailgent",
    text: "The third email is a client update asking for a status summary. I recommend replying with progress, next steps, and a delivery timeline.",
  },
];

const details = [
  { label: "Thread subject", value: "Project kickoff update and action items" },
  { label: "Last updated", value: "2 minutes ago" },
  { label: "Participants", value: "Adeel, Nadeem, Google Alerts" },
  { label: "Status", value: "Needs reply" },
];

export default function ThreadPage({ params }) {
  const { id } = params;

  return (
    <main className="min-h-screen bg-[#0B1220] px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 xl:grid xl:grid-cols-[1fr_320px]">
        <section className="rounded-[32px] border border-white/10 bg-slate-950/95 shadow-[0_20px_60px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-4 border-b border-white/10 bg-slate-950/90 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
                <ArrowLeft size={16} />
                Back to chats
              </Link>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Thread #{id}</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Project kickoff update and action items
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-white/5 px-4 py-3 text-slate-200 shadow-sm shadow-black/10">
              <Bot size={18} className="text-cyan-300" />
              <span>Mailgent thread view</span>
            </div>
          </div>

          <div className="flex min-h-[calc(100vh-160px)] flex-col p-6 sm:p-8">
            <div className="mb-6 rounded-[32px] border border-white/10 bg-slate-950/90 p-4 text-sm text-slate-300 shadow-inner shadow-black/20 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-cyan-300">
                    Active thread
                  </span>
                  <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs text-slate-300">
                    <Clock3 size={14} />
                    Updated 2 minutes ago
                  </div>
                </div>
                <button className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10">
                  <Download size={16} /> Export
                </button>
              </div>
            </div>

            <div className="space-y-4 overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/90 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:p-5">
              {threadMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[88%] rounded-[28px] border px-5 py-4 text-sm leading-7 shadow-[0_10px_30px_rgba(0,0,0,0.15)] ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950"
                      : "border-white/10 bg-slate-900/90 text-slate-100"
                  }`}>
                    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                      {message.role === "user" ? <UserCircle2 size={14} /> : <Bot size={14} />}
                      <span>{message.label}</span>
                    </div>
                    <p>{message.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sticky bottom-0 z-20 border-t border-white/10 bg-slate-950/95 px-6 py-5 backdrop-blur-xl sm:px-8">
            <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <textarea
                placeholder="Send a new message to Mailgent..."
                className="min-h-[110px] w-full resize-none rounded-[28px] border border-white/10 bg-slate-900/90 px-4 py-4 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
              <div className="flex flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-100 transition hover:bg-white/10">
                  + Attach
                </button>
                <button className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                  Send message
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:p-6">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/90 p-5 text-sm text-slate-300">
            <div className="mb-3 flex items-center gap-2 text-white">
              <Layers size={16} />
              Thread details
            </div>
            <div className="space-y-3">
              {details.map((detail) => (
                <div key={detail.label} className="rounded-2xl bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{detail.label}</p>
                  <p className="mt-1 text-sm text-slate-100">{detail.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/90 p-5 text-sm text-slate-300">
            <div className="mb-3 flex items-center gap-2 text-white">
              <ShieldCheck size={16} />
              Safe replies
            </div>
            <p className="leading-6 text-slate-400">
              Mailgent is using inbox context only for this thread. Your messages stay private and replies are generated securely.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
