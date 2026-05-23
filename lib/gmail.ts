import { google } from "googleapis";

// ── Types ─────────────────────────────────────────────────────
export interface EmailSummary {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  size: string;
  category?: string;
}

export interface StorageStats {
  email: string;
  name: string;
  picture?: string;
  totalEmails: number;
  largeAttachments: number;
  oldEmails: number;
  promotions: number;
  socialNotifs: number;
  spamCount: number;
}

export interface TrashResult {
  trashed: number;
  failed: number;
}

// ── Helper Functions ──────────────────────────────────────────
function bytesToSize(bytes: number): string {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseFrom(from: string | null | undefined): string {
  if (!from) return "Unknown";
  // "John Doe <john@example.com>" → "John Doe"
  const match = from.match(/^(.*?)\s*<(.+)>$/);
  if (match) return match[1].replace(/"/g, "").trim() || match[2];
  return from;
}

function formatDate(internalDate: string | null | undefined): string {
  if (!internalDate) return "Unknown";
  return new Date(parseInt(internalDate)).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Gmail Client Banao ────────────────────────────────────────
export function getGmailClient(accessToken: string, refreshToken: string) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );

  oauth2.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.gmail({ version: "v1", auth: oauth2 });
}

// ── Emails Search Karo ────────────────────────────────────────
export async function searchEmails(
  accessToken: string,
  refreshToken: string,
  query: string,
  maxResults: number = 20
): Promise<{ emails: EmailSummary[]; total: number }> {
  const gmail = getGmailClient(accessToken, refreshToken);

  // Step 1: Message IDs lo
  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: Math.min(maxResults, 50),
  });

  const total = listRes.data.resultSizeEstimate || 0;
  const messages = listRes.data.messages || [];

  if (messages.length === 0) return { emails: [], total };

  // Step 2: Har message ki details lo (parallel)
  const emails = await Promise.all(
    messages.map(async (msg) => {
      try {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
          format: "metadata",
          metadataHeaders: ["Subject", "From", "Date"],
        });

        const headers = detail.data.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find(
            (h) => h.name?.toLowerCase() === name.toLowerCase()
          )?.value;

        return {
          id: msg.id!,
          subject: getHeader("Subject") || "(No Subject)",
          from: parseFrom(getHeader("From")),
          date: formatDate(detail.data.internalDate),
          snippet: detail.data.snippet || "",
          size: bytesToSize(detail.data.sizeEstimate || 0),
        } as EmailSummary;
      } catch {
        return null;
      }
    })
  );

  // null filter karo
  return {
    emails: emails.filter(Boolean) as EmailSummary[],
    total,
  };
}

// ── Storage Stats Lo ──────────────────────────────────────────
export async function getStorageStats(
  accessToken: string,
  refreshToken: string,
  email: string,
  name: string,
  picture?: string
): Promise<StorageStats> {
  const gmail = getGmailClient(accessToken, refreshToken);

  // 6 queries parallel chalao — sirf count chahiye
  const queries = [
    "in:anywhere",
    "has:attachment larger:5m",
    "before:2023/01/01",
    "category:promotions",
    "category:social",
    "label:spam",
  ];

  const counts = await Promise.all(
    queries.map((q) =>
      gmail.users.messages
        .list({ userId: "me", q, maxResults: 1 })
        .then((r) => r.data.resultSizeEstimate || 0)
        .catch(() => 0)
    )
  );

  return {
    email,
    name,
    picture,
    totalEmails:      counts[0],
    largeAttachments: counts[1],
    oldEmails:        counts[2],
    promotions:       counts[3],
    socialNotifs:     counts[4],
    spamCount:        counts[5],
  };
}

// ── Single Email Trash Karo ───────────────────────────────────
export async function trashEmail(
  accessToken: string,
  refreshToken: string,
  id: string
): Promise<void> {
  const gmail = getGmailClient(accessToken, refreshToken);
  await gmail.users.messages.trash({ userId: "me", id });
}

// ── Bulk Emails Trash Karo ────────────────────────────────────
export async function trashEmailBatch(
  accessToken: string,
  refreshToken: string,
  ids: string[]
): Promise<TrashResult> {
  let trashed = 0;
  let failed = 0;

  // Parallel trash karo
  await Promise.all(
    ids.map(async (id) => {
      try {
        await trashEmail(accessToken, refreshToken, id);
        trashed++;
      } catch {
        failed++;
      }
    })
  );

  return { trashed, failed };
}

// ── Email Archive Karo ────────────────────────────────────────
export async function archiveEmail(
  accessToken: string,
  refreshToken: string,
  id: string
): Promise<void> {
  const gmail = getGmailClient(accessToken, refreshToken);
  await gmail.users.messages.modify({
    userId: "me",
    id,
    requestBody: { removeLabelIds: ["INBOX"] },
  });
}
