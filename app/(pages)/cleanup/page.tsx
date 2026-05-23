"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { api } from "@/hooks/UseApi";

const CATEGORIES = [
  { name: "Huge Attachments (>10MB)",     query: "has:attachment larger:10m",           priority: "high"   },
  { name: "Large Attachments (5–10MB)",   query: "has:attachment larger:5m smaller:10m", priority: "high"   },
  { name: "Old Promotions (6mo+)",        query: "category:promotions older_than:6m",    priority: "medium" },
  { name: "Old Social Notifs (1yr+)",     query: "category:social older_than:1y",        priority: "low"    },
  { name: "Spam",                         query: "label:spam",                           priority: "high"   },
];

const PRIORITY_STYLE: any = {
  high:   "border-l-red-500   text-red-400   bg-red-900/10",
  medium: "border-l-amber-500 text-amber-400 bg-amber-900/10",
  low:    "border-l-green-500 text-green-400 bg-green-900/10",
};

export default function CleanupPlan() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [trashing, setTrashing] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  const analyze = async () => {
    setLoading(true);
    setResults([]);
    setMsg("");
    const data = await Promise.all(
      CATEGORIES.map(async (cat) => {
        try {
          const res = await api.searchEmails(cat.query, 1);
          return { ...cat, count: res.total };
        } catch {
          return { ...cat, count: 0 };
        }
      })
    );
    setResults(data.filter((d) => d.count > 0));
    setLoading(false);
  };

  const trashCategory = async (cat: any) => {
    setTrashing(cat.name);
    try {
      const res = await api.searchEmails(cat.query, 50);
      const ids = res.emails.map((e: any) => e.id);
      if (ids.length) {
        const { trashed } = await api.trashEmails(ids);
        setMsg(`✅ "${cat.name}" — ${trashed} emails trashed!`);
        setResults((p) => p.filter((c) => c.name !== cat.name));
      }
    } catch (e: any) { setMsg("❌ " + e.message); }
    setTrashing("");
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold">🧹 Cleanup Plan</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Kitna space bacha sakte hain
            </p>
          </div>
          <button onClick={analyze} disabled={loading}
            className="bg-emerald-900/40 text-emerald-400 border border-emerald-800/50
                       hover:bg-emerald-900/60 px-4 py-2 rounded-lg text-sm
                       flex items-center gap-2 disabled:opacity-50">
            {loading
              ? <span className="w-4 h-4 border-2 border-emerald-800 border-t-emerald-400 rounded-full animate-spin" />
              : "🔬"}
            {loading ? "Analyzing..." : results.length ? "Re-analyze" : "Deep Analysis Karo"}
          </button>
        </div>

        {msg && (
          <div className={`text-sm rounded-lg px-4 py-3 mb-4 border
            ${msg.startsWith("✅")
              ? "bg-emerald-900/30 border-emerald-800/50 text-emerald-400"
              : "bg-red-900/30 border-red-800/50 text-red-400"}`}>
            {msg}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
            <span className="w-5 h-5 border-2 border-gray-600 border-t-emerald-400 rounded-full animate-spin" />
            Gmail analyze ho rahi hai...
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="text-4xl mb-3">🧹</div>
            <p className="text-gray-400 text-sm">
              AI deep analysis karega — sabse zyada space lene wale categories dhundega
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((cat) => (
              <div key={cat.name}
                className={`border border-l-4 rounded-xl p-4
                  flex items-center justify-between gap-3 flex-wrap
                  bg-gray-900 border-gray-800 ${PRIORITY_STYLE[cat.priority]}`}>
                <div>
                  <div className="font-medium text-sm text-white">{cat.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      ~{cat.count.toLocaleString()} emails
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full
                      ${PRIORITY_STYLE[cat.priority]}`}>
                      {cat.priority}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/agent?q=${encodeURIComponent(`"${cat.name}" trash karo`)}`)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300
                               px-3 py-1.5 rounded-lg text-xs transition-colors">
                    🤖 Ask Agent
                  </button>
                  <button
                    onClick={() => trashCategory(cat)}
                    disabled={trashing === cat.name}
                    className="bg-red-900/40 text-red-400 border border-red-800/50
                               hover:bg-red-900/60 px-3 py-1.5 rounded-lg text-xs
                               flex items-center gap-1 disabled:opacity-50">
                    {trashing === cat.name
                      ? <span className="w-3 h-3 border border-red-800 border-t-red-400 rounded-full animate-spin" />
                      : "🗑️"}
                    Trash All
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}