"use client";

import AuthForm from "@/components/auth/auth-form";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

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
    router.push("/");
  };

  return (
    <AuthForm
      type="login"
      title="Welcome Back"
      subtitle="Sign in to access your documents and chat"
      onSubmit={handleSubmit}
    />
  );
}
