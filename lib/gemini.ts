import {
  GoogleGenerativeAI,
  Tool,
  FunctionDeclaration,
  SchemaType,
} from "@google/generative-ai";
import {
  searchEmails,
  trashEmail,
  trashEmailBatch,
  archiveEmail,
} from "./gmail";

export interface ChatMessage {
  role: "user" | "model";
  parts: [{ text: string }];
}

// ── Gemini Client ─────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── Gmail Tools Define Karo ───────────────────────────────────
const gmailFunctions: FunctionDeclaration[] = [
  {
    name: "search_emails",
    description:
      "Gmail mein emails search karo. Subject, sender, size ke saath list return karta hai.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description:
            "Gmail search query. Examples: 'has:attachment larger:5m', 'before:2023/01/01', 'category:promotions older_than:6m'",
        },
        maxResults: {
          type: SchemaType.NUMBER,
          description: "Kitne emails chahiye. Default 15, max 50.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "count_emails",
    description: "Kisi query ke matching emails ka total count batao.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: "Gmail search query jiska count chahiye.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "trash_email",
    description: "Ek email ko trash mein daalo.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: {
          type: SchemaType.STRING,
          description: "Gmail message ID jo trash karna hai.",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "trash_emails_batch",
    description:
      "Multiple emails ek saath trash karo. Bulk cleanup ke liye use karo.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        ids: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Gmail message IDs ki array jo trash karni hain.",
        },
      },
      required: ["ids"],
    },
  },
  {
    name: "archive_email",
    description:
      "Email ko archive karo — inbox se remove ho jaayega par delete nahi hoga.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: {
          type: SchemaType.STRING,
          description: "Gmail message ID jo archive karni hai.",
        },
      },
      required: ["id"],
    },
  },
];

const TOOLS: Tool[] = [{ functionDeclarations: gmailFunctions }];

// ── Tool Execute Karo ─────────────────────────────────────────
async function executeTool(
  name: string,
  args: Record<string, unknown>,
  accessToken: string,
  refreshToken: string
): Promise<string> {
  try {
    switch (name) {
      case "search_emails": {
        const result = await searchEmails(
          accessToken,
          refreshToken,
          args.query as string,
          (args.maxResults as number) || 15
        );
        return JSON.stringify(result);
      }

      case "count_emails": {
        const result = await searchEmails(
          accessToken,
          refreshToken,
          args.query as string,
          1 // sirf count chahiye
        );
        return JSON.stringify({ query: args.query, count: result.total });
      }

      case "trash_email": {
        await trashEmail(accessToken, refreshToken, args.id as string);
        return JSON.stringify({ success: true, id: args.id });
      }

      case "trash_emails_batch": {
        const result = await trashEmailBatch(
          accessToken,
          refreshToken,
          args.ids as string[]
        );
        return JSON.stringify(result);
      }

      case "archive_email": {
        await archiveEmail(accessToken, refreshToken, args.id as string);
        return JSON.stringify({ success: true, id: args.id });
      }

      default:
        return JSON.stringify({ error: "Unknown tool: " + name });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Tool execution failed";
    return JSON.stringify({ error: message });
  }
}

// ── Main Agent Function ───────────────────────────────────────
export async function runAgent(
  history: ChatMessage[],
  userMessage: string,
  accessToken: string,
  refreshToken: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    tools: TOOLS,
    systemInstruction: `Tu ek smart Gmail storage manager hai.
Tera kaam user ki Gmail clean karna aur storage bachana hai.

Tu yeh kar sakta hai:
- Emails search aur count karna
- Bade attachment wale emails dhundna
- Purane emails dhundna
- Emails trash ya archive karna
- Storage usage batana

Rules:
- Pehle search/count karo, phir action lo
- Bulk actions mein trash_emails_batch use karo (zyada fast hai)
- Kaam karne ke baad confirm karo kitne emails affect hue
- User jo language use kare (Hindi/Hinglish/English) usi mein jawab do
- Short aur clear responses do
- Agar kuch samajh na aaye to poochho`,
  });

  // Chat history ke saath conversation shuru karo
  const chat = model.startChat({
    history,
  });

  // User message bhejo
  let response = await chat.sendMessage(userMessage);

  // ── Agentic Loop ──────────────────────────────────────────
  // Gemini jab tak tools use karta rahe, chalate raho
  while (true) {
    const candidate = response.response.candidates?.[0];
    if (!candidate) break;

    // Tool calls nikalo
    const functionCalls = response.response.functionCalls();

    // Koi tool call nahi → final answer mil gaya
    if (!functionCalls || functionCalls.length === 0) break;

    // Saare tools execute karo (parallel)
    const toolResults = await Promise.all(
      functionCalls.map(async (call) => ({
        functionResponse: {
          name: call.name,
          response: {
            result: await executeTool(
              call.name,
              call.args as Record<string, unknown>,
              accessToken,
              refreshToken
            ),
          },
        },
      }))
    );

    // Results wapas Gemini ko bhejo
    response = await chat.sendMessage(toolResults);
  }

  // Final text response return karo
  return response.response.text() || "Kuch problem aayi, dobara try karein.";
}
