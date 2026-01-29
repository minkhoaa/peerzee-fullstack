"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { AxiosError } from "axios";
import AuthCard from "@/components/auth/AuthCard";
import { CarvedInput, PixelButton } from "@/components/village";
import type { LoginDto } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload: LoginDto = {
        email: formData.email,
        password: formData.password,
        device: "web",
      };
      const { data } = await authApi.login(payload);
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("userId", data.user_id);
      router.push("/chat");
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard characterType="login">
      {/* Header */}
      <h2 className="font-pixel text-3xl text-center text-[var(--text-pixel)] mb-2">LOGIN FORM</h2>
      <p className="text-center text-sm text-[var(--text-pixel)]/70 mb-6 uppercase tracking-wide">
        IDENTIFY YOURSELF
      </p>
      <div className="w-full h-0.5 bg-[var(--text-pixel)] mb-8" />

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-[var(--primary-red)]/10 border-3 border-[var(--primary-red)] text-[var(--primary-red)] flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-mono text-sm">{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <CarvedInput
          label="USER ID [INT]"
          pixelLabel
          type="email"
          name="email"
          placeholder="adventurer@peerzee.com"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <CarvedInput
          label="SECRET KEY [DEX]"
          pixelLabel
          type="password"
          name="password"
          placeholder="••••••••••••"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button
          type="button"
          className="font-mono text-sm text-[var(--text-pixel)]/70 hover:text-[var(--primary-orange)] underline"
        >
          FORGOT YOUR KEY?
        </button>

        <PixelButton
          type="submit"
          variant="success"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? "ENTERING..." : "ENTER VILLAGE"}
        </PixelButton>
      </form>
    </AuthCard>
  );
}
