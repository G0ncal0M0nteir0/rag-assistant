"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

interface AuthFormProps {
  type: "login" | "register";
  title: string;
  subtitle: string;
  onSubmit: (data: Record<string, string>) => Promise<void> | void;
  isLoading?: boolean;
}

export default function AuthForm({
  type,
  title,
  subtitle,
  onSubmit,
  isLoading = false,
}: AuthFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    ...(type === "register" && { name: "", confirmPassword: "" }),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
    }

    if (type === "register") {
      if (!formData.name) {
        newErrors.name = "Name is required";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (submitError) {
      setSubmitError("");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />

        <motion.div
          variants={itemVariants}
          className="relative bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-8 backdrop-blur-xl"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <p className="text-zinc-400">{subtitle}</p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name field (register only) */}
            {type === "register" && (
              <motion.div variants={itemVariants}>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-5 h-5" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`w-full bg-zinc-800/50 border ${
                      errors.name ? "border-red-500" : "border-zinc-700"
                    } rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all`}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                )}
              </motion.div>
            )}

            {/* Email field */}
            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full bg-zinc-800/50 border ${
                    errors.email ? "border-red-500" : "border-zinc-700"
                  } rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </motion.div>

            {/* Password field */}
            <motion.div variants={itemVariants}>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-5 h-5" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full bg-zinc-800/50 border ${
                    errors.password ? "border-red-500" : "border-zinc-700"
                  } rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all`}
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </motion.div>

            {/* Confirm Password field (register only) */}
            {type === "register" && (
              <motion.div variants={itemVariants}>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-5 h-5" />
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword || ""}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full bg-zinc-800/50 border ${
                      errors.confirmPassword ? "border-red-500" : "border-zinc-700"
                    } rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </motion.div>
            )}

            {/* Remember me / Forgot password (login only) */}
            {type === "login" && (
              <motion.div
                variants={itemVariants}
                className="flex items-center justify-between text-sm"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 bg-zinc-800 border border-zinc-700 rounded cursor-pointer"
                  />
                  <span className="text-zinc-400">Remember me</span>
                </label>
                <Link
                  href="#"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </motion.div>
            )}

            {/* Submit button */}
            {submitError && (
              <motion.p variants={itemVariants} className="text-sm text-red-400">
                {submitError}
              </motion.p>
            )}

            <motion.button
              variants={itemVariants}
              type="submit"
              disabled={isLoading || submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-3 font-semibold transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading || submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {type === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer link */}
          <motion.div variants={itemVariants} className="text-center mt-6">
            <p className="text-zinc-400 text-sm">
              {type === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <Link
                href={type === "login" ? "/register" : "/login"}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {type === "login" ? "Sign up" : "Sign in"}
              </Link>
            </p>
          </motion.div>
        </motion.div>

        {/* Bottom info text */}
        <motion.p
          variants={itemVariants}
          className="text-center text-zinc-500 text-xs mt-6"
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </main>
  );
}
