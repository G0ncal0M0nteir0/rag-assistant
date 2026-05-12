"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Shield,
  Trash2,
  Users,
  AlertCircle,
  Zap,
  FileText,
  MessageSquare,
} from "lucide-react";

type AdminStats = {
  total_users: number;
  total_documents: number;
  total_tokens_consumed: number;
  total_conversations: number;
};

type AdminUser = {
  id: string;
  email: string;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  document_count: number;
  conversation_count: number;
  message_count: number;
  token_usage_count: number;
};

type CurrentUser = {
  id: string;
  email: string;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteScope, setBulkDeleteScope] = useState<"non_admins" | "all">(
    "non_admins"
  );
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkAdminStatus = async () => {
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") ?? "bearer";

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `${tokenType} ${token}` },
      });

      const userData = (await response.json().catch(() => null)) as CurrentUser | null;

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token_type");
          router.push("/login");
          return;
        }
        throw new Error("Unable to verify admin status");
      }

      if (!userData || !userData.is_admin) {
        router.push("/main");
        return;
      }

      setIsAdmin(true);
    } catch {
      router.push("/main");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAdminData = async () => {
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") ?? "bearer";

    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const [statsResponse, usersResponse] = await Promise.all([
        fetch(`${apiBase}/auth/admin/stats`, {
          headers: { Authorization: `${tokenType} ${token}` },
        }),
        fetch(`${apiBase}/auth/admin/users`, {
          headers: { Authorization: `${tokenType} ${token}` },
        }),
      ]);

      const statsData = await statsResponse.json().catch(() => null);
      const usersData = await usersResponse.json().catch(() => null);

      if (!statsResponse.ok || !usersResponse.ok) {
        const detail =
          statsData?.detail ?? usersData?.detail ?? "Unable to load admin data";
        if (
          statsResponse.status === 401 ||
          statsResponse.status === 403 ||
          usersResponse.status === 401 ||
          usersResponse.status === 403
        ) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token_type");
          router.push("/login");
          return;
        }
        throw new Error(detail);
      }

      setStats(statsData);
      setUsers(usersData);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load admin data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && !checking) {
      loadAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, checking]);

  const handleDeleteUser = async (user: AdminUser) => {
    const confirmed = window.confirm(
      `Delete ${user.email} and all of their stored data (${user.document_count} documents, ${user.conversation_count} conversations)? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") ?? "bearer";

    if (!token) {
      router.push("/login");
      return;
    }

    setDeletingId(user.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${apiBase}/auth/admin/users/${user.id}`, {
        method: "DELETE",
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
        throw new Error(data?.detail ?? "Unable to delete user");
      }

      setMessage(data?.message ?? "User deleted successfully.");
      await loadAdminData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete user"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") ?? "bearer";

    if (!token) {
      router.push("/login");
      return;
    }

    setBulkDeleting(true);
    setError("");
    setMessage("");

    try {
      const params = new URLSearchParams({
        confirm: "true",
        scope: bulkDeleteScope,
        keep_current_admin: "true",
      });

      const response = await fetch(
        `${apiBase}/auth/admin/users?${params.toString()}`,
        {
          method: "DELETE",
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
        throw new Error(data?.detail ?? "Unable to delete users");
      }

      setMessage(data?.message ?? "Users deleted successfully.");
      setBulkDeleteConfirm("");
      setShowBulkDeleteModal(false);
      await loadAdminData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete users"
      );
    } finally {
      setBulkDeleting(false);
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

  const totalVerifiedUsers = useMemo(
    () => users.filter((user) => user.is_verified).length,
    [users]
  );

  const totalAdminUsers = useMemo(
    () => users.filter((user) => user.is_admin).length,
    [users]
  );

  const canBulkDelete = bulkDeleteConfirm === "DELETE_ALL";

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#09090b_0%,_#111827_48%,_#020617_100%)] px-4 py-10 text-white">
      {checking ? (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        </div>
      ) : !isAdmin ? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center text-slate-400">
            <p>You do not have admin access.</p>
          </div>
        </div>
      ) : (
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative"
        >
          <div className="absolute -top-14 -right-10 h-36 w-36 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-orange-500/15 blur-3xl" />

          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <div className="mb-8 flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
                <Shield className="h-3.5 w-3.5" />
                Admin Dashboard
              </span>

              <Link
                href="/main"
                className="inline-flex items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to workspace
              </Link>
            </div>

            <div className="mb-8 max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-tight">
                User Management
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                View system statistics, manage user accounts, and perform bulk
                operations. Delete individual users or purge multiple accounts
                at once.
              </p>
            </div>

            {error && (
              <motion.div
                variants={itemVariants}
                className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100"
              >
                {error}
              </motion.div>
            )}

            {message && (
              <motion.div
                variants={itemVariants}
                className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
              >
                {message}
              </motion.div>
            )}

            <motion.div
              variants={itemVariants}
              className="mb-8 grid gap-4 md:grid-cols-4"
            >
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-cyan-300" />
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Total Users
                  </div>
                </div>
                <div className="mt-3 text-2xl font-semibold">
                  {stats?.total_users ?? 0}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-300" />
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Documents
                  </div>
                </div>
                <div className="mt-3 text-2xl font-semibold">
                  {stats?.total_documents ?? 0}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-violet-300" />
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Conversations
                  </div>
                </div>
                <div className="mt-3 text-2xl font-semibold">
                  {stats?.total_conversations ?? 0}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-300" />
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Tokens Used
                  </div>
                </div>
                <div className="mt-3 text-2xl font-semibold">
                  {(stats?.total_tokens_consumed ?? 0).toLocaleString()}
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mb-6 grid gap-4 md:grid-cols-3"
            >
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-slate-500">Verified Users</div>
                <div className="mt-2 text-xl font-semibold">
                  {totalVerifiedUsers}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-slate-500">Admin Users</div>
                <div className="mt-2 text-xl font-semibold">{totalAdminUsers}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-slate-500">Regular Users</div>
                <div className="mt-2 text-xl font-semibold">
                  {(stats?.total_users ?? 0) - totalAdminUsers}
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="h-4 w-4 text-cyan-300" />
                <span className="text-sm font-medium">
                  User Accounts ({users.length})
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={loadAdminData}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                  Bulk Delete
                </button>
              </div>
            </motion.div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
              </div>
            ) : users.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="rounded-3xl border border-dashed border-white/10 bg-black/20 px-6 py-12 text-center text-sm text-slate-400"
              >
                No users found in the system.
              </motion.div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {users.map((user, idx) => (
                  <motion.div
                    key={user.id}
                    variants={itemVariants}
                    className="rounded-3xl border border-white/10 bg-black/20 p-5 shadow-lg shadow-black/20"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold">{user.email}</h2>
                          {user.is_admin && (
                            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200">
                              Admin
                            </span>
                          )}
                          {user.is_verified ? (
                            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-200">
                              Verified
                            </span>
                          ) : (
                            <span className="rounded-full border border-slate-400/20 bg-slate-400/10 px-2 py-0.5 text-xs text-slate-200">
                              Unverified
                            </span>
                          )}
                        </div>

                        <p className="mt-2 break-all text-xs text-slate-500">
                          ID: {user.id}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Created{" "}
                          {new Date(user.created_at).toLocaleString()}
                        </p>
                      </div>

                      {!user.is_admin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          disabled={deletingId === user.id}
                          className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete
                        </button>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                        <div className="text-slate-500">Documents</div>
                        <div className="mt-1 font-semibold">
                          {user.document_count}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                        <div className="text-slate-500">Conversations</div>
                        <div className="mt-1 font-semibold">
                          {user.conversation_count}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                        <div className="text-slate-500">Messages</div>
                        <div className="mt-1 font-semibold">
                          {user.message_count}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                        <div className="text-slate-500">Token Usage</div>
                        <div className="mt-1 font-semibold">
                          {user.token_usage_count}
                        </div>
                      </div>
                    </div>

                    {user.is_admin && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                        <AlertTriangle className="h-4 w-4" />
                        Admin accounts cannot be deleted from this interface.
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    )}

      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start gap-3">
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-400" />
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Bulk Delete Users
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  This operation will permanently delete selected users and all
                  their data. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Delete Scope
                </label>
                <select
                  value={bulkDeleteScope}
                  onChange={(e) =>
                    setBulkDeleteScope(e.target.value as "non_admins" | "all")
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                >
                  <option value="non_admins">
                    Non-admin Users (recommended)
                  </option>
                  <option value="all">All Users (including admins)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Confirmation
                </label>
                <input
                  type="text"
                  value={bulkDeleteConfirm}
                  onChange={(e) => setBulkDeleteConfirm(e.target.value)}
                  placeholder='Type "DELETE_ALL" to confirm'
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowBulkDeleteModal(false);
                  setBulkDeleteConfirm("");
                }}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white transition hover:bg-white/10"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={!canBulkDelete || bulkDeleting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 font-medium text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {bulkDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Selected
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
