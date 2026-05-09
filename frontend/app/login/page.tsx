"use client";

import AuthForm from "@/components/auth/auth-form";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  const handleSubmit = async (data: Record<string, string>) => {
    const formData = new URLSearchParams();
    formData.set("username", data.email);
    formData.set("password", data.password);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.detail ?? "Unable to log in");
    }

    const { access_token, token_type } = await response.json();
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("token_type", token_type);
    router.push("/main");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#09090b_0%,_#111827_48%,_#020617_100%)]">
      <div className="mx-auto w-full max-w-md px-4 py-10">
        {registered === "1" && (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 backdrop-blur-xl">
            Registration successful. Please check your email and verify your account before logging in.
          </div>
        )}

        <AuthForm
          type="login"
          title="Welcome Back"
          subtitle="Sign in to access your documents and chat"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}