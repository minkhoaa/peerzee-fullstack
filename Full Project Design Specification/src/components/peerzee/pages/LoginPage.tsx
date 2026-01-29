import { useState } from 'react';
import { WoodenFrame } from '../WoodenFrame';
import { CarvedInput } from '../CarvedInput';
import { PixelButton } from '../PixelButton';
import { PushPin } from '../PushPin';
import { Lock, Home } from 'lucide-react';

interface LoginPageProps {
  onLogin?: (email: string, password: string) => void;
  onRegister?: () => void;
  onBack?: () => void;
}

export function LoginPage({ onLogin, onRegister, onBack }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin?.(email, password);
  };
  
  return (
    <div className="min-h-screen grass-dots flex items-center justify-center p-8">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-wood-dark border-b-4 border-wood-shadow px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-orange border-3 border-border-dark flex items-center justify-center">
            <Home className="w-7 h-7 text-parchment" />
          </div>
          <div>
            <h1 className="font-pixel text-2xl text-parchment tracking-wider">PEERZEE VILLAGE</h1>
            <p className="text-xs text-parchment-dark font-mono uppercase tracking-widest">PASSPORT CONTROL</p>
          </div>
        </div>
        
        <button
          onClick={onBack}
          className="absolute right-6 top-1/2 -translate-y-1/2 font-pixel text-parchment hover:text-accent-yellow"
        >
          ← BACK
        </button>
      </div>
      
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 mt-20">
        {/* Login Form */}
        <WoodenFrame>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
            <PushPin color="red" />
          </div>
          
          <div className="p-8">
            <h2 className="font-pixel text-3xl text-center text-text-pixel mb-2">LOGIN FORM</h2>
            <p className="text-center text-sm text-text-pixel/70 mb-6 uppercase tracking-wide">
              IDENTIFY YOURSELF
            </p>
            <div className="w-full h-0.5 bg-text-pixel mb-8" />
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <CarvedInput
                label="USER ID [INT]"
                pixelLabel
                type="email"
                placeholder="adventurer@peerzee.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              
              <CarvedInput
                label="SECRET KEY [DEX]"
                pixelLabel
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              
              <button
                type="button"
                className="font-mono text-sm text-text-pixel/70 hover:text-primary-orange underline"
              >
                FORGOT YOUR KEY?
              </button>
              
              <PixelButton
                type="submit"
                variant="success"
                size="lg"
                className="w-full"
              >
                ENTER VILLAGE
              </PixelButton>
            </form>
          </div>
        </WoodenFrame>
        
        {/* Character Preview / Info */}
        <div className="flex flex-col gap-6">
          <WoodenFrame className="flex-1">
            <div className="p-8 flex flex-col items-center justify-center h-full">
              <div className="w-48 h-48 bg-gradient-to-b from-wood-dark to-wood-shadow border-4 border-border-dark mb-4 flex items-center justify-center relative overflow-hidden">
                <Lock className="w-20 h-20 text-parchment/30" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="font-pixel text-2xl text-parchment">RETURNING</span>
                </div>
              </div>
              
              <div className="w-full bg-wood-dark border-3 border-border-dark px-6 py-3">
                <p className="font-pixel text-xl text-center text-parchment">RESIDENT</p>
              </div>
            </div>
          </WoodenFrame>
          
          <button
            onClick={onRegister}
            className="bg-parchment border-3 border-border-dark p-4 hover:bg-parchment-dark transition-colors text-center"
          >
            <p className="font-mono text-sm text-text-pixel/70 mb-1 uppercase tracking-wide">
              New here?
            </p>
            <p className="font-pixel text-xl text-primary-orange hover:text-primary-red">
              REGISTER →
            </p>
          </button>
          
          <div className="bg-parchment border-3 border-border-dark p-4 text-center">
            <p className="text-xs text-text-pixel/60 italic">
              "Return to Town Square" link available after login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}