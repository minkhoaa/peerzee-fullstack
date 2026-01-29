import { Home, Lock } from "lucide-react";
import Link from "next/link";
import { WoodenFrame, PushPin } from "@/components/village";

interface AuthCardProps {
  children: React.ReactNode;
  showCharacterPreview?: boolean;
  characterType?: "login" | "register";
  onRegister?: () => void;
  onLogin?: () => void;
}

export default function AuthCard({ 
  children, 
  showCharacterPreview = true,
  characterType = "login"
}: AuthCardProps) {
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
              <p className="text-xs text-[var(--parchment-dark)] font-mono uppercase tracking-widest">PASSPORT CONTROL</p>
            </div>
          </Link>
          
          <Link
            href="/"
            className="absolute right-6 top-1/2 -translate-y-1/2 font-pixel text-[var(--parchment)] hover:text-[var(--accent-yellow)] transition-colors"
          >
            ← BACK
          </Link>
        </div>
      </div>
      
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 mt-20">
        {/* Main Form Panel */}
        <WoodenFrame>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
            <PushPin color="red" />
          </div>
          
          <div className="p-8">
            {children}
          </div>
        </WoodenFrame>
        
        {/* Character Preview / Info Panel */}
        {showCharacterPreview && (
          <div className="flex flex-col gap-6">
            <WoodenFrame className="flex-1">
              <div className="p-8 flex flex-col items-center justify-center h-full">
                <div className="w-48 h-48 bg-gradient-to-b from-[var(--wood-dark)] to-[var(--wood-shadow)] border-4 border-[var(--border-dark)] mb-4 flex items-center justify-center relative overflow-hidden">
                  <Lock className="w-20 h-20 text-[var(--parchment)]/30" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="font-pixel text-2xl text-[var(--parchment)]">
                      {characterType === "login" ? "RETURNING" : "NEW"}
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-[var(--wood-dark)] border-3 border-[var(--border-dark)] px-6 py-3">
                  <p className="font-pixel text-xl text-center text-[var(--parchment)]">
                    {characterType === "login" ? "RESIDENT" : "VILLAGER"}
                  </p>
                </div>
              </div>
            </WoodenFrame>
            
            <Link
              href={characterType === "login" ? "/register" : "/login"}
              className="bg-[var(--parchment)] border-3 border-[var(--border-dark)] p-4 hover:bg-[var(--parchment-dark)] transition-colors text-center block"
            >
              <p className="font-mono text-sm text-[var(--text-pixel)]/70 mb-1 uppercase tracking-wide">
                {characterType === "login" ? "New here?" : "Already a resident?"}
              </p>
              <p className="font-pixel text-xl text-[var(--primary-orange)] hover:text-[var(--primary-red)]">
                {characterType === "login" ? "REGISTER →" : "LOGIN →"}
              </p>
            </Link>
            
            <div className="bg-[var(--parchment)] border-3 border-[var(--border-dark)] p-4 text-center">
              <p className="text-xs text-[var(--text-pixel)]/60 italic">
                "Return to Town Square" link available after login
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
