"use client";

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
  User,
} from "lucide-react";

const items = [
  {
    title: "Chat",
    description: "Open the assistant and start a conversation.",
    href: "/app/chat",
    icon: MessageSquare,
    accent: "from-cyan-500 to-sky-500",
  },
  {
    title: "Knowledge Base",
    description: "Upload and manage your documents.",
    href: "/app/knowledge_base",
    icon: FileUp,
    accent: "from-sky-500 to-blue-500",
  },
  {
    title: "Profile",
    description: "Update your personal information.",
    href: "/app/profile",
    icon: User,
    accent: "from-emerald-500 to-teal-500",
  },
  {
    title: "Settings",
    description: "Adjust your account and app preferences.",
    href: "/app/settings",
    icon: Settings,
    accent: "from-indigo-500 to-violet-500",
  },
  {
    title: "Admin",
    description: "Administrative tools and oversight.",
    href: "/app/admin",
    icon: Shield,
    accent: "from-amber-500 to-orange-500",
  },
];

export default function AppHomePage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    router.push("/");
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#09090b_0%,_#111827_48%,_#020617_100%)] px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
            Ready to start RAGing?
          </span>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 backdrop-blur-md transition hover:bg-red-500/20 hover:text-red-100"
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
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Welcome to your workspace
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Choose what you want to do next: chat with the assistant, upload documents, or manage your account.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`} />
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <Icon className="h-6 w-6 text-white" />
                </div>

                <h2 className="text-xl font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>

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