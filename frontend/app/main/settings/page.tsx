"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bell,
  Bot,
  Database,
  Download,
  Lock,
  Moon,
  Palette,
  Save,
  Shield,
  Sparkles,
  Trash2,
  User,
  Zap,
} from "lucide-react";

type SettingsState = {
  emailNotifications: boolean;
  securityAlerts: boolean;
  weeklyDigest: boolean;
  darkMode: boolean;
  autoIndexDocuments: boolean;
  citationsEnabled: boolean;
  autoSaveChats: boolean;
  responseTone: string;
  model: string;
  temperature: string;
  topK: string;
  chunkSize: string;
};

function ToggleRow({
  title,
  description,
  enabled,
  onChange,
  icon: Icon,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-white/10 p-2">
          <Icon className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
          enabled ? "bg-cyan-500" : "bg-slate-600"
        }`}
        aria-pressed={enabled}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [savedMessage, setSavedMessage] = useState("");
  const [settings, setSettings] = useState<SettingsState>({
    emailNotifications: true,
    securityAlerts: true,
    weeklyDigest: false,
    darkMode: true,
    autoIndexDocuments: true,
    citationsEnabled: true,
    autoSaveChats: true,
    responseTone: "balanced",
    model: "llama-3.1-8b-instant",
    temperature: "0.3",
    topK: "5",
    chunkSize: "800",
  });

  const handleSave = async () => {
    setSavedMessage("Settings saved locally. Wire these controls to your backend when ready.");
  };

  const handleExportData = () => {
    setSavedMessage("Export flow not implemented yet.");
  };

  const handleClearChats = () => {
    setSavedMessage("Clear chat history is not implemented yet.");
  };

  const handleDeleteAccount = () => {
    setSavedMessage("Delete account is not implemented yet.");
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#09090b_0%,_#111827_48%,_#020617_100%)] px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative"
        >
          <div className="absolute -top-14 -right-10 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" />

          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <div className="mb-8 flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Settings
              </span>

              <Link
                href="/main"
                className="text-sm text-cyan-300 transition hover:text-cyan-200"
              >
                Back to workspace
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight">Account settings</h1>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Adjust your preferences for chat, documents, privacy, and notifications.
              </p>
            </div>

            {savedMessage && (
              <motion.div
                variants={itemVariants}
                className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
              >
                {savedMessage}
              </motion.div>
            )}

            <div className="space-y-8">
              <motion.section variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-cyan-300" />
                  <h2 className="text-xl font-semibold">Notifications</h2>
                </div>

                <div className="grid gap-4">
                  <ToggleRow
                    title="Email notifications"
                    description="Receive product and account updates by email."
                    enabled={settings.emailNotifications}
                    onChange={(value) =>
                      setSettings((prev) => ({ ...prev, emailNotifications: value }))
                    }
                    icon={Bell}
                  />
                  <ToggleRow
                    title="Security alerts"
                    description="Get notified when someone logs in or changes your account."
                    enabled={settings.securityAlerts}
                    onChange={(value) =>
                      setSettings((prev) => ({ ...prev, securityAlerts: value }))
                    }
                    icon={Shield}
                  />
                  <ToggleRow
                    title="Weekly digest"
                    description="Receive a summary of activity and document updates once a week."
                    enabled={settings.weeklyDigest}
                    onChange={(value) =>
                      setSettings((prev) => ({ ...prev, weeklyDigest: value }))
                    }
                    icon={Download}
                  />
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-cyan-300" />
                  <h2 className="text-xl font-semibold">Chat behavior</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Preferred model
                    </label>
                    <select
                      value={settings.model}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, model: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                    >
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                      <option value="llama-3.1-70b-versatile">llama-3.1-70b-versatile</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                    </select>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Response tone
                    </label>
                    <select
                      value={settings.responseTone}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, responseTone: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                    >
                      <option value="balanced">Balanced</option>
                      <option value="concise">Concise</option>
                      <option value="detailed">Detailed</option>
                    </select>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Temperature
                    </label>
                    <input
                      type="number"
                      value={settings.temperature}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, temperature: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Top K
                    </label>
                    <input
                      type="number"
                      value={settings.topK}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, topK: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Chunk size
                    </label>
                    <input
                      type="number"
                      value={settings.chunkSize}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, chunkSize: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-cyan-300" />
                  <h2 className="text-xl font-semibold">Data & Privacy</h2>
                </div>

                <div className="grid gap-4">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    <Download className="h-4 w-4" />
                    Export data
                  </button>

                  <button
                    type="button"
                    onClick={handleClearChats}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear chat history
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-100 transition hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete account
                  </button>
                </div>
              </motion.section>

              <motion.div variants={itemVariants} className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                >
                  <Save className="h-4 w-4" />
                  Save settings
                </button>

                <Link href="/main" className="text-sm text-cyan-300 transition hover:text-cyan-200">
                  Back to workspace
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}