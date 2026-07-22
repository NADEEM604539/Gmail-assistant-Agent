"use client";
import { useGoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";

import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

export default function LoginPage() {
    const router = useRouter()
  const login = useGoogleLogin({
    scope: "openid email profile https://mail.google.com/",
    flow: "auth-code",
    onSuccess: async (tokenResponse) => {
      try {
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const response = await fetch(
          `${apiBaseUrl}/api/auth/google/callback`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              code: tokenResponse.code,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Google login failed");
        }

        const data = await response.json();
        const accessToken = data?.access_token;

        if (!accessToken) {
          throw new Error("Access token missing in response");
        }

        localStorage.setItem("access_token", accessToken);
        router.push('/')
      } catch (error) {
        console.error(error);
      }
    },
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F6F8FC] px-6 py-8 font-[system-ui] text-[#202124] sm:px-8 lg:px-10 lg:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(66,133,244,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(52,168,83,0.10),_transparent_30%),linear-gradient(180deg,_#F9FBFF_0%,_#F6F8FC_40%,_#F3F6FB_100%)]" />
      <div className="absolute left-[-7rem] top-20 h-72 w-72 rounded-full bg-[#4285F4]/10 blur-3xl" />
      <div className="absolute bottom-[-5rem] right-[-5rem] h-80 w-80 rounded-full bg-[#34A853]/10 blur-3xl" />

      <Link
        href="/"
        className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-2 text-sm font-medium text-[#5F6368] shadow-[0_1px_2px_rgba(60,64,67,0.08)] backdrop-blur transition hover:text-[#202124]"
      >
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(390px,460px)] lg:gap-16">
        <section className="hidden lg:block">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D2E3FC] bg-white/80 px-4 py-2 text-sm font-medium text-[#1A73E8] shadow-[0_1px_2px_rgba(60,64,67,0.08)] backdrop-blur">
              <Sparkles size={16} />
              Built for Gmail workflows
            </div>

            <h1 className="mt-6 text-[3.6rem] font-semibold tracking-[-0.05em] text-[#202124] xl:text-[4.25rem] xl:leading-[1.02]">
              A cleaner way to handle your inbox.
            </h1>
            <p className="mt-5 max-w-xl text-[1.15rem] leading-9 text-[#5F6368] xl:text-[1.22rem]">
              Mailgent keeps the familiar Gmail feel while adding AI summaries,
              smarter replies, and safer organization tools.
            </p>

            <div className="mt-10 grid max-w-xl gap-4 sm:grid-cols-3">
              <InfoTile value="AI" label="Summaries" tone="blue" />
              <InfoTile value="1-click" label="Smart replies" tone="green" />
              <InfoTile value="Scoped" label="Inbox access" tone="amber" />
            </div>

            <div className="mt-10 grid max-w-2xl gap-4 md:grid-cols-2">
              <FeatureCard
                icon={<ShieldCheck size={18} className="text-[#188038]" />}
                title="Secure by default"
                text="OAuth access, signed tokens, and revocable permissions keep your account protected."
              />
              <FeatureCard
                icon={<Lock size={18} className="text-[#1A73E8]" />}
                title="Private inbox tooling"
                text="Your Gmail password is never stored, and every permission stays scoped to what you approve."
              />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[440px]">
          <div className="overflow-hidden rounded-[30px] border border-[#DADCE0] bg-white/95 shadow-[0_1px_2px_rgba(60,64,67,0.08),0_18px_48px_rgba(60,64,67,0.12)] backdrop-blur">
            <div className="h-1 w-full bg-[linear-gradient(90deg,_#EA4335,_#FBBC05,_#34A853,_#4285F4)]" />

            <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
              <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:justify-start">
              <GmailMark />
                <div className="text-center lg:text-left">
                  <h1 className="text-[27px] font-semibold leading-8 tracking-[-0.03em] text-[#202124] lg:text-[31px]">
                    Sign in to Mailgent
                  </h1>
                  <p className="mt-1 text-[16px] leading-7 text-[#5F6368] lg:text-[17px]">
                    Your AI-powered Gmail assistant
                  </p>
                </div>
              </div>

              <button
                onClick={() => login()}
                className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-[#DADCE0] bg-white px-4 py-3.5 text-[16px] font-semibold text-[#3C4043] shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#F8F9FA] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40 active:bg-[#F1F3F4]"
              >
                <GoogleG />
                Continue with Google
              </button>

              <div className="mt-8 grid gap-6">
                <div className="rounded-2xl border border-[#E8EAED] bg-[#F8FAFF] p-5">
                  <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#80868B]">
                    Why we need access
                  </h3>
                  <div className="mt-4 space-y-3.5">
                    <Permission text="Read your emails to generate AI summaries." />
                    <Permission text="Detect important emails and spam automatically." />
                  </div>
                </div>

                <div className="rounded-2xl bg-[#E6F4EA] p-5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-[#188038]" />
                    <h3 className="text-sm font-semibold text-[#188038]">
                      Security & privacy
                    </h3>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-[14px] leading-6 text-[#1E4620]">
                    <li>Google OAuth handles authentication securely.</li>
                    <li>Your Gmail password is never stored by Mailgent.</li>
                    <li>You can revoke access anytime from Google.</li>
                  </ul>
                </div>
              </div>

              <p className="mt-8 text-center text-[13px] leading-6 text-[#80868B]">
                By continuing, you agree to Mailgent&apos;s{" "}
                <span className="cursor-pointer font-medium text-[#4285F4] hover:underline">
                  Terms
                </span>{" "}
                and{" "}
                <span className="cursor-pointer font-medium text-[#4285F4] hover:underline">
                  Privacy Policy
                </span>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* Gmail-style envelope mark built from the four Google colors */
function GmailMark() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_4px_8px_rgba(60,64,67,0.1)]">
      <svg width="34" height="26" viewBox="0 0 34 26" fill="none">
        <path
          d="M3 2h28c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2Z"
          fill="#FFFFFF"
          stroke="#DADCE0"
          strokeWidth="1"
        />
        <path d="M1 5.5 17 16 33 5.5" stroke="#EA4335" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 5v17" stroke="#4285F4" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M32 5v17" stroke="#34A853" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

function Permission({ text }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#34A853]" />
      <p className="text-[14.5px] leading-6 text-[#3C4043]">{text}</p>
    </div>
  );
}

function InfoTile({ value, label, tone }) {
  const tones = {
    blue: "border-[#D2E3FC] bg-[#F8FAFF] text-[#1A73E8]",
    green: "border-[#CEEAD6] bg-[#F3FBF4] text-[#188038]",
    amber: "border-[#FEEFC3] bg-[#FFF9E6] text-[#F29900]",
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_1px_2px_rgba(60,64,67,0.06)] ${tones[tone]}`}>
      <div className="text-[1.15rem] font-semibold tracking-[-0.03em]">{value}</div>
      <div className="mt-1 text-sm font-medium text-[#5F6368]">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/82 p-5 shadow-[0_1px_2px_rgba(60,64,67,0.06)] backdrop-blur">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F3F4]">
        {icon}
      </div>
      <h3 className="mt-4 text-[16px] font-semibold text-[#202124]">{title}</h3>
      <p className="mt-2 text-[15px] leading-6 text-[#5F6368]">{text}</p>
    </div>
  );
}
