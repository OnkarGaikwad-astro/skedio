"use client";

import { useState } from "react";
import { loginSchool } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { ArrowRight, School } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await loginSchool(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-60" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-60" />

      <div className="w-full max-w-[400px] z-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[24px] bg-white shadow-sm border border-border/50 mb-6">
            <School className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Welcome to Skedio</h1>
          <p className="text-slate-500 text-sm">Sign in with your School UDISE code</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-border/50 shadow-sm rounded-[24px] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="udiseCode">
                UDISE Code
              </label>
              <Input
                id="udiseCode"
                name="udiseCode"
                placeholder="Enter 11-digit UDISE code"
                required
                className="h-11 rounded-[14px] bg-slate-50/50 border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                className="h-11 rounded-[14px] bg-slate-50/50 border-slate-200"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-[12px] text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary text-primary-foreground rounded-[14px] font-medium text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group shadow-sm disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          Don't have a school account yet?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Register School
          </Link>
        </p>
      </div>
    </div>
  );
}
