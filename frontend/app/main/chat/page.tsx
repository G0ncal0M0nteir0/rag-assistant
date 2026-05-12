"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Zap,
  Database,
} from "lucide-react";

type ChatMessage = {
  id: string;
  question: string;
  answer: string;
  created_at: string;
};

type UsageData = {
  total_tokens_used: number;
  total_requests: number;
  groq_limits: Record<string, unknown>;
};

type QuotaWindow = {
  window: string;
  limit_requests: number;
  limit_tokens: number;
  used_requests: number;
  used_tokens: number;
  remaining_requests_global: number;
  remaining_tokens_global: number;
  registered_users: number;
  active_users: number;
  per_user_requests_allocated: number;
  per_user_tokens_allocated: number;
  user_used_requests: number;
  user_used_tokens: number;
  user_available_requests: number;
  user_available_tokens: number;
};

type QuotaData = {
  model: string;
  minute: QuotaWindow;
  day: QuotaWindow;
};

type ChatResponse = {
  answer: string;
  sources: string[];
  tokens_used: number;
};

type ChatHistoryResponse = {
  messages: ChatMessage[];
  total: number;
};

export default function MainChatPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [loadingQuota, setLoadingQuota] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") ?? "bearer";

    return token ? { Authorization: `${tokenType} ${token}` } : null;
  };

  const loadUsage = async () => {
    const headers = authHeaders();

    if (!headers) {
      router.push("/login");
      return;
    }

    setLoadingUsage(true);

    try {
      const response = await fetch(`${apiBase}/chat/usage`, { headers });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token_type");
          router.push("/login");
          return;
        }

        throw new Error(data?.detail ?? "Unable to load usage");
      }

      setUsage(data);
    } catch (usageError) {
      setError(
        usageError instanceof Error ? usageError.message : "Unable to load usage"
      );
    } finally {
      setLoadingUsage(false);
    }
  };

  const loadQuota = async () => {
    const headers = authHeaders();

    if (!headers) {
      router.push("/login");
      return;
    }

    setLoadingQuota(true);

    try {
      const response = await fetch(`${apiBase}/chat/quota`, { headers });
      const data = (await response.json().catch(() => null)) as QuotaData | null;

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token_type");
          router.push("/login");
          return;
        }

        throw new Error(data?.model ? "Unable to load quota" : "Unable to load quota");
      }

      setQuota(data);
    } catch (quotaError) {
      setError(quotaError instanceof Error ? quotaError.message : "Unable to load quota");
    } finally {
      setLoadingQuota(false);
    }
  };

  const loadHistory = async () => {
    const headers = authHeaders();

    if (!headers) {
      router.push("/login");
      return;
    }

    setLoadingHistory(true);

    try {
      const response = await fetch(`${apiBase}/chat/history`, { headers });
      const data = (await response.json().catch(() => null)) as ChatHistoryResponse | null;

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token_type");
          router.push("/login");
          return;
        }

        throw new Error(data?.detail ?? "Unable to load history");
      }

      const reversed = [...(data?.messages ?? [])].reverse();
      setHistory(reversed);
      setMessages(reversed);
    } catch (historyError) {
      setError(
        historyError instanceof Error ? historyError.message : "Unable to load history"
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadUsage();
    loadQuota();
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError("Type a question first.");
      return;
    }

    const headers = authHeaders();
    if (!headers) {
      router.push("/login");
      return;
    }

    setSubmitting(true);

    const optimisticUserMessage: ChatMessage = {
      id: `pending-${Date.now()}`,
      question: trimmedQuestion,
      answer: "",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setQuestion("");

    try {
      const response = await fetch(`${apiBase}/chat/ask`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmedQuestion }),
      });

      const data = (await response.json().catch(() => null)) as ChatResponse | null;

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token_type");
          router.push("/login");
          return;
        }

        throw new Error(data?.answer ?? data?.detail ?? "Unable to send message");
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        question: trimmedQuestion,
        answer: data?.answer ?? "",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => {
        const withoutPending = prev.filter((entry) => entry.id !== optimisticUserMessage.id);
        return [...withoutPending, assistantMessage];
      });

      setHistory((prev) => [...prev, assistantMessage]);
      setMessage(`Used ${data?.tokens_used ?? 0} tokens.`);

      await Promise.all([loadUsage(), loadQuota(), loadHistory()]);
    } catch (askError) {
      setMessages((prev) => prev.filter((entry) => entry.id !== optimisticUserMessage.id));
      setError(askError instanceof Error ? askError.message : "Unable to send message");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearHistory = async () => {
    const confirmed = window.confirm("Clear your chat history? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    const headers = authHeaders();
    if (!headers) {
      router.push("/login");
      return;
    }

    setClearing(true);
    setError("");
    setMessage("");

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

        throw new Error(data?.detail ?? "Unable to clear history");
      }

      setMessages([]);
      setHistory([]);
      setMessage(data?.message ?? "Chat history cleared.");
      await Promise.all([loadUsage(), loadQuota()]);
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Unable to clear history");
    } finally {
      setClearing(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  const totalHistory = useMemo(() => history.length, [history]);

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#09090b_0%,_#111827_48%,_#020617_100%)] px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="relative">
          <div className="absolute -top-14 -right-10 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" />

          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Chat
                </span>
                <span className="text-xs text-slate-500">
                  {loadingUsage ? "Loading usage..." : `${usage?.total_requests ?? 0} requests`}
                </span>
              </div>

              <Link href="/main" className="inline-flex items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-200">
                <ArrowLeft className="h-4 w-4" />
                Back to workspace
              </Link>
            </div>

            <div className="mb-8 max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-tight">Chat with your knowledge base</h1>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Ask questions, review usage, inspect recent chat history, and clear old messages when needed.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <motion.section variants={itemVariants} className="rounded-3xl border border-white/10 bg-black/20 p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-cyan-300" />
                    <h2 className="text-xl font-semibold">Conversation</h2>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearHistory}
                    disabled={clearing || loadingHistory}
                    className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Clear History
                  </button>
                </div>

                {error && (
                  <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                      <p>{error}</p>
                    </div>
                  </div>
                )}

                {message && (
                  <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      <p>{message}</p>
                    </div>
                  </div>
                )}

                <div className="mb-5 flex flex-wrap gap-3 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    <Zap className="h-4 w-4 text-cyan-300" />
                    {loadingUsage ? "Usage loading..." : `${usage?.total_tokens_used ?? 0} tokens used`}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    <Clock3 className="h-4 w-4 text-cyan-300" />
                    {loadingHistory ? "History loading..." : `${totalHistory} messages`}
                  </span>
                </div>

                <div className="mb-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Per-user requests</div>
                    <div className="mt-2 text-2xl font-semibold text-white">
                      {loadingQuota ? (
                        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                      ) : (
                        quota?.day.user_available_requests ?? 0
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Remaining for you in the current day window.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Per-user tokens</div>
                    <div className="mt-2 text-2xl font-semibold text-white">
                      {loadingQuota ? (
                        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                      ) : (
                        quota?.day.user_available_tokens ?? 0
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Remaining for you in the current day window.
                    </p>
                  </div>
                </div>

                <div className="mb-5 max-h-[30rem] space-y-4 overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-4">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center py-16 text-center text-sm text-slate-400">
                      <div>
                        <Sparkles className="mx-auto h-10 w-10 text-cyan-300" />
                        <p className="mt-4">No messages yet. Ask something to get started.</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((item) => (
                      <div key={item.id} className="space-y-3 rounded-3xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-full bg-cyan-400/10 p-2 text-cyan-300">
                            <MessageSquare className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">You</div>
                            <p className="mt-1 text-sm leading-6 text-white">{item.question}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-full bg-emerald-400/10 p-2 text-emerald-300">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Assistant</div>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                              {item.answer || "Processing..."}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={handleAsk} className="space-y-4">
                  <textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Ask anything about your uploaded documents..."
                    rows={4}
                    className="w-full rounded-3xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                  />

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                      Each question is sent to <span className="text-slate-300">/chat/ask</span>. This page shows your saved history and usage stats.
                    </p>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:from-cyan-400 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Ask
                    </button>
                  </div>
                </form>
              </motion.section>

              <div className="space-y-6">
                <motion.section variants={itemVariants} className="rounded-3xl border border-white/10 bg-black/20 p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <Database className="h-5 w-5 text-cyan-300" />
                    <h2 className="text-xl font-semibold">Usage</h2>
                  </div>

                  {loadingUsage || loadingQuota ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm text-slate-300">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-slate-500">Your daily allocation</div>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                          <div>
                            <div className="text-xs text-slate-500">Requests left</div>
                            <div className="text-xl font-semibold text-white">{quota?.day.user_available_requests ?? 0}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Tokens left</div>
                            <div className="text-xl font-semibold text-white">{quota?.day.user_available_tokens ?? 0}</div>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-slate-500">Global usage this day</div>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                          <div>
                            <div className="text-xs text-slate-500">Requests used</div>
                            <div className="text-xl font-semibold text-white">{quota?.day.used_requests ?? 0}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Tokens used</div>
                            <div className="text-xl font-semibold text-white">{quota?.day.used_tokens ?? 0}</div>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-slate-400">
                        <div className="mb-2 text-sm font-medium text-slate-200">Model limits</div>
                        <pre className="overflow-auto whitespace-pre-wrap break-words text-[11px] text-slate-400">
                          {JSON.stringify(usage?.groq_limits ?? {}, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </motion.section>

                <motion.section variants={itemVariants} className="rounded-3xl border border-white/10 bg-black/20 p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-cyan-300" />
                    <h2 className="text-xl font-semibold">History</h2>
                  </div>

                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                    </div>
                  ) : history.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-400">
                      No chat history yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.slice(-5).reverse().map((item) => (
                        <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-sm font-medium text-white">{item.question}</p>
                          <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">
                            {item.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.section>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}