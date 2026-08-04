import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F6F8FC] px-6 py-10 text-[#202124] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-[#DADCE0] bg-white p-6 shadow-[0_1px_2px_rgba(60,64,67,0.08),0_18px_48px_rgba(60,64,67,0.12)] sm:p-8 lg:p-10">
        <Link
          href="/login"
          className="inline-flex items-center rounded-full border border-[#DADCE0] bg-[#F8F9FA] px-3 py-2 text-sm font-medium text-[#3C4043] transition hover:bg-[#F1F3F4]"
        >
          ← Back to login
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-[#202124] sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-[15px] leading-7 text-[#5F6368]">
          Mailgent uses Google OAuth to confirm your identity and reads selected Gmail data only when you approve access for AI assistance workflows.
        </p>

        <div className="mt-8 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-[#202124]">What we access</h2>
            <p className="mt-2 text-[15px] leading-7 text-[#5F6368]">
              We use your Gmail permission to read messages, create or update drafts, and help summarize or reply to inbox content. We do not store your Gmail password.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#202124]">What we store</h2>
            <p className="mt-2 text-[15px] leading-7 text-[#5F6368]">
              We keep only the minimum account information needed to deliver the experience, such as your signed-in account identity and session tokens issued by our app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#202124]">How you can control it</h2>
            <p className="mt-2 text-[15px] leading-7 text-[#5F6368]">
              You can revoke access through your Google account permissions at any time. If you would like to remove your session from the app, sign out and clear saved local browser data.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
