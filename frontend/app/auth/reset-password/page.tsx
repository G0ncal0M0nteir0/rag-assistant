"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"form" | "loading" | "success" | "error">("form");
  const [message, setMessage] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const t = searchParams.get("token");
    if (!t) {
      setStatus("error");
      setMessage("Missing reset token.");
      return;
    }
    setToken(t);
  }, [searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setStatus("error");
      setMessage("Password must contain at least one uppercase letter.");
      return;
    }

    if (!/\d/.test(newPassword)) {
      setStatus("error");
      setMessage("Password must contain at least one number.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

    try {
      const res = await fetch(`${apiBase}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setMessage(data?.detail ?? "Reset failed.");
        return;
      }

      setStatus("success");
      setMessage(data?.message ?? "Password reset successful.");
    } catch {
      setStatus("error");
      setMessage("Network error while resetting password.");
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
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#09090b_0%,_#111827_48%,_#020617_100%)] px-4 py-10 text-white flex items-center justify-center">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative w-full max-w-md"
      >
        <div className="absolute -top-14 -right-10 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" />

        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          <div className="mb-8 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Password reset
            </span>
          </div>

          {status === "form" && (
            <>
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/30">
                  <Lock className="h-7 w-7" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">Reset your password</h1>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Enter a new secure password for your account.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <motion.div variants={itemVariants}>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-4 pr-12 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-4 pr-12 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </motion.div>

                <motion.button
                  variants={itemVariants}
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:from-cyan-400 hover:to-sky-400"
                >
                  Reset password
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-cyan-300 hover:text-cyan-200">
                  Back to login
                </Link>
              </div>
            </>
          )}

          {status === "loading" && (
            <>
              <div className="mb-8 flex justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-cyan-400" />
              </div>
              <h1 className="text-center text-3xl font-semibold tracking-tight">
                Resetting your password
              </h1>
              <p className="mt-3 text-center text-sm leading-6 text-slate-400">
                Please wait while we update your credentials.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mb-8 flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-emerald-400" />
              </div>
              <h1 className="text-center text-3xl font-semibold tracking-tight">
                Password reset successful
              </h1>
              <p className="mt-3 text-center text-sm leading-6 text-slate-300">
                {message}
              </p>
              <p className="mt-4 text-center text-sm text-slate-400">
                You can close this page now.
              </p>

              <div className="mt-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/login")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:from-cyan-400 hover:to-sky-400"
                >
                  Go to login
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mb-8 flex justify-center">
                <AlertCircle className="h-16 w-16 text-red-400" />
              </div>
              <h1 className="text-center text-3xl font-semibold tracking-tight">
                Reset failed
              </h1>
              <p className="mt-3 text-center text-sm leading-6 text-slate-300">
                {message}
              </p>

              <div className="mt-8 space-y-3">
                <Link
                  href="/forgot-password"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:from-cyan-400 hover:to-sky-400"
                >
                  Request new reset link
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </main>
  );
}