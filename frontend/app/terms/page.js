import Link from "next/link";

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-4 text-[15px] leading-7 text-[#5F6368]">
          By using Mailgent, you agree that the service may access your Gmail data only within the scope of permissions you authorize and for the purpose of helping you manage inbox workflows.
        </p>

        <div className="mt-8 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-[#202124]">Account usage</h2>
            <p className="mt-2 text-[15px] leading-7 text-[#5F6368]">
              You are responsible for your account activity and any actions performed through the app using your approved Gmail access.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#202124]">AI-generated output</h2>
            <p className="mt-2 text-[15px] leading-7 text-[#5F6368]">
              AI summaries, draft suggestions, and reply assistance are generated for convenience and should be reviewed before sending or relying on them in a formal workflow.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#202124]">Service availability</h2>
            <p className="mt-2 text-[15px] leading-7 text-[#5F6368]">
              Features may change, be paused, or be limited based on provider availability, account permissions, or system maintenance.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
