import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="flex h-20 items-center justify-between px-8 border-b border-slate-300 dark:border-white/10 bg-white dark:bg-black/5">
      <div className="flex h-full items-center gap-3">
        <Image
          src="/photos/logo_symbol.png"
          alt="KnowLix logo"
          width={48}
          height={48}
          className="h-12 w-12 object-contain"
          priority
        />
        <Link href="/" className="text-lg font-semibold text-slate-900 dark:text-white">
          KnowLix
        </Link>
      </div>

      <div className="flex gap-4 items-center">
        <Link href="/login" className="px-4 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
          Login
        </Link>

        <Link href="/register" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white transition-colors">
          Get Started
        </Link>
      </div>
    </nav>
  );
}