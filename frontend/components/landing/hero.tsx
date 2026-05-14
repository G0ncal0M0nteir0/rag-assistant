import Link from "next/link";

export default function Hero() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 py-16 px-8 text-center">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">KnowLix</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Your AI assistant for private knowledge</p>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 dark:text-slate-400">
          Upload documents and chat with them using AI-powered semantic search. Keep your data private and searchable with fast, accurate embeddings.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition">
            Get Started
          </Link>

          <Link href="/docs" className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition">
            Learn more
          </Link>
        </div>
      </div>
    </section>
  );
}