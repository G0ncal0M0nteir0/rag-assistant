"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, Sparkles } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.detail ?? "Unable to send reset email");
      }

      setMessage(payload?.message ?? "If that email exists, a reset link has been sent.");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
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
    <main className="min-h-screen overflow-hidden flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#09090b_0%,_#111827_48%,_#020617_100%)] text-white px-4 py-10">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md relative"
      >
        <div className="absolute -top-14 -right-10 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" />

        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Password help
            </div>
          </div>

          <motion.div variants={itemVariants} className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/30">
              <Mail className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Reset your password</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Enter your account email and we’ll send you a secure reset link.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                    if (message) setMessage("");
                  }}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>
            </motion.div>

            {error && (
              <motion.p variants={itemVariants} className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </motion.p>
            )}

            {message && (
              <motion.div variants={itemVariants} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>{message}</p>
                </div>
              </motion.div>
            )}

            <motion.button
              variants={itemVariants}
              type="submit"
              disabled={isSubmitting}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:from-cyan-400 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Sending reset link..." : "Send reset link"}
              {!isSubmitting && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
            </motion.button>
          </form>

          <motion.p variants={itemVariants} className="mt-6 text-center text-xs leading-5 text-slate-500">
            If the email exists, you’ll receive a reset message from the backend email flow.
          </motion.p>
        </motion.div>
      </motion.div>
    </main>
  );
}