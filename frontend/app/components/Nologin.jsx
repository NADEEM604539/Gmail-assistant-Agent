import React from 'react'
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Mail,
  Sparkles,
  ShieldCheck,
  BarChart3,
  BrainCircuit,
  Menu,
} from "lucide-react";

const Nologin = () => {
   return (
    <main className="min-h-screen bg-slate-50 text-gray-900">

      {/* ================= Background ================= */}

      <div className="fixed inset-0 -z-10 overflow-hidden">

        <div className="absolute -top-40 -left-20 h-96 w-96 rounded-full bg-red-200 blur-[120px] opacity-40" />

        <div className="absolute top-40 right-0 h-[450px] w-[450px] rounded-full bg-violet-300 blur-[150px] opacity-30" />

        <div className="absolute bottom-0 left-1/2 h-[350px] w-[350px] rounded-full bg-blue-200 blur-[130px] opacity-40" />

      </div>

      {/* ================= Navbar ================= */}

      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EA4335] text-white">

              <Mail size={22} />

            </div>

            <div>

              <h1 className="text-xl font-bold">Mailgent</h1>

              <p className="text-xs text-gray-500">AI Gmail Assistant</p>

            </div>

          </div>

          <div className="hidden gap-8 md:flex">

            <a href="#" className="hover:text-[#EA4335]">
              Features
            </a>

            <a href="#" className="hover:text-[#EA4335]">
              AI
            </a>

            <a href="#" className="hover:text-[#EA4335]">
              Pricing
            </a>

            <a href="#" className="hover:text-[#EA4335]">
              Docs
            </a>
          </div>

          <div className="flex items-center gap-3">

            <Link
              href="/login"
              className="hidden rounded-xl border border-gray-300 px-5 py-2 font-medium transition hover:bg-gray-100 md:block"
            >
              Login
            </Link>

            <Link
              href="/login"
              className="rounded-xl bg-[#EA4335] px-5 py-2 font-semibold text-white transition hover:bg-[#D93025]"
            >
              Get Started
            </Link>

            <button className="md:hidden">
              <Menu />
            </button>

          </div>

        </div>

      </nav>

      {/* ================= Hero ================= */}

      <section className="mx-auto flex max-w-7xl flex-col items-center gap-16 px-6 py-20 lg:flex-row">

        {/* Left */}

        <div className="flex-1">

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300 bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700">

            <Sparkles size={16} />

            Powered by AI

          </div>

          <h1 className="text-5xl font-extrabold leading-tight lg:text-7xl">

            Your Gmail

            <br />

            <span className="text-[#EA4335]">Powered</span>

            {" "}
            by AI.

          </h1>

          <p className="mt-8 max-w-xl text-lg leading-8 text-gray-600">

            Mailgent automatically summarizes emails, writes intelligent
            replies, prioritizes important conversations, removes spam, and
            keeps your inbox organized.

          </p>

          <div className="mt-10 flex flex-wrap gap-4">

            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl bg-[#EA4335] px-7 py-4 font-semibold text-white transition hover:bg-[#D93025]"
            >
              Connect Gmail

              <ArrowRight size={18} />

            </Link>

            <button className="rounded-xl border border-gray-300 bg-white px-7 py-4 font-semibold hover:bg-gray-100">

              Live Demo

            </button>

          </div>

        </div>

        {/* Right Dashboard */}

        <div className="flex-1">

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">

            <div className="mb-6 flex items-center justify-between">

              <h2 className="text-lg font-bold">

                Dashboard

              </h2>

              <span className="rounded-full bg-violet-100 px-4 py-1 text-sm font-semibold text-violet-700">

                AI Active

              </span>

            </div>

            <div className="grid gap-4 md:grid-cols-2">

              <Card
                icon={<Mail className="text-[#4285F4]" />}
                title="Unread Emails"
                value="247"
              />

              <Card
                icon={<BrainCircuit className="text-violet-600" />}
                title="AI Summaries"
                value="56"
              />

              <Card
                icon={<ShieldCheck className="text-green-600" />}
                title="Spam Removed"
                value="93"
              />

              <Card
                icon={<BarChart3 className="text-[#EA4335]" />}
                title="Time Saved"
                value="18 hrs"
              />

            </div>

            <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#4285F4] to-[#7C3AED] p-6 text-white">

              <div className="flex items-center gap-3">

                <Bot />

                <h3 className="font-bold">

                  AI Assistant

                </h3>

              </div>

              <p className="mt-3 text-sm text-white/90">

                "You have 7 high-priority emails.
                I can summarize all of them in 10 seconds."

              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ================= Features ================= */}

      <section className="mx-auto max-w-7xl px-6 pb-24">

        <h2 className="mb-12 text-center text-4xl font-bold">

          Everything your Gmail wishes it could do

        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

          <Feature
            icon={<Sparkles className="text-violet-600" />}
            title="AI Summary"
            text="Summarize long conversations instantly."
          />

          <Feature
            icon={<Bot className="text-[#EA4335]" />}
            title="Smart Replies"
            text="Generate natural email replies."
          />

          <Feature
            icon={<ShieldCheck className="text-green-600" />}
            title="Spam Detection"
            text="AI filters unnecessary emails."
          />

          <Feature
            icon={<BarChart3 className="text-[#4285F4]" />}
            title="Analytics"
            text="Track productivity and response time."
          />

        </div>

      </section>

      {/* ================= CTA ================= */}

      <section className="mx-6 mb-20 rounded-3xl bg-gradient-to-r from-[#4285F4] to-[#7C3AED] py-20 text-center text-white">

        <h2 className="text-4xl font-bold">

          Let AI handle your inbox.

        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-white/90">

          Connect your Gmail in seconds and experience a smarter, faster,
          AI-powered workflow.

        </p>

        <Link
          href="/login"
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-[#7C3AED] transition hover:scale-105"
        >

          Get Started

          <ArrowRight size={18} />

        </Link>

      </section>

    </main>
  );
}

function Card({ icon, title, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-4">{icon}</div>
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="mt-2 text-3xl font-bold">{value}</h3>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition hover:-translate-y-2 hover:shadow-xl">
      <div className="mb-5">{icon}</div>
      <h3 className="mb-3 text-xl font-bold">{title}</h3>
      <p className="text-gray-600">{text}</p>
    </div>
  );
}


export default Nologin