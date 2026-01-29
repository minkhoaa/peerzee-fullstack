"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { AxiosError } from "axios";
import { Home, User } from "lucide-react";
import { WoodenFrame, PushPin, CarvedInput, CarvedTextarea, PixelButton } from "@/components/village";
import type { RegisterDto } from "@/types";

const characterClasses = ["Villager", "Adventurer", "Merchant", "Artisan", "Scholar"];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    display_name: "",
    phone: "",
    bio: "",
    location: "",
    characterClass: "Villager",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!termsAccepted) {
      setError("You must accept the Village Laws");
      setLoading(false);
      return;
    }

    try {
      const payload: RegisterDto = {
        email: formData.email,
        password: formData.password,
        display_name: formData.display_name,
        phone: formData.phone,
        bio: formData.bio,
        location: formData.location,
      };
      await authApi.register(payload);
      router.push("/login");
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grass-dots flex items-center justify-center p-8">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-[var(--wood-dark)] border-b-4 border-[var(--wood-shadow)] px-6 py-4 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-[var(--primary-orange)] border-3 border-[var(--border-dark)] flex items-center justify-center">
              <Home className="w-7 h-7 text-[var(--parchment)]" />
            </div>
            <div>
              <h1 className="font-pixel text-2xl text-[var(--parchment)] tracking-wider">PEERZEE VILLAGE</h1>
              <p className="text-xs text-[var(--parchment-dark)] font-mono uppercase tracking-widest">GATEWAY TO ADVENTURE</p>
            </div>
          </Link>
          
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
            <span className="text-[var(--parchment-dark)] text-sm hidden sm:inline">Already a resident?</span>
            <Link
              href="/login"
              className="pixel-btn pixel-btn-secondary px-4 py-2 font-pixel text-sm"
            >
              LOGIN
            </Link>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 mt-20">
        {/* Registration Form */}
        <WoodenFrame>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
            <PushPin color="red" />
          </div>
          
          <div className="p-8">
            <h2 className="font-pixel text-3xl text-center text-[var(--text-pixel)] mb-2">REGISTRATION FORM</h2>
            <p className="text-center text-sm text-[var(--text-pixel)]/70 mb-6 uppercase tracking-wide">
              OFFICIAL CENSUS DOCUMENT
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
            
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
              <CarvedInput
                label="NAME [STR]"
                pixelLabel
                type="text"
                name="display_name"
                placeholder="Sir Codes-a-Lot"
                value={formData.display_name}
                onChange={handleChange}
                required
              />
              
              <div className="flex flex-col gap-2">
                <label className="font-pixel text-sm text-[var(--text-pixel)] uppercase tracking-wide">
                  CLASS [INT]
                </label>
                <div className="relative">
                  <select
                    name="characterClass"
                    value={formData.characterClass}
                    onChange={handleChange}
                    className="carved-input w-full appearance-none cursor-pointer"
                  >
                    {characterClasses.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <CarvedInput
                label="EMAIL SCROLL [WIS]"
                pixelLabel
                type="email"
                name="email"
                placeholder="hero@peerzee.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
              
              <CarvedInput
                label="SECRET KEY [DEX]"
                pixelLabel
                type="password"
                name="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              
              <CarvedInput
                label="CONFIRM KEY [DEX]"
                pixelLabel
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              
              <CarvedTextarea
                label="BIO [CHA]"
                pixelLabel
                name="bio"
                placeholder="Tell us your tale..."
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                maxLength={200}
              />
              <p className="text-xs text-right text-[var(--text-pixel)]/50">{formData.bio.length}/200</p>
              
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-5 h-5 border-3 border-[var(--border-dark)]"
                  required
                />
                <label htmlFor="terms" className="text-sm">
                  I swear fealty to the{" "}
                  <span className="text-[var(--primary-orange)] font-medium cursor-pointer hover:underline">
                    Village Laws
                  </span>
                </label>
              </div>
              
              <PixelButton
                type="submit"
                variant="success"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "CREATING..." : "CREATE CHARACTER"}
              </PixelButton>
            </form>
          </div>
        </WoodenFrame>
        
        {/* Character Preview */}
        <div className="flex flex-col gap-6">
          <WoodenFrame className="flex-1">
            <div className="p-8 flex flex-col items-center justify-center h-full">
              <div className="w-48 h-48 bg-gradient-to-b from-[var(--accent-blue)] to-[var(--accent-blue)]/70 border-4 border-[var(--border-dark)] mb-4 flex items-center justify-center">
                <User className="w-24 h-24 text-[var(--parchment)]" />
              </div>
              
              <div className="w-full bg-[var(--landscape-green)] border-3 border-[var(--border-dark)] px-6 py-3 mb-2">
                <p className="font-pixel text-xl text-center text-[var(--parchment)]">NOVICE</p>
                <p className="text-center text-[var(--parchment-dark)] text-sm">LEVEL 1</p>
              </div>
              
              {formData.display_name && (
                <div className="mt-4 text-center">
                  <p className="font-pixel text-2xl text-[var(--text-pixel)]">{formData.display_name}</p>
                  <p className="text-sm text-[var(--text-pixel)]/70">{formData.characterClass}</p>
                </div>
              )}
            </div>
          </WoodenFrame>
          
          <Link
            href="/login"
            className="bg-[var(--parchment)] border-3 border-[var(--border-dark)] p-4 hover:bg-[var(--parchment-dark)] transition-colors text-center block"
          >
            <p className="font-mono text-sm text-[var(--text-pixel)]/70 mb-1 uppercase tracking-wide">
              Already a resident?
            </p>
            <p className="font-pixel text-xl text-[var(--primary-orange)] hover:text-[var(--primary-red)]">
              LOGIN →
            </p>
          </Link>
          
          <div className="bg-[var(--parchment)] border-3 border-[var(--border-dark)] p-4 text-center">
            <p className="text-xs text-[var(--text-pixel)]/60 italic">
              "Return to Town Square" link will appear after registration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
