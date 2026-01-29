import { WoodenFrame } from '../WoodenFrame';
import { PixelButton } from '../PixelButton';
import { PushPin } from '../PushPin';
import { Heart, Search, UserPlus, Star, Home } from 'lucide-react';

interface LandingPageProps {
  onStart?: () => void;
  onLogin?: () => void;
}

export function LandingPage({ onStart, onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ 
      backgroundColor: '#76c442',
      backgroundImage: 'linear-gradient(45deg, #63a632 25%, transparent 25%), linear-gradient(-45deg, #63a632 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #63a632 75%), linear-gradient(-45deg, transparent 75%, #63a632 75%)',
      backgroundSize: '40px 40px',
      backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px'
    }}>
      {/* Header - Wood Grain */}
      <header className="sticky top-0 z-50 w-full wood-grain border-b-4 border-wood-dark px-4 py-3" style={{
        boxShadow: '0 6px 0 #4A3B32, 0 8px 12px rgba(0, 0, 0, 0.4)'
      }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-orange border-3 border-border-dark flex items-center justify-center" style={{
              boxShadow: '2px 2px 0 #4A3B32'
            }}>
              <Home className="w-7 h-7 text-parchment" />
            </div>
            <h1 className="text-parchment font-pixel text-3xl md:text-4xl tracking-wide drop-shadow-md">Peerzee Village</h1>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-md w-full px-0 md:px-4">
            <div className="flex w-full items-center bg-[#A07048] border-4 border-wood-dark" style={{
              boxShadow: '2px 2px 0 #4A3B32'
            }}>
              <div className="pl-3 text-parchment flex items-center">
                <Search className="w-6 h-6" />
              </div>
              <input 
                className="w-full bg-transparent border-none font-pixel text-xl text-parchment placeholder:text-parchment/70 focus:ring-0 py-2 px-3" 
                placeholder="Search the village..." 
                type="text"
                readOnly
              />
            </div>
          </div>
          
          {/* Nav Links */}
          <nav className="flex items-center gap-4">
            <button className="bg-[#A07048] hover:bg-[#b08055] text-parchment px-4 py-1 font-pixel text-2xl border-4 border-wood-dark hover:translate-y-[2px] transition-all duration-75 min-w-[100px]" style={{
              boxShadow: '2px 2px 0 #4A3B32'
            }}>
              Tavern
            </button>
            <button className="bg-[#A07048] hover:bg-[#b08055] text-parchment px-4 py-1 font-pixel text-2xl border-4 border-wood-dark hover:translate-y-[2px] transition-all duration-75 min-w-[100px]" style={{
              boxShadow: '2px 2px 0 #4A3B32'
            }}>
              Market
            </button>
          </nav>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4 md:p-10">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar: Signpost */}
          <aside className="lg:col-span-3 hidden lg:flex flex-col items-center mt-10">
            {/* Pole Top */}
            <div className="w-4 h-4 bg-wood-dark mb-[-4px] rounded-t-full"></div>
            {/* Pole */}
            <div className="w-6 bg-[#8B5E3C] border-x-4 border-wood-dark h-[400px] flex flex-col items-center gap-8 py-8 relative">
              {/* Sign 1: Village Map - pointing left */}
              <a className="absolute top-8 -left-6 w-52 group cursor-pointer" href="#">
                <div className="relative bg-[#A07048] border-4 border-wood-dark px-4 py-3 hover:scale-105 transition-transform" style={{
                  boxShadow: '4px 4px 0 #4A3B32'
                }}>
                  {/* Nails */}
                  <div className="absolute top-1/2 left-2 w-2 h-2 bg-wood-dark rounded-full -translate-y-1/2 opacity-50"></div>
                  <div className="absolute top-1/2 right-2 w-2 h-2 bg-wood-dark rounded-full -translate-y-1/2 opacity-50"></div>
                  <span className="block text-center text-parchment font-pixel text-2xl uppercase tracking-wider drop-shadow-sm">Village Map</span>
                </div>
                {/* Arrow Tip - pointing right */}
                <div className="absolute top-1/2 -right-4 w-0 h-0 border-t-[14px] border-t-transparent border-l-[16px] border-l-wood-dark border-b-[14px] border-b-transparent -translate-y-1/2"></div>
              </a>
              
              {/* Sign 2: My Homestead - pointing right */}
              <a className="absolute top-32 -right-6 w-52 group cursor-pointer" href="#">
                {/* Arrow Tip - pointing left */}
                <div className="absolute top-1/2 -left-4 w-0 h-0 border-t-[14px] border-t-transparent border-r-[16px] border-r-wood-dark border-b-[14px] border-b-transparent -translate-y-1/2 z-10"></div>
                <div className="relative bg-[#A07048] border-4 border-wood-dark px-4 py-3 hover:scale-105 transition-transform" style={{
                  boxShadow: '4px 4px 0 #4A3B32'
                }}>
                  {/* Nails */}
                  <div className="absolute top-1/2 left-2 w-2 h-2 bg-wood-dark rounded-full -translate-y-1/2 opacity-50"></div>
                  <div className="absolute top-1/2 right-2 w-2 h-2 bg-wood-dark rounded-full -translate-y-1/2 opacity-50"></div>
                  <span className="block text-center text-parchment font-pixel text-2xl uppercase tracking-wider drop-shadow-sm">My Homestead</span>
                </div>
              </a>
            </div>
            {/* Base */}
            <div className="w-16 h-8 wood-grain border-4 border-wood-dark rounded-full mt-[-10px] relative z-10"></div>
          </aside>
          
          {/* Center: Bulletin Board */}
          <section className="lg:col-span-6 flex flex-col">
            {/* Board Frame */}
            <div className="wood-grain p-3 border-4 border-wood-dark rounded-sm" style={{
              boxShadow: '8px 8px 0 #4A3B32'
            }}>
              {/* Cork Interior */}
              <div className="cork-pattern border-4 border-[#bcaaa4] min-h-[500px] md:min-h-[600px] relative p-6 flex items-center justify-center overflow-hidden" style={{
                boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.2)'
              }}>
                {/* Corner Screws */}
                <div className="absolute top-2 left-2 w-4 h-4 bg-gray-400 border-2 border-gray-600 rounded-full flex items-center justify-center">
                  <div className="w-full h-0.5 bg-gray-600 rotate-45"></div>
                </div>
                <div className="absolute top-2 right-2 w-4 h-4 bg-gray-400 border-2 border-gray-600 rounded-full flex items-center justify-center">
                  <div className="w-full h-0.5 bg-gray-600 rotate-45"></div>
                </div>
                <div className="absolute bottom-2 left-2 w-4 h-4 bg-gray-400 border-2 border-gray-600 rounded-full flex items-center justify-center">
                  <div className="w-full h-0.5 bg-gray-600 rotate-45"></div>
                </div>
                <div className="absolute bottom-2 right-2 w-4 h-4 bg-gray-400 border-2 border-gray-600 rounded-full flex items-center justify-center">
                  <div className="w-full h-0.5 bg-gray-600 rotate-45"></div>
                </div>
                
                {/* Hero Parchment Note */}
                <div className="bg-parchment max-w-md w-full p-8 border-4 border-wood-dark lg:rotate-1 relative flex flex-col items-center text-center gap-6" style={{
                  boxShadow: '4px 4px 0 #4A3B32'
                }}>
                  {/* Push Pin */}
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary-red border-4 border-wood-dark z-20 shadow-md">
                    <div className="absolute top-1 left-2 w-2 h-2 bg-white/40 rounded-full"></div>
                  </div>
                  
                  {/* Content */}
                  <div className="mt-4 space-y-2">
                    <h2 className="font-pixel text-6xl md:text-7xl font-bold leading-[0.85] text-wood-dark drop-shadow-sm">
                      FIND YOUR<br/>
                      <span className="text-[#f48c25]">PLAYER 2</span>
                    </h2>
                    <p className="text-2xl text-wood-dark/80 font-medium pt-2 leading-tight">
                      Join the quest for connection in Peerzee Village.
                    </p>
                  </div>
                  
                  {/* Hearts placeholder */}
                  <div className="w-full h-32 bg-[#A07048]/20 border-2 border-wood-dark/20 flex items-center justify-center overflow-hidden my-2">
                    <Heart className="w-16 h-16 text-[#f48c25] fill-[#f48c25] animate-bounce" />
                    <Heart className="w-12 h-12 text-[#f48c25]/60 fill-[#f48c25]/60 animate-bounce ml-[-10px]" style={{ animationDelay: '100ms' }} />
                  </div>
                  
                  {/* CTA Button */}
                  <button 
                    onClick={onStart}
                    className="w-full bg-[#f48c25] hover:bg-[#ff9d42] text-wood-dark border-4 border-wood-dark font-pixel text-4xl font-bold py-3 px-6 active:translate-y-1 transition-all relative overflow-hidden group"
                    style={{
                      boxShadow: '6px 6px 0 #4A3B32',
                      animation: 'pixel-pulse 2s infinite ease-in-out'
                    }}
                  >
                    <span className="relative z-10">PRESS START</span>
                  </button>
                </div>
                
                {/* Random Post-it notes */}
                <div className="absolute top-10 left-10 w-24 h-24 bg-yellow-200 border-2 border-wood-dark shadow-md -rotate-6 hidden md:flex items-center justify-center p-2 text-center leading-none">
                  <span className="text-lg font-pixel">LFG: Raid</span>
                </div>
                <div className="absolute bottom-20 right-10 w-28 h-24 bg-pink-200 border-2 border-wood-dark shadow-md rotate-3 hidden md:flex items-center justify-center p-2 text-center leading-none">
                  <span className="text-lg font-pixel">Potion Sale!</span>
                </div>
              </div>
            </div>
          </section>
          
          {/* Right Sidebar: Town Crier Scroll */}
          <aside className="lg:col-span-3 flex flex-col items-center w-full">
            <div className="w-full max-w-sm relative mt-4">
              {/* Scroll Top Roll */}
              <div className="h-10 bg-[#A07048] border-4 border-wood-dark rounded-full relative z-20 flex items-center justify-center" style={{
                boxShadow: '2px 2px 0 #4A3B32'
              }}>
                <div className="w-[90%] h-1 bg-wood-dark/20 rounded-full"></div>
              </div>
              
              {/* Scroll Body */}
              <div className="bg-parchment border-x-4 border-wood-dark mx-4 pt-8 pb-4 px-4 min-h-[400px] mt-[-20px] relative z-10 shadow-lg" style={{
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)',
                backgroundSize: '100% 24px'
              }}>
                <div className="text-center border-b-4 border-wood-dark/20 pb-2 mb-4">
                  <h3 className="font-pixel text-4xl font-bold text-wood-dark">TOWN CRIER</h3>
                  <p className="text-xs text-wood-dark/60 uppercase tracking-widest mt-1">Latest Updates</p>
                </div>
                
                {/* Activity List */}
                <div className="space-y-4">
                  {/* Item 1 */}
                  <div className="flex gap-3 items-start">
                    <div className="bg-[#f48c25]/20 p-1 rounded-sm border-2 border-wood-dark/20 shrink-0">
                      <UserPlus className="w-5 h-5 text-wood-dark" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-wood-dark leading-tight">User123 joined the party!</p>
                      <p className="text-xs text-wood-dark/50">2 mins ago</p>
                    </div>
                  </div>
                  <div className="h-0.5 w-full bg-wood-dark/10"></div>
                  
                  {/* Item 2 */}
                  <div className="flex gap-3 items-start">
                    <div className="bg-red-100 p-1 rounded-sm border-2 border-wood-dark/20 shrink-0">
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-wood-dark leading-tight">New match found!</p>
                      <p className="text-xs text-wood-dark/50">15 mins ago</p>
                    </div>
                  </div>
                  <div className="h-0.5 w-full bg-wood-dark/10"></div>
                  
                  {/* Item 3 */}
                  <div className="flex gap-3 items-start">
                    <div className="bg-yellow-100 p-1 rounded-sm border-2 border-wood-dark/20 shrink-0">
                      <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-wood-dark leading-tight">Quest updated: "First Date"</p>
                      <p className="text-xs text-wood-dark/50">1 hour ago</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 text-center">
                  <button className="font-pixel text-xl underline decoration-2 decoration-[#f48c25] underline-offset-2 hover:text-[#f48c25] transition-colors">
                    View All
                  </button>
                </div>
              </div>
              
              {/* Scroll Bottom Roll */}
              <div className="h-10 bg-[#A07048] border-4 border-wood-dark rounded-full relative z-20 mt-[-20px] flex items-center justify-center" style={{
                boxShadow: '2px 2px 0 #4A3B32'
              }}>
                <div className="w-[90%] h-1 bg-wood-dark/20 rounded-full"></div>
              </div>
            </div>
            
            {/* Mobile Only Nav */}
            <div className="lg:hidden w-full max-w-sm mt-8 flex flex-col gap-3">
              <button className="w-full bg-[#A07048] text-parchment border-4 border-wood-dark py-2 font-pixel text-2xl" style={{
                boxShadow: '4px 4px 0 #4A3B32'
              }}>
                VILLAGE MAP
              </button>
              <button className="w-full bg-[#A07048] text-parchment border-4 border-wood-dark py-2 font-pixel text-2xl" style={{
                boxShadow: '4px 4px 0 #4A3B32'
              }}>
                MY HOMESTEAD
              </button>
            </div>
          </aside>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="wood-grain border-t-4 border-wood-dark py-8 px-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-parchment/80 text-sm">
          <p>© 2024 Peerzee Village. All rights reserved.</p>
          <div className="flex gap-6">
            <a className="hover:text-white hover:underline" href="#">Terms of Service</a>
            <a className="hover:text-white hover:underline" href="#">Privacy Policy</a>
            <a className="hover:text-white hover:underline" href="#">Support Scroll</a>
          </div>
        </div>
      </footer>
      
      <style jsx>{`
        @keyframes pixel-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}