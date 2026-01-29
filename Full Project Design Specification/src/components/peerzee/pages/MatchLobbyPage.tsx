import { useState } from 'react';
import { VillageHeader } from '../VillageHeader';
import { WoodenFrame } from '../WoodenFrame';
import { PixelButton } from '../PixelButton';
import { Video, Phone, Zap, Users } from 'lucide-react';

export function MatchLobbyPage() {
  const [selectedMode, setSelectedMode] = useState<'video' | 'voice' | null>(null);
  const [searching, setSearching] = useState(false);
  
  const handleStartSearch = () => {
    setSearching(true);
    // Simulate search
    setTimeout(() => {
      setSearching(false);
    }, 3000);
  };
  
  return (
    <div className="min-h-screen grass-dots flex flex-col">
      <VillageHeader
        title="PEERZEE ARCADE"
        subtitle="MULTIPLAYER LOBBY"
        userLevel={5}
      />
      
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <WoodenFrame className="wooden-frame">
            <div className="p-12">
              {/* Arcade Header */}
              <div className="text-center mb-8">
                <div className="inline-block bg-gradient-to-b from-primary-orange to-primary-red border-4 border-border-dark p-4 mb-4">
                  <div className="w-20 h-20 bg-parchment border-3 border-border-dark flex items-center justify-center">
                    <span className="text-5xl">🕹️</span>
                  </div>
                </div>
                <h1 className="font-pixel text-5xl text-text-pixel mb-2 tracking-wider">
                  ARCADE CABINET
                </h1>
                <p className="font-pixel text-xl text-text-pixel/70">
                  SELECT YOUR GAME MODE
                </p>
              </div>
              
              <div className="w-full h-1 bg-border-dark mb-8" />
              
              {!searching ? (
                <>
                  {/* Mode Selection */}
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Video Mode */}
                    <button
                      onClick={() => setSelectedMode('video')}
                      className={`group relative transition-all ${
                        selectedMode === 'video'
                          ? 'scale-105'
                          : 'hover:scale-102'
                      }`}
                    >
                      <div className={`border-4 p-6 transition-colors ${
                        selectedMode === 'video'
                          ? 'border-primary-orange bg-primary-orange/10'
                          : 'border-border-dark bg-parchment-dark hover:bg-parchment'
                      }`}>
                        <div className="w-16 h-16 bg-accent-blue border-3 border-border-dark mx-auto mb-4 flex items-center justify-center">
                          <Video className="w-10 h-10 text-parchment" />
                        </div>
                        <h3 className="font-pixel text-2xl text-text-pixel mb-2">VIDEO MODE</h3>
                        <p className="text-sm text-text-pixel/70 mb-4">
                          Face-to-face pixel chat with live video!
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs text-text-pixel/60">
                          <Users className="w-4 h-4" />
                          <span className="font-mono">124 ONLINE</span>
                        </div>
                      </div>
                      
                      {selectedMode === 'video' && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-orange border-2 border-border-dark rounded-full flex items-center justify-center">
                          <span className="text-parchment">✓</span>
                        </div>
                      )}
                    </button>
                    
                    {/* Voice Mode */}
                    <button
                      onClick={() => setSelectedMode('voice')}
                      className={`group relative transition-all ${
                        selectedMode === 'voice'
                          ? 'scale-105'
                          : 'hover:scale-102'
                      }`}
                    >
                      <div className={`border-4 p-6 transition-colors ${
                        selectedMode === 'voice'
                          ? 'border-primary-orange bg-primary-orange/10'
                          : 'border-border-dark bg-parchment-dark hover:bg-parchment'
                      }`}>
                        <div className="w-16 h-16 bg-landscape-green border-3 border-border-dark mx-auto mb-4 flex items-center justify-center">
                          <Phone className="w-10 h-10 text-parchment" />
                        </div>
                        <h3 className="font-pixel text-2xl text-text-pixel mb-2">VOICE MODE</h3>
                        <p className="text-sm text-text-pixel/70 mb-4">
                          Audio-only adventure for mystery vibes!
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs text-text-pixel/60">
                          <Users className="w-4 h-4" />
                          <span className="font-mono">87 ONLINE</span>
                        </div>
                      </div>
                      
                      {selectedMode === 'voice' && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-orange border-2 border-border-dark rounded-full flex items-center justify-center">
                          <span className="text-parchment">✓</span>
                        </div>
                      )}
                    </button>
                  </div>
                  
                  {/* Info Cards */}
                  <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white border-2 border-border-dark p-4 text-center">
                      <div className="font-pixel text-3xl text-primary-orange mb-2">3:00</div>
                      <div className="text-xs font-medium">ROUND TIME</div>
                    </div>
                    <div className="bg-white border-2 border-border-dark p-4 text-center">
                      <div className="font-pixel text-3xl text-accent-pink mb-2">∞</div>
                      <div className="text-xs font-medium">DAILY LIMIT</div>
                    </div>
                    <div className="bg-white border-2 border-border-dark p-4 text-center">
                      <div className="font-pixel text-3xl text-landscape-green mb-2">24/7</div>
                      <div className="text-xs font-medium">AVAILABILITY</div>
                    </div>
                  </div>
                  
                  {/* Start Button */}
                  <PixelButton
                    variant="success"
                    size="lg"
                    className="w-full"
                    disabled={!selectedMode}
                    onClick={handleStartSearch}
                  >
                    <Zap className="w-6 h-6" />
                    {selectedMode ? `START ${selectedMode.toUpperCase()} MATCH` : 'SELECT A MODE FIRST'}
                  </PixelButton>
                  
                  {/* Rules */}
                  <div className="mt-6 bg-parchment-dark border-2 border-border-dark p-4">
                    <h4 className="font-pixel text-sm text-text-pixel mb-2">⚠️ ARCADE RULES</h4>
                    <ul className="text-xs text-text-pixel/70 space-y-1">
                      <li>• Be respectful and kind to fellow adventurers</li>
                      <li>• Each match lasts 3 minutes maximum</li>
                      <li>• You can skip or end a match anytime</li>
                      <li>• Report inappropriate behavior immediately</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  {/* Searching Animation */}
                  <div className="text-center py-12">
                    <div className="w-32 h-32 bg-wood-dark border-4 border-border-dark mx-auto mb-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-orange/30 to-transparent animate-pulse" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin">
                          <Zap className="w-16 h-16 text-accent-yellow" />
                        </div>
                      </div>
                    </div>
                    
                    <h2 className="font-pixel text-3xl text-text-pixel mb-4 animate-pulse">
                      SEARCHING FOR PLAYER 2...
                    </h2>
                    
                    <div className="max-w-md mx-auto mb-6">
                      <div className="h-3 bg-wood-dark border-2 border-border-dark overflow-hidden">
                        <div className="h-full bg-landscape-green animate-pulse" style={{ width: '60%' }} />
                      </div>
                    </div>
                    
                    <p className="text-text-pixel/70 mb-6">
                      Looking for adventurers in your area...
                    </p>
                    
                    <PixelButton
                      variant="secondary"
                      onClick={() => setSearching(false)}
                    >
                      CANCEL SEARCH
                    </PixelButton>
                  </div>
                </>
              )}
            </div>
          </WoodenFrame>
        </div>
      </div>
    </div>
  );
}
