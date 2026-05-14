"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	Clock3,
	Database,
	FileText,
	FileUp,
	Loader2,
	RefreshCw,
	Shield,
	Sparkles,
	Trash2,
	Upload,
} from "lucide-react";

type DocumentItem = {
	id: string;
	filename: string;
	status: string;
	chunk_count: number;
	created_at: string;
};

const ALLOWED_EXTENSIONS = ["pdf", "txt", "md", "docx", "pptx"];
const MAX_FILE_SIZE_MB = 50;

export default function KnowledgeBasePage() {
	const router = useRouter();
	const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

	const [documents, setDocuments] = useState<DocumentItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");

	const authHeaders = () => {
		const token = localStorage.getItem("access_token");
		const tokenType = localStorage.getItem("token_type") ?? "bearer";

		return token ? { Authorization: `${tokenType} ${token}` } : null;
	};

	const loadDocuments = async () => {
		const headers = authHeaders();

		if (!headers) {
			router.push("/login");
			return;
		}

		setLoading(true);
		setError("");

		try {
			const response = await fetch(`${apiBase}/documents/`, {
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

				throw new Error(data?.detail ?? "Unable to load documents");
			}

			setDocuments(data);
		} catch (loadError) {
			setError(
				loadError instanceof Error ? loadError.message : "Unable to load documents"
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadDocuments();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleUpload = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setMessage("");

		if (!selectedFile) {
			setError("Select a file to upload.");
			return;
		}

		const ext = selectedFile.name.split(".").pop()?.toLowerCase() ?? "";
		if (!ALLOWED_EXTENSIONS.includes(ext)) {
			setError("Unsupported file type. Use PDF, TXT, MD, DOCX, or PPTX.");
			return;
		}

		if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
			setError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
			return;
		}

		const headers = authHeaders();
		if (!headers) {
			router.push("/login");
			return;
		}

		setUploading(true);

		try {
			const formData = new FormData();
			formData.append("file", selectedFile);

			const response = await fetch(`${apiBase}/documents/upload`, {
				method: "POST",
				headers,
				body: formData,
			});

			const data = await response.json().catch(() => null);

			if (!response.ok) {
				if (response.status === 401 || response.status === 403) {
					localStorage.removeItem("access_token");
					localStorage.removeItem("token_type");
					router.push("/login");
					return;
				}

				throw new Error(data?.detail ?? "Unable to upload document");
			}

			setSelectedFile(null);
			setMessage(`${data.filename ?? selectedFile.name} uploaded successfully.`);
			await loadDocuments();
		} catch (uploadError) {
			setError(
				uploadError instanceof Error ? uploadError.message : "Unable to upload document"
			);
		} finally {
			setUploading(false);
		}
	};

	const handleFileSelection = (file: File | null) => {
		setSelectedFile(file);
		setError("");
		setMessage("");
	};

	const handleFileDrop = (event: React.DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setIsDragging(false);

		const file = event.dataTransfer.files?.[0] ?? null;
		handleFileSelection(file);
	};

	const handleDelete = async (documentId: string, filename: string) => {
		const confirmed = window.confirm(
			`Delete ${filename} and all of its stored chunks? This cannot be undone.`
		);

		if (!confirmed) {
			return;
		}

		const headers = authHeaders();
		if (!headers) {
			router.push("/login");
			return;
		}

		setDeletingId(documentId);
		setError("");
		setMessage("");

		try {
			const response = await fetch(`${apiBase}/documents/${documentId}`, {
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

				throw new Error(data?.detail ?? "Unable to delete document");
			}

			setMessage(data?.message ?? "Document deleted successfully.");
			await loadDocuments();
		} catch (deleteError) {
			setError(
				deleteError instanceof Error ? deleteError.message : "Unable to delete document"
			);
		} finally {
			setDeletingId(null);
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

	return (
		<main className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#09090b_0%,_#111827_48%,_#020617_100%)] px-4 py-10 text-slate-900 dark:text-white">
			<div className="mx-auto max-w-7xl">
				<motion.div
					initial="hidden"
					animate="visible"
					variants={containerVariants}
					className="relative"
				>
					<div className="absolute -top-14 -right-10 h-36 w-36 rounded-full bg-sky-400/20 blur-3xl" />
					<div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl" />

					<motion.div
						variants={itemVariants}
						className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/40 backdrop-blur-xl"
					>
						<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-center gap-3">
								<span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs text-sky-200">
									<Database className="h-3.5 w-3.5" />
									Knowledge Base
								</span>
								<span className="text-xs text-slate-500">
									{documents.length} document{documents.length === 1 ? "" : "s"}
								</span>
							</div>

							<Link
								href="/main"
							className="inline-flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-300 transition hover:text-cyan-700 dark:hover:text-cyan-200"
							>
								<ArrowLeft className="h-4 w-4" />
								Back to workspace
							</Link>
						</div>

						<div className="mb-8 max-w-3xl">
						<h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Knowledge Base</h1>
						<p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
								Upload files, review stored documents, and delete anything you no longer need.
							</p>
						</div>

						<div className="grid gap-6 lg:grid-cols-[1.05fr_1.4fr]">
<motion.section variants={itemVariants} className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-black/20 p-6">
							<div className="mb-5 flex items-center gap-2">
								<FileUp className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
								<h2 className="text-xl font-semibold text-slate-900 dark:text-white">Upload document</h2>
								</div>

								<form onSubmit={handleUpload} className="space-y-4">
									<label
										onDragOver={(event) => {
											event.preventDefault();
											setIsDragging(true);
										}}
										onDragEnter={(event) => {
											event.preventDefault();
											setIsDragging(true);
										}}
										onDragLeave={(event) => {
											event.preventDefault();
											setIsDragging(false);
										}}
										onDrop={handleFileDrop}
										className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-5 py-10 text-center transition ${
											isDragging
											? "border-cyan-600/60 dark:border-cyan-400/60 bg-cyan-100 dark:bg-cyan-400/10"
											: "border-slate-300 dark:border-white/15 bg-slate-200 dark:bg-white/5 hover:border-cyan-600/40 dark:hover:border-cyan-400/40 hover:bg-slate-300 dark:hover:bg-white/10"
										}`}
									>
										<Upload className="h-10 w-10 text-cyan-600 dark:text-cyan-300" />
										<span className="mt-4 text-sm font-medium text-slate-900 dark:text-white">
											{selectedFile ? selectedFile.name : "Choose a file to upload"}
										</span>
										<span className="mt-2 text-xs font-medium text-cyan-600 dark:text-cyan-200">
											{isDragging ? "Drop the file here to attach it" : "Drag and drop a file here, or click to browse"}
										</span>
										<span className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-500">
											PDF, TXT, MD, DOCX, or PPTX. Max {MAX_FILE_SIZE_MB}MB.
										</span>
										<input
											type="file"
											className="hidden"
											onChange={(event) => {
												const file = event.target.files?.[0] ?? null;
												handleFileSelection(file);
											}}
											accept=".pdf,.txt,.md,.docx,.pptx"
										/>
									</label>

									<button
										type="submit"
										disabled={uploading || !selectedFile}
										className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:from-cyan-400 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{uploading ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<FileUp className="h-4 w-4" />
										)}
										Upload
									</button>

									<div className="grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
										<div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
											<div className="flex items-center gap-2 text-slate-200">
												<Shield className="h-4 w-4 text-cyan-300" />
												Protected
											</div>
											<p className="mt-1 text-xs leading-5">
												Only the signed-in user can manage their documents.
											</p>
										</div>
										<div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
											<div className="flex items-center gap-2 text-slate-200">
												<Clock3 className="h-4 w-4 text-cyan-300" />
												Processing
											</div>
											<p className="mt-1 text-xs leading-5">
												Uploaded files are chunked and indexed automatically.
											</p>
										</div>
										<div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
											<div className="flex items-center gap-2 text-slate-200">
												<Sparkles className="h-4 w-4 text-cyan-300" />
												Ready
											</div>
											<p className="mt-1 text-xs leading-5">
												Use the chat page to query your uploaded knowledge base.
											</p>
										</div>
									</div>
								</form>
							</motion.section>

									<motion.section variants={itemVariants} className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-black/20 p-6">
										<div className="mb-5 flex items-center justify-between gap-3">
											<div className="flex items-center gap-2">
												<FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
												<h2 className="text-xl font-semibold text-slate-900 dark:text-white">Stored documents</h2>
											</div>

											<button
												type="button"
												onClick={loadDocuments}
												className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-white/10 bg-slate-200 dark:bg-white/5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 transition hover:bg-slate-300 dark:hover:bg-white/10"
									>
										<RefreshCw className="h-4 w-4" />
										Refresh
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

								{loading ? (
									<div className="flex items-center justify-center py-20">
										<Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
									</div>
								) : documents.length === 0 ? (
									<div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-400">
										No documents uploaded yet.
									</div>
								) : (
									<div className="space-y-4">
										{documents.map((document) => (
											<div
												key={document.id}
												className="rounded-3xl border border-white/10 bg-white/5 p-5"
											>
												<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
													<div className="min-w-0">
														<div className="flex flex-wrap items-center gap-2">
															<h3 className="truncate text-base font-semibold text-white">
																{document.filename}
															</h3>
															<span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-200">
																{document.status}
															</span>
														</div>

														<p className="mt-2 break-all text-xs text-slate-500">
															ID: {document.id}
														</p>

														<div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-400">
															<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1">
																<Clock3 className="h-4 w-4 text-cyan-300" />
																{new Date(document.created_at).toLocaleString()}
															</span>
															<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1">
																<Sparkles className="h-4 w-4 text-cyan-300" />
																{document.chunk_count} chunks
															</span>
														</div>
													</div>

													<button
														type="button"
														onClick={() => handleDelete(document.id, document.filename)}
														disabled={deletingId === document.id}
														className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
													>
														{deletingId === document.id ? (
															<Loader2 className="h-4 w-4 animate-spin" />
														) : (
															<Trash2 className="h-4 w-4" />
														)}
														Delete
													</button>
												</div>
											</div>
										))}
									</div>
								)}
							</motion.section>
						</div>
					</motion.div>
				</motion.div>
			</div>
		</main>
	);
}