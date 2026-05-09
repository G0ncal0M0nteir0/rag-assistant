"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";

type VerifyState = "loading" | "success" | "error";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const run = async () => {
      const token = searchParams.get("token");
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

      if (!token) {
        setState("error");
        setMessage("Missing verification token.");
        return;
      }

      try {
        const res = await fetch(
          `${apiBase}/auth/verify?token=${encodeURIComponent(token)}`
        );
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setState("error");
          setMessage(data?.detail ?? "Verification failed.");
          return;
        }

        setState("success");
        setMessage(data?.message ?? "Email verified successfully.");
      } catch {
        setState("error");
        setMessage("Network error while verifying email.");
      }
    };

    run();
  }, [searchParams]);

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
              Email verification
            </span>
          </div>

          {state === "loading" && (
            <>
              <div className="mb-8 flex justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-cyan-400" />
              </div>
              <h1 className="text-center text-3xl font-semibold tracking-tight">
                Verifying your email
              </h1>
              <p className="mt-3 text-center text-sm leading-6 text-slate-400">
                Please wait while we confirm your account.
              </p>
            </>
          )}

          {state === "success" && (
            <>
              <div className="mb-8 flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-emerald-400" />
              </div>
              <h1 className="text-center text-3xl font-semibold tracking-tight">
                Verification successful
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

          {state === "error" && (
            <>
              <div className="mb-8 flex justify-center">
                <AlertCircle className="h-16 w-16 text-red-400" />
              </div>
              <h1 className="text-center text-3xl font-semibold tracking-tight">
                Verification failed
              </h1>
              <p className="mt-3 text-center text-sm leading-6 text-slate-300">
                {message}
              </p>

              <div className="mt-8 space-y-3">
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:from-cyan-400 hover:to-sky-400"
                >
                  Back to login
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </main>
  );
}