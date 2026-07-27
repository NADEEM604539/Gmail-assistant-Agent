"use client";

import { useMemo, useState } from "react";
import { X, Sparkles, PenLine, ChevronDown, ChevronUp } from "lucide-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function invalidEmails(list) {
  return list.filter((email) => !EMAIL_REGEX.test(email));
}

export default function NewDraftPopup({ open, onClose, onSubmit }) {
  const [mode, setMode] = useState("ai"); // "ai" | "manual"

  // Manual mode fields
  const [to, setTo] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [manualSubject, setManualSubject] = useState("");
  const [body, setBody] = useState("");

  // AI mode fields
  const [topic, setTopic] = useState("");
  const [aiRecipients, setAiRecipients] = useState("");
  const [aiSubject, setAiSubject] = useState("");
  const [tone, setTone] = useState("Professional");
  const [context, setContext] = useState("");
  const [targetLength, setTargetLength] = useState("");

  const [errors, setErrors] = useState({});

  if (!open) {
    return null;
  }

  const resetForNextOpen = () => {
    setErrors({});
  };

  const handleClose = () => {
    resetForNextOpen();
    onClose();
  };

  const validateManual = () => {
    const nextErrors = {};
    const toList = parseEmails(to);
    const ccList = parseEmails(cc);
    const bccList = parseEmails(bcc);

    if (toList.length === 0) {
      nextErrors.to = "Add at least one recipient.";
    } else {
      const bad = invalidEmails(toList);
      if (bad.length) nextErrors.to = `Not a valid email: ${bad.join(", ")}`;
    }

    if (cc) {
      const bad = invalidEmails(ccList);
      if (bad.length) nextErrors.cc = `Not a valid email: ${bad.join(", ")}`;
    }

    if (bcc) {
      const bad = invalidEmails(bccList);
      if (bad.length) nextErrors.bcc = `Not a valid email: ${bad.join(", ")}`;
    }

    if (!manualSubject.trim()) nextErrors.manualSubject = "Add a subject.";
    if (!body.trim()) nextErrors.body = "Write the email body.";

    return { nextErrors, toList, ccList, bccList };
  };

  const validateAi = () => {
    const nextErrors = {};
    const recipientsList = parseEmails(aiRecipients);

    if (!topic.trim()) nextErrors.topic = "Tell the assistant what this email is about.";

    if (aiRecipients) {
      const bad = invalidEmails(recipientsList);
      if (bad.length) nextErrors.aiRecipients = `Not a valid email: ${bad.join(", ")}`;
    }

    return { nextErrors, recipientsList };
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (mode === "manual") {
      const { nextErrors, toList, ccList, bccList } = validateManual();
      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors);
        return;
      }

      setErrors({});
      onSubmit({
        mode: "manual",
        to: toList,
        cc: ccList,
        bcc: bccList,
        subject: manualSubject.trim(),
        body: body.trim(),
      });
      return;
    }

    const { nextErrors, recipientsList } = validateAi();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSubmit({
      mode: "ai",
      topic: topic.trim(),
      recipients: recipientsList,
      subject: aiSubject.trim() || undefined,
      tone,
      context: context.trim() || undefined,
      target_word_count: targetLength ? Number(targetLength) : undefined,
    });
  };

  const fieldBase =
    "w-full border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#1a73e8] focus:ring-2 focus:ring-[#d2e8ff] placeholder:text-slate-400";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-4 sm:items-center">
      <div className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header - Gmail compose style */}
        <div className="flex items-center justify-between bg-[#202124] px-4 py-3">
          <p className="text-sm font-medium text-white">New draft</p>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode switch - segmented control */}
        <div className="flex gap-1 border-b border-slate-200 bg-slate-50 p-2">
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === "ai"
                ? "bg-[#eef4ff] text-[#1a73e8]"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Sparkles size={14} />
            AI compose
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === "manual"
                ? "bg-[#eef4ff] text-[#1a73e8]"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <PenLine size={14} />
            Write myself
          </button>
        </div>

        {/* Body - scrolls if content is tall, header/footer stay put */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {mode === "manual" ? (
              <div className="divide-y divide-slate-100">
                {/* To */}
                <div className="flex items-center gap-2 py-2">
                  <label className="w-12 shrink-0 text-sm text-slate-500">To</label>
                  <input
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                    placeholder="name@company.com, name2@company.com"
                    className="flex-1 border-none bg-transparent py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCcBcc((prev) => !prev)}
                    className="shrink-0 text-xs font-medium text-slate-500 hover:text-[#1a73e8]"
                  >
                    Cc/Bcc
                  </button>
                </div>
                {errors.to && <p className="pb-1 text-xs text-red-500">{errors.to}</p>}

                {showCcBcc && (
                  <>
                    <div className="flex items-center gap-2 py-2">
                      <label className="w-12 shrink-0 text-sm text-slate-500">Cc</label>
                      <input
                        value={cc}
                        onChange={(event) => setCc(event.target.value)}
                        placeholder="Optional"
                        className="flex-1 border-none bg-transparent py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                    {errors.cc && <p className="pb-1 text-xs text-red-500">{errors.cc}</p>}

                    <div className="flex items-center gap-2 py-2">
                      <label className="w-12 shrink-0 text-sm text-slate-500">Bcc</label>
                      <input
                        value={bcc}
                        onChange={(event) => setBcc(event.target.value)}
                        placeholder="Optional"
                        className="flex-1 border-none bg-transparent py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                    {errors.bcc && <p className="pb-1 text-xs text-red-500">{errors.bcc}</p>}
                  </>
                )}

                {/* Subject */}
                <div className="py-2">
                  <input
                    value={manualSubject}
                    onChange={(event) => setManualSubject(event.target.value)}
                    placeholder="Subject"
                    className="w-full border-none bg-transparent py-1 text-sm font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
                  />
                  {errors.manualSubject && (
                    <p className="pt-1 text-xs text-red-500">{errors.manualSubject}</p>
                  )}
                </div>

                {/* Body */}
                <div className="py-2">
                  <textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Write your email"
                    rows={9}
                    className="w-full resize-none border-none bg-transparent py-1 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  {errors.body && <p className="pt-1 text-xs text-red-500">{errors.body}</p>}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    What's this email about?
                  </label>
                  <textarea
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="E.g. follow up on Tuesday's proposal, reply declining the invite, recap this thread"
                    rows={2}
                    className={`${fieldBase} rounded-lg`}
                  />
                  {errors.topic && <p className="mt-1 text-xs text-red-500">{errors.topic}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Recipients <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    value={aiRecipients}
                    onChange={(event) => setAiRecipients(event.target.value)}
                    placeholder="name@company.com, name2@company.com"
                    className={`${fieldBase} rounded-lg`}
                  />
                  {errors.aiRecipients && (
                    <p className="mt-1 text-xs text-red-500">{errors.aiRecipients}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Subject <span className="font-normal text-slate-400">(optional — AI will suggest one)</span>
                  </label>
                  <input
                    value={aiSubject}
                    onChange={(event) => setAiSubject(event.target.value)}
                    placeholder="Leave blank to let the assistant decide"
                    className={`${fieldBase} rounded-lg`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Tone</label>
                    <select
                      value={tone}
                      onChange={(event) => setTone(event.target.value)}
                      className={`${fieldBase} rounded-lg`}
                    >
                      <option>Professional</option>
                      <option>Friendly</option>
                      <option>Casual</option>
                      <option>Formal</option>
                      <option>Persuasive</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Length <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      value={targetLength}
                      onChange={(event) => setTargetLength(event.target.value)}
                      type="number"
                      min="0"
                      placeholder="~ words"
                      className={`${fieldBase} rounded-lg`}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Additional context <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    value={context}
                    onChange={(event) => setContext(event.target.value)}
                    placeholder="Anything else the assistant should know — background, links, key points to hit"
                    rows={3}
                    className={`${fieldBase} rounded-lg`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-[#1a73e8] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#1662d9]"
            >
              {mode === "manual" ? "Save draft" : "Generate draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
