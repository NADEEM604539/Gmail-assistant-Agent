const STORAGE_KEY = "mailgent_chat_threads";

const defaultThreads = [
  {
    id: "welcome",
    title: "Welcome to Mailgent",
    messages: [
      {
        role: "assistant",
        text: "This is your Mailgent chat workspace. Start a new thread to summarize emails, draft replies, or search your inbox.",
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

export function loadThreads() {
  if (typeof window === "undefined") return defaultThreads;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultThreads;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultThreads;
  } catch {
    return defaultThreads;
  }
}

export function saveThreads(threads) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

export function getThread(id) {
  const threads = loadThreads();
  return threads.find((thread) => thread.id === id);
}

export function upsertThread(thread) {
  const threads = loadThreads();
  const next = [thread, ...threads.filter((item) => item.id !== thread.id)];
  saveThreads(next);
  return next;
}

export function addThread(thread) {
  const threads = loadThreads();
  const next = [thread, ...threads.filter((item) => item.id !== thread.id)];
  saveThreads(next);
  return next;
}
