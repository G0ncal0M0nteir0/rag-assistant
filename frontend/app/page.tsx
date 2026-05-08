import Navbar from "@/components/landing/navbar";
import Hero from "@/components/landing/hero";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <Hero />
    </main>
  );
}