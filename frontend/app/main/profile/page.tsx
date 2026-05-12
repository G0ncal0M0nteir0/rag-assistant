"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Save,
  Sparkles,
  User,
} from "lucide-react";

type UserProfile = {
  id: string;
  email: string;
  is_verified: boolean;
  created_at: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("access_token");
      const tokenType = localStorage.getItem("token_type") ?? "bearer";

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/auth/me`,
          {
            headers: {
              Authorization: `${tokenType} ${token}`,
            },
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("token_type");
            router.push("/login");
            return;
          }
          throw new Error(data?.detail ?? "Unable to load profile");
        }

        setProfile(data);
        setEmail(data.email);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }

      if (!/[A-Z]/.test(newPassword)) {
        setError("Password must contain at least one uppercase letter");
        return;
      }

      if (!/\d/.test(newPassword)) {
        setError("Password must contain at least one number");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") ?? "bearer";

    if (!token) {
      router.push("/login");
      return;
    }

    setSaving(true);

    try {
      const payload: { email: string; password?: string } = {
        email: email.trim(),
      };

      if (newPassword) {
        payload.password = newPassword;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/auth/me`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${tokenType} ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token_type");
          router.push("/login");
          return;
        }
        throw new Error(data?.detail ?? "Unable to update profile");
      }

      setProfile(data);
      setEmail(data.email);
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Profile updated successfully.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update profile");
    } finally {
      setSaving(false);
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

  const formattedCreatedAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleString()
    : "";

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#09090b_0%,_#111827_48%,_#020617_100%)] px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl">
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
                Profile
              </span>

              <Link
                href="/main"
                className="text-sm text-cyan-300 transition hover:text-cyan-200"
              >
                Back to workspace
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight">Your profile</h1>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                View and update your account information.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div variants={itemVariants} className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="mb-2 flex items-center gap-2 text-slate-300">
                      <User className="h-4 w-4 text-cyan-300" />
                      <span className="text-sm font-medium">User ID</span>
                    </div>
                    <p className="break-all text-sm text-slate-400">
                      {profile?.id ?? "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="mb-2 flex items-center gap-2 text-slate-300">
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          profile?.is_verified ? "text-emerald-400" : "text-amber-400"
                        }`}
                      />
                      <span className="text-sm font-medium">Verification</span>
                    </div>
                    <p className="text-sm text-slate-400">
                      {profile?.is_verified ? "Verified" : "Not verified"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="mb-2 flex items-center gap-2 text-slate-300">
                      <Mail className="h-4 w-4 text-cyan-300" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Lock className="h-4 w-4 text-cyan-300" />
                    <span className="text-sm font-medium">Change password</span>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2 text-slate-300">
                      <Lock className="h-4 w-4 text-cyan-300" />
                      <span className="text-sm font-medium">Password</span>
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2 text-slate-300">
                      <Lock className="h-4 w-4 text-cyan-300" />
                      <span className="text-sm font-medium">Confirm Password</span>
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>
                </motion.div>

                {error && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                      <p>{error}</p>
                    </div>
                  </div>
                )}

                {message && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      <p>{message}</p>
                    </div>
                  </div>
                )}

                <motion.button
                  variants={itemVariants}
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:from-cyan-400 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </motion.button>

                <motion.p
                  variants={itemVariants}
                  className="text-center text-xs text-slate-500"
                >
                  Joined {formattedCreatedAt}
                </motion.p>
              </form>
            )}
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}