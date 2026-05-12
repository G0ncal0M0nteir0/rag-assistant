import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="flex h-20 items-center justify-between px-8 border-b border-zinc-800">
      <div className="flex h-full items-center">
        <Image
          src="/photos/logo_symbol.png"
          alt="RAG Assistant logo"
          width={80}
          height={80}
          className="h-full w-auto object-contain"
          priority
        />
      </div>

      <div className="flex gap-4 items-center">
        <Link href="/login">
          <button className="px-4 py-2.5 rounded-lg text-white hover:bg-zinc-800 transition-colors">
            Login
          </button>
        </Link>

        <Link href="/register">
          <button className="bg-white text-black px-4 py-2.5 rounded-lg hover:bg-zinc-100 transition-colors font-medium">
            Get Started
          </button>
        </Link>
      </div>
    </nav>
  );
}