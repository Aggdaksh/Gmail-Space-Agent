"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";
import { api } from "@/hooks/UseApi";

const SUGGESTIONS = [
  "Kitne emails hain total?",
  "5MB se bade emails delete karo",
  "Purani promotions trash karo",
  "Storage summary do",
];

export default function Agent() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Namaste! 👋 Main Gmail Space Manager hoon.\n\nMain yeh kar sakta hoon:\n• Emails search aur count karna\n• Bade emails dhundna aur delete karna\n• Purani promotions clean karna\n• Storage usage batana\n\nKya karna chahte hain?",
    },
  ]);
  const [history, setHistory] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  // Cleanup plan se prefill
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setInput(q);
  }, [searchParams]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setMessages((p) => [...p, { role: "user", text }]);
    setLoading(true);

    try {
      const { reply } = await api.chat(text, history);
      setHistory((p) => [
        ...p,
        { role: "user",  parts: [{ text }] },
        { role: "model", parts: [{ text: reply }] },
      ]);
      setMessages((p) => [...p, { role: "assistant", text: reply }]);
    } catch (e: any) {
      setMessages((p) => [...p, { role: "assistant", text: "❌ Error: " + e.message }]);
    }

    setLoading(false);
    setTimeout(() => {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-120px)]">
        <div className="mb-4">
          <h1 className="text-xl font-semibold">🤖 AI Agent</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Natural language mein Gmail manage karo
          </p>
        </div>

        {/* Suggestions */}
        <div className="flex gap-2 flex-wrap mb-3">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => setInput(s)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs
                         px-3 py-1.5 rounded-full transition-colors border border-gray-700">
              {s}
            </button>
          ))}
        </div>

        {/* Chat window */}
        <div ref={chatRef}
          className="flex-1 overflow-y-auto bg-gray-900 border border-gray-800
                     rounded-t-xl p-4 flex flex-col gap-3 min-h-0">
          {messages.map((m, i) => (
            <div key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm
                leading-relaxed whitespace-pre-wrap
                ${m.role === "user"
                  ? "bg-emerald-900/40 text-emerald-100 border border-emerald-800/50 rounded-br-sm"
                  : "bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-sm"
                }`}>
                {m.role === "assistant" && (
                  <span className="mr-1">🤖</span>
                )}
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 rounded-xl
                              rounded-bl-sm px-4 py-3 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i}
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex border border-t-0 border-gray-800 rounded-b-xl overflow-hidden">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder='Koi bhi kaam batao... (e.g. "bade emails delete karo")'
            className="flex-1 bg-gray-900 px-4 py-3 text-sm text-gray-100
                       placeholder-gray-600 outline-none"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-800
                       disabled:text-gray-600 text-white px-5 text-lg
                       transition-colors font-medium">
            →
          </button>
        </div>
      </div>
    </Layout>
  );
}