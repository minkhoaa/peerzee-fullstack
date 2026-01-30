import { Monitor } from 'lucide-react';

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-retro-bg flex items-center justify-center p-4">
      {/* Decorative Pixel Corner Elements */}
      <div className="fixed top-4 left-4 w-16 h-16 bg-pixel-pink border-3 border-cocoa rounded-lg shadow-pixel opacity-50" />
      <div className="fixed top-4 right-4 w-12 h-12 bg-pixel-blue border-3 border-cocoa rounded-lg shadow-pixel-sm opacity-50" />
      <div className="fixed bottom-4 left-4 w-12 h-12 bg-pixel-green border-3 border-cocoa rounded-lg shadow-pixel-sm opacity-50" />
      <div className="fixed bottom-4 right-4 w-16 h-16 bg-pixel-yellow border-3 border-cocoa rounded-lg shadow-pixel opacity-50" />
      
      <div className="w-full max-w-5xl min-h-[600px] bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel-lg overflow-hidden flex flex-col lg:flex-row">
        {/* Left Panel - Game Start Screen (Now Green) */}
        <div className="w-full lg:w-1/2 h-64 lg:h-auto bg-pixel-green border-r-3 border-cocoa relative flex flex-col items-center justify-center p-10 text-center">
          {/* Scanline Effect */}
          <div className="absolute inset-0 scanlines" />
          
          {/* Decorative Pixel Art Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-8 left-8 w-8 h-8 bg-retro-white border-3 border-cocoa rounded" />
            <div className="absolute top-16 right-12 w-6 h-6 bg-pixel-yellow border-2 border-cocoa rounded" />
            <div className="absolute bottom-12 left-16 w-10 h-10 bg-pixel-blue border-3 border-cocoa rounded" />
            <div className="absolute bottom-24 right-8 w-5 h-5 bg-pixel-purple border-2 border-cocoa rounded" />
            <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-retro-white border-2 border-cocoa rounded" />
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Pixel Heart Logo */}
            <div className="mb-8 flex justify-center">
              <div className="w-32 h-32 bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel flex items-center justify-center">
                <Monitor className="w-16 h-16 text-cocoa" strokeWidth={2.5} />
              </div>
            </div>

            <h1 className="font-pixel text-4xl text-cocoa uppercase tracking-widest mb-4">
              PEERZEE
            </h1>
            <p className="font-body text-cocoa font-bold text-lg max-w-md mx-auto">
              Press START to find your Player 2!
            </p>
            
            {/* Pixel Decorative Line */}
            <div className="mt-6 flex justify-center gap-2">
              <div className="w-3 h-3 bg-cocoa rounded-sm" />
              <div className="w-3 h-3 bg-cocoa rounded-sm" />
              <div className="w-3 h-3 bg-cocoa rounded-sm" />
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="w-full lg:w-1/2 bg-retro-paper p-8 lg:p-12 flex flex-col justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
