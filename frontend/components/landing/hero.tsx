import Link from "next/dist/client/link";

export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center text-center py-32 px-6">
      <h1 className="text-6xl font-bold max-w-4xl leading-tight">
        Your AI assistant for private knowledge.
      </h1>

      <p className="text-zinc-400 text-lg mt-6 max-w-2xl">
        Upload documents and chat with them using AI-powered semantic search.
      </p>

      <div className="flex gap-4 mt-10">
        <Link href="/register">
          <button className="bg-white text-black px-6 py-3 rounded-xl">
            Get Started
          </button>
        </Link>

        <button className="border border-zinc-700 px-6 py-3 rounded-xl">
          Learn More
        </button>
      </div>
    </section>
  );
}