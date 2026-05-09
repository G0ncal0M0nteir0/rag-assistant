"use client";

import AuthForm from "@/components/auth/auth-form";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const handleSubmit = async (data: Record<string, string>) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.detail ?? "Unable to register");
    }

    router.push("/login?registered=1");
  };

  return (
    <AuthForm
      type="register"
      title="Get Started"
      subtitle="Create an account to upload documents and chat with AI"
      onSubmit={handleSubmit}
    />
  );
}