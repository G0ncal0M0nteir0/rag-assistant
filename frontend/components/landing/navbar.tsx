import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
      <h1 className="text-xl font-bold">
        RAG Assistant
      </h1>

      <div className="flex gap-4">
        <Link href="/login">
          <button>Login</button>
        </Link>

        <Link href="/register">
          <button className="bg-white text-black px-4 py-2 rounded-lg">
            Get Started
          </button>
        </Link>
      </div>
    </nav>
  );
}