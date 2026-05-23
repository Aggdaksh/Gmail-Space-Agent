"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { api } from "@/hooks/UseApi";

function StatCard({ icon, label, value, note, color }: any) {
  const colors: any = {
    blue:   "text-blue-400",
    red:    "text-red-400",
    amber:  "text-amber-400",
    purple: "text-purple-400",
    cyan:   "text-cyan-400",
    gray:   "text-gray-400",
  };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-2xl font-bold ${colors[color] || "text-white"}`}>
        {typeof value === "number" ? value.toLocaleString() : (value || "—")}
      </div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
      {note && <div className="text-xs text-gray-600 mt-0.5">{note}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">Storage Dashboard</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Gmail ka complete overview
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm
                       px-4 py-2 rounded-lg transition-colors flex items-center gap-2
                       disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-gray-600 border-t-white
                               rounded-full animate-spin" />
            ) : "🔄"}
            {loading ? "Scanning..." : "Rescan"}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800/50 text-red-400
                          text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
        )}

        {loading && !stats ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
            <span className="w-5 h-5 border-2 border-gray-600 border-t-emerald-400
                             rounded-full animate-spin" />
            Gmail scan chal rahi hai...
          </div>
        ) : stats ? (
          <>
            {/* User card */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl
                            p-4 mb-4 flex items-center gap-3">
              {stats.picture && (
                <img src={stats.picture} alt=""
                     className="w-10 h-10 rounded-full" />
              )}
              <div>
                <div className="font-medium text-white">{stats.name}</div>
                <div className="text-sm text-gray-400">{stats.email}</div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              <StatCard icon="📧" label="Total Emails"       value={stats.totalEmails}      color="blue"   />
              <StatCard icon="📎" label="Large Attachments"  value={stats.largeAttachments} note=">5MB"    color="red"    />
              <StatCard icon="📅" label="Old Emails"         value={stats.oldEmails}        note="Pre 2023" color="amber"  />
              <StatCard icon="📢" label="Promotions"         value={stats.promotions}       color="purple" />
              <StatCard icon="🔔" label="Social Notifs"      value={stats.socialNotifs}     color="cyan"   />
              <StatCard icon="🗑️"  label="Spam"               value={stats.spamCount}        color="gray"   />
            </div>

            {/* Quick actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="font-medium text-gray-300 mb-3">Quick Actions</h2>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => router.push("/large-files")}
                  className="bg-red-900/30 text-red-400 border border-red-800/50
                             hover:bg-red-900/50 px-4 py-2 rounded-lg text-sm transition-colors">
                  📦 Large Files →
                </button>
                <button onClick={() => router.push("/old-emails")}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300
                             px-4 py-2 rounded-lg text-sm transition-colors">
                  📅 Old Emails →
                </button>
                <button onClick={() => router.push("/cleanup")}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300
                             px-4 py-2 rounded-lg text-sm transition-colors">
                  🧹 Cleanup Plan →
                </button>
                <button onClick={() => router.push("/agent")}
                  className="bg-emerald-900/40 text-emerald-400 border border-emerald-800/50
                             hover:bg-emerald-900/60 px-4 py-2 rounded-lg text-sm transition-colors">
                  🤖 AI Agent →
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
}