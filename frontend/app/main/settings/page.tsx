"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
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
  securityAlerts: boolean;
  autoIndexDocuments: boolean;
  citationsEnabled: boolean;
  autoSaveChats: boolean;
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
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-black/20 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-slate-200 dark:bg-white/10 p-2">
          <Icon className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
          enabled ? "bg-cyan-500" : "bg-slate-400 dark:bg-slate-600"
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
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const { theme, toggle: toggleTheme } = useTheme();

  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    securityAlerts: true,
    autoIndexDocuments: true,
    citationsEnabled: true,
    autoSaveChats: true,
    model: "llama-3.1-8b-instant",
    temperature: "0.3",
    topK: "5",
    chunkSize: "800",
  });

  const authHeaders = () => {
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") ?? "bearer";
    return token ? { Authorization: `${tokenType} ${token}` } : null;
  };

  // Load user settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      const headers = authHeaders();
      if (!headers) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(`${apiBase}/auth/me`, {
          headers,
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("token_type");
            router.push("/login");
          }
          return;
        }

        const userData = await response.json();
        setSettings((prev) => ({
          ...prev,
          securityAlerts: userData.security_alerts_enabled ?? true,
          model: userData.model ?? "llama-3.1-8b-instant",
          temperature: userData.temperature?.toString() ?? "0.3",
          topK: userData.top_k?.toString() ?? "5",
          chunkSize: userData.chunk_size?.toString() ?? "800",
        }));
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };

    loadSettings();
  }, [apiBase, router]);

  const handleSave = async () => {
    const headers = authHeaders();
    if (!headers) {
      router.push("/login");
      return;
    }

    setSavedMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`${apiBase}/auth/me`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          security_alerts_enabled: settings.securityAlerts,
          model: settings.model,
          temperature: parseFloat(settings.temperature),
          top_k: parseInt(settings.topK),
          chunk_size: parseInt(settings.chunkSize),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token_type");
          router.push("/login");
          return;
        }
        throw new Error(data?.detail ?? "Unable to save settings");
      }

      setSavedMessage("Settings saved successfully!");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save settings"
      );
    }
  };

  const handleSecurityAlertsToggle = async (value: boolean) => {
    const headers = authHeaders();
    if (!headers) {
      router.push("/login");
      return;
    }

    const previousValue = settings.securityAlerts;
    setSettings((prev) => ({ ...prev, securityAlerts: value }));
    setSavedMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`${apiBase}/auth/me`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          security_alerts_enabled: value,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token_type");
          router.push("/login");
          return;
        }
        throw new Error(data?.detail ?? "Unable to update security alerts setting");
      }

      setSavedMessage(
        value
          ? "Security alerts enabled. You will receive alerts for password/email changes."
          : "Security alerts disabled. You will no longer receive those alerts."
      );
    } catch (error) {
      setSettings((prev) => ({ ...prev, securityAlerts: previousValue }));
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update security alerts setting"
      );
    }
  };

  const handleClearChats = async () => {
    const confirmed = window.confirm("Clear your entire chat history? This cannot be undone.");
    if (!confirmed) return;

    const headers = authHeaders();
    if (!headers) {
      router.push("/login");
      return;
    }

    setIsClearing(true);
    setSavedMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`${apiBase}/chat/history`, {
        method: "DELETE",
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token_type");
          router.push("/login");
          return;
        }
        throw new Error(data?.detail ?? "Unable to clear chat history");
      }

      setSavedMessage("Chat history cleared successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to clear chat history"
      );
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This will permanently delete your account, all documents, chat history, and cannot be undone."
    );
    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      "This is your last chance. Are you absolutely sure?"
    );
    if (!doubleConfirmed) return;

    const headers = authHeaders();
    if (!headers) {
      router.push("/login");
      return;
    }

    setIsDeleting(true);
    setSavedMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`${apiBase}/auth/me`, {
        method: "DELETE",
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token_type");
          router.push("/login");
          return;
        }
        throw new Error(data?.detail ?? "Unable to delete account");
      }

      localStorage.removeItem("access_token");
      localStorage.removeItem("token_type");
      router.push("/");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete account"
      );
    } finally {
      setIsDeleting(false);
    }
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
    <main className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#09090b_0%,_#111827_48%,_#020617_100%)] px-4 py-10 text-slate-900 dark:text-white">
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
            className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/40 backdrop-blur-xl"
          >
            <div className="mb-8 flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-600/20 dark:border-cyan-400/20 bg-cyan-100 dark:bg-cyan-400/10 px-3 py-1 text-xs text-cyan-700 dark:text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Settings
              </span>

              <Link
                href="/main"
                className="text-sm text-cyan-600 dark:text-cyan-300 transition hover:text-cyan-700 dark:hover:text-cyan-200"
              >
                Back to workspace
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Account settings</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Adjust your preferences for chat, documents, privacy, and notifications.
              </p>
            </div>

            {savedMessage && (
              <motion.div
                variants={itemVariants}
                className="mb-6 rounded-2xl border border-emerald-600/20 dark:border-emerald-500/20 bg-emerald-100 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100"
              >
                {savedMessage}
              </motion.div>
            )}

            {errorMessage && (
              <motion.div
                variants={itemVariants}
                className="mb-6 rounded-2xl border border-red-600/20 dark:border-red-500/20 bg-red-100 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-100"
              >
                {errorMessage}
              </motion.div>
            )}

            <div className="space-y-8">
              <motion.section variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">General</h2>
                </div>

                <div className="grid gap-4">
                  <ToggleRow
                    title="Dark mode"
                    description="Use dark theme for the interface."
                    enabled={theme === "dark"}
                    onChange={() => toggleTheme()}
                    icon={Moon}
                  />
                  <ToggleRow
                    title="Security alerts"
                    description="Get notified when someone logs in or changes your account."
                    enabled={settings.securityAlerts}
                    onChange={handleSecurityAlertsToggle}
                    icon={Shield}
                  />
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Chat behavior</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-black/20 p-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Preferred model
                    </label>
                    <select
                      value={settings.model}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, model: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-slate-900 dark:text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                    >
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                      <option value="llama-3.1-70b-versatile">llama-3.1-70b-versatile</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                    </select>
                  </div>

                  {/* Response tone removed: not implemented in backend */}

                  <div className="rounded-2xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-black/20 p-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Temperature
                    </label>
                    <input
                      type="number"
                      value={settings.temperature}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, temperature: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-slate-900 dark:text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-black/20 p-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Top K
                    </label>
                    <input
                      type="number"
                      value={settings.topK}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, topK: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-slate-900 dark:text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-black/20 p-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Chunk size
                    </label>
                    <input
                      type="number"
                      value={settings.chunkSize}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, chunkSize: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-slate-900 dark:text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Data & Privacy</h2>
                </div>

                <div className="grid gap-4">
                  <button
                    type="button"
                    onClick={handleClearChats}
                    disabled={isClearing}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-black/20 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white transition hover:bg-slate-200 dark:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isClearing ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Clearing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Clear chat history
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-2 rounded-2xl border border-red-600/20 dark:border-red-500/20 bg-red-100 dark:bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-100 transition hover:bg-red-200 dark:hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete account
                      </>
                    )}
                  </button>
                </div>
              </motion.section>

              <motion.div variants={itemVariants} className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white dark:text-slate-950 transition hover:scale-[1.02]"
                >
                  <Save className="h-4 w-4" />
                  Save settings
                </button>

                <Link href="/main" className="text-sm text-cyan-600 dark:text-cyan-300 transition hover:text-cyan-700 dark:hover:text-cyan-200">
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