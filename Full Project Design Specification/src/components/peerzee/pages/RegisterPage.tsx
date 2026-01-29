import { useState } from 'react';
import { WoodenFrame } from '../WoodenFrame';
import { CarvedInput } from '../CarvedInput';
import { CarvedTextarea } from '../CarvedTextarea';
import { PixelButton } from '../PixelButton';
import { PushPin } from '../PushPin';
import { User, Home } from 'lucide-react';

interface RegisterPageProps {
  onRegister?: (data: { name: string; email: string; password: string; bio: string; class: string }) => void;
  onLogin?: () => void;
  onBack?: () => void;
}

export function RegisterPage({ onRegister, onLogin, onBack }: RegisterPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [selectedClass, setSelectedClass] = useState('Villager');
  
  const classes = ['Villager', 'Adventurer', 'Merchant', 'Artisan', 'Scholar'];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister?.({ name, email, password, bio, class: selectedClass });
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
            <p className="text-xs text-parchment-dark font-mono uppercase tracking-widest">GATEWAY TO ADVENTURE</p>
          </div>
        </div>
        
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
          <span className="text-parchment-dark text-sm">Already a resident?</span>
          <button
            onClick={onLogin}
            className="pixel-btn pixel-btn-secondary px-4 py-2 font-pixel text-sm"
          >
            LOGIN
          </button>
        </div>
      </div>
      
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 mt-20">
        {/* Registration Form */}
        <WoodenFrame>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
            <PushPin color="red" />
          </div>
          
          <div className="p-8">
            <h2 className="font-pixel text-3xl text-center text-text-pixel mb-2">REGISTRATION FORM</h2>
            <p className="text-center text-sm text-text-pixel/70 mb-6 uppercase tracking-wide">
              OFFICIAL CENSUS DOCUMENT
            </p>
            <div className="w-full h-0.5 bg-text-pixel mb-8" />
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <CarvedInput
                label="NAME [STR]"
                pixelLabel
                type="text"
                placeholder="Sir Codes-a-Lot"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              
              <div className="flex flex-col gap-2">
                <label className="font-pixel text-xl text-text-pixel uppercase tracking-wide">
                  CLASS [INT]
                </label>
                <div className="relative">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="carved-input w-full appearance-none cursor-pointer"
                  >
                    {classes.map((cls) => (
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
                placeholder="hero@peerzee.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              
              <CarvedInput
                label="SECRET KEY [DEX]"
                pixelLabel
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              
              <CarvedTextarea
                label="BIO [CHA]"
                pixelLabel
                placeholder="Tell us your tale..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={200}
              />
              <p className="text-xs text-right text-text-pixel/50">{bio.length}/200</p>
              
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 w-5 h-5 border-3 border-border-dark"
                  required
                />
                <label htmlFor="terms" className="text-sm">
                  I swear fealty to the{' '}
                  <span className="text-primary-orange font-medium cursor-pointer hover:underline">
                    Village Laws
                  </span>
                </label>
              </div>
              
              <PixelButton
                type="submit"
                variant="success"
                size="lg"
                className="w-full"
              >
                CREATE CHARACTER
              </PixelButton>
            </form>
          </div>
        </WoodenFrame>
        
        {/* Character Preview */}
        <div className="flex flex-col gap-6">
          <WoodenFrame className="flex-1">
            <div className="p-8 flex flex-col items-center justify-center h-full">
              <div className="w-48 h-48 bg-gradient-to-b from-accent-blue to-accent-blue/70 border-4 border-border-dark mb-4 flex items-center justify-center">
                <User className="w-24 h-24 text-parchment" />
              </div>
              
              <div className="w-full bg-landscape-green border-3 border-border-dark px-6 py-3 mb-2">
                <p className="font-pixel text-xl text-center text-parchment">NOVICE</p>
                <p className="text-center text-parchment-dark text-sm">LEVEL 1</p>
              </div>
              
              {name && (
                <div className="mt-4 text-center">
                  <p className="font-pixel text-2xl text-text-pixel">{name}</p>
                  <p className="text-sm text-text-pixel/70">{selectedClass}</p>
                </div>
              )}
            </div>
          </WoodenFrame>
          
          <div className="bg-parchment border-3 border-border-dark p-4 text-center">
            <p className="text-xs text-text-pixel/60 italic">
              "Return to Town Square" link will appear after registration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}