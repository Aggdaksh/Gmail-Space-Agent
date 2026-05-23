import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "../../../../lib/middleware";
import { runAgent, ChatMessage } from "../../../../lib/gemini";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { message, history = [] } = body as {
    message: string;
    history: ChatMessage[];
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  try {
    const reply = await runAgent(
      history,
      message,
      user.accessToken,
      user.refreshToken
    );

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent failed";
    console.error("Agent error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
