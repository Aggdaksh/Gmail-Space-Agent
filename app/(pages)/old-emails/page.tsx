"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import EmailRow from "@/components/EmailRow";
import { api } from "@/hooks/UseApi";

export default function OldEmails() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set<string>());
  const [msg, setMsg] = useState("");

  const fetch_ = async () => {
    setLoading(true);
    setMsg("");
    try {
      const [old, promos] = await Promise.all([
        api.searchEmails("before:2022/01/01", 10),
        api.searchEmails("category:promotions older_than:1y", 10),
      ]);
      // Combine + deduplicate
      const all = [...old.emails, ...promos.emails];
      const seen = new Set<string>();
      setEmails(all.filter((e) => seen.has(e.id) ? false : seen.add(e.id) || true));
      setSelected(new Set());
    } catch (e: any) { setMsg("❌ " + e.message); }
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const toggle = (id: string) => {
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const trashSelected = async () => {
    setLoading(true);
    try {
      const { trashed, failed } = await api.trashEmails(Array.from(selected));
      setMsg(`✅ ${trashed} emails trashed!${failed ? ` ${failed} failed.` : ""}`);
      setEmails((p) => p.filter((e) => !selected.has(e.id)));
      setSelected(new Set());
    } catch (e: any) { setMsg("❌ " + e.message); }
    setLoading(false);
  };

  const trashOne = async (id: string) => {
    try {
      await api.trashEmails([id]);
      setEmails((p) => p.filter((e) => e.id !== id));
    } catch (e: any) { setMsg("❌ " + e.message); }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold">📅 Purane Emails</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              2022 se purane + 1 saal se zyada purani promotions
            </p>
          </div>
          <div className="flex gap-2">
            {selected.size > 0 && (
              <button onClick={trashSelected} disabled={loading}
                className="bg-red-900/40 text-red-400 border border-red-800/50
                           hover:bg-red-900/60 px-4 py-2 rounded-lg text-sm">
                🗑️ Trash {selected.size}
              </button>
            )}
            <button onClick={fetch_} disabled={loading}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300
                         px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              {loading
                ? <span className="w-4 h-4 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                : "🔍"}
              {emails.length ? "Refresh" : "Scan"}
            </button>
          </div>
        </div>

        {msg && (
          <div className={`text-sm rounded-lg px-4 py-3 mb-4 border
            ${msg.startsWith("✅")
              ? "bg-emerald-900/30 border-emerald-800/50 text-emerald-400"
              : "bg-red-900/30 border-red-800/50 text-red-400"}`}>
            {msg}
          </div>
        )}

        {loading && !emails.length ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
            <span className="w-5 h-5 border-2 border-gray-600 border-t-emerald-400 rounded-full animate-spin" />
            Dhundh raha hoon...
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-4xl mb-3">📅</div>
            <p>Scan karo purane emails dekhne ke liye</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between text-xs text-gray-500 mb-3">
              <span>{emails.length} emails mile</span>
              <button onClick={() =>
                setSelected(selected.size === emails.length
                  ? new Set()
                  : new Set(emails.map((e) => e.id)))}
                className="hover:text-gray-300 transition-colors">
                {selected.size === emails.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="space-y-1.5">
              {emails.map((e) => (
                <EmailRow key={e.id} email={e}
                  selected={selected.has(e.id)}
                  onToggle={() => toggle(e.id)}
                  onTrash={trashOne} />
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}