interface EmailSummary {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  size: string;
  category?: string;
}

interface ChatMessage {
  role: "user" | "model";
  parts: [{ text: string }];
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (res.status === 401) {
    window.location.href = "/";
    throw new Error("Unauthenticated");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export const api = {
  getStats: () => req<any>("/gmail/stats"),

  searchEmails: (q: string, max = 20) =>
    req<{ emails: EmailSummary[]; total: number }>(
      `/gmail/search?q=${encodeURIComponent(q)}&max=${max}`
    ),

  trashEmails: (ids: string[]) =>
    req<{ trashed: number; failed: number }>("/gmail/trash", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),

  archiveEmail: (id: string) =>
    req("/gmail/archive", {
      method: "POST",
      body: JSON.stringify({ id }),
    }),

  chat: (message: string, history: ChatMessage[]) =>
    req<{ reply: string }>("/agent/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
};