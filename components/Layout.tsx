"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { href: "/dashboard",   icon: "📊", label: "Dashboard"    },
  { href: "/large-files", icon: "📦", label: "Large Files"  },
  { href: "/old-emails",  icon: "📅", label: "Old Emails"   },
  { href: "/cleanup",     icon: "🧹", label: "Cleanup Plan" },
  { href: "/agent",       icon: "🤖", label: "AI Agent"     },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3
                         flex items-center gap-3 sticky top-0 z-50">
        <span className="text-xl">📧</span>
        <div className="flex-1">
          <div className="font-semibold text-sm text-white">Gmail Space Agent</div>
          <div className="text-xs text-gray-500">Powered by Gemini AI</div>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            {user.picture && (
              <img src={user.picture} alt="" className="w-7 h-7 rounded-full" />
            )}
            <span className="text-xs text-gray-400 hidden sm:block">
              {user.email}
            </span>
            <button
              onClick={logout}
              className="text-xs text-gray-500 hover:text-red-400
                         transition-colors border border-gray-700
                         hover:border-red-800 px-2 py-1 rounded"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-48 bg-gray-900 border-r border-gray-800
                          hidden sm:flex flex-col gap-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg
                         text-sm transition-colors
                         ${pathname === item.href
                           ? "bg-emerald-900/40 text-emerald-400 border border-emerald-800/50"
                           : "text-gray-400 hover:bg-gray-800 hover:text-white"
                         }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </aside>

        {/* Mobile bottom nav */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-gray-900
                        border-t border-gray-800 flex justify-around py-2 z-50">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1
                         text-xs transition-colors
                         ${pathname === item.href
                           ? "text-emerald-400"
                           : "text-gray-500"
                         }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          ))}
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 pb-20 sm:pb-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}