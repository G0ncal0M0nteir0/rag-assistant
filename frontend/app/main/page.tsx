"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  FileUp,
  LogOut,
  MessageSquare,
  Settings,
  Shield,
  Sparkles,
  User,
} from "lucide-react";

const items = [
  {
    title: "Chat",
    description: "Open the assistant and start a conversation.",
    href: "/main/chat",
    icon: MessageSquare,
    accent: "from-cyan-500 to-sky-500",
  },
  {
    title: "Knowledge Base",
    description: "Upload and manage your documents.",
    href: "/main/knowledge_base",
    icon: FileUp,
    accent: "from-amber-400 to-yellow-400",
  },
  {
    title: "Profile",
    description: "Update your personal information.",
    href: "/main/profile",
    icon: User,
    accent: "from-emerald-500 to-teal-500",
  },
  {
    title: "Settings",
    description: "Adjust your account and app preferences.",
    href: "/main/settings",
    icon: Settings,
    accent: "from-violet-500 to-purple-600",
  },
  {
    title: "Admin",
    description: "Administrative tools and oversight.",
    href: "/admin",
    icon: Shield,
    accent: "from-amber-500 to-orange-500",
  },
];

export default function AppHomePage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem("access_token");
      const tokenType = localStorage.getItem("token_type") ?? "bearer";

      if (!token) {
        setIsAdmin(false);
        return;
      }

      try {
        const response = await fetch(`${apiBase}/auth/me`, {
          headers: {
            Authorization: `${tokenType} ${token}`,
          },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("token_type");
            router.push("/login");
            return;
          }

          setIsAdmin(false);
          return;
        }

        setIsAdmin(Boolean(data?.is_admin));
      } catch {
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [apiBase, router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    router.push("/");
  };

  // Always exclude the Admin card from the grid — admin access is shown
  // as a centered shield icon in the header instead.
  const visibleItems = items.filter((item) => item.title !== "Admin");

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#09090b_0%,_#111827_48%,_#020617_100%)] px-4 py-10 text-slate-900 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4 relative">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-600/20 dark:border-cyan-400/20 bg-cyan-100 dark:bg-cyan-400/10 px-3 py-1 text-xs text-cyan-700 dark:text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Dashboard
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Ready to start RAGing?</h1>
          </div>

          {isAdmin === true && (
            <Link
              href="/admin"
              aria-label="Admin"
              title="Admin"
              className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
            >
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md">
                <Shield className="h-5 w-5" />
              </div>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-200 backdrop-blur-md transition hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-100"
          >
            <LogOut className="h-4 w-4 text-red-400" />
            Logout
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Welcome to your workspace
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Choose what you want to do next: chat with the assistant, upload documents, or manage your account.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="group relative overflow-hidden rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-2xl shadow-slate-200/50 dark:shadow-black/30 backdrop-blur-xl"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`} />
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 dark:bg-white/10">
                  <Icon className="h-6 w-6 text-slate-900 dark:text-white" />
                </div>

                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.description}</p>

                <Link
                  href={item.href}
                  className={`mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r ${item.accent} px-4 py-2.5 font-semibold text-slate-950 transition hover:scale-[1.02]`}
                >
                  Open {item.title}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
}