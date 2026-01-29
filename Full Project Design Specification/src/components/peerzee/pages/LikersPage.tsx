import { VillageHeader } from '../VillageHeader';
import { WoodenFrame } from '../WoodenFrame';
import { PixelButton } from '../PixelButton';
import { Mail, Heart, Lock } from 'lucide-react';

interface Liker {
  id: number;
  name: string;
  age: number;
  location: string;
  image: string;
  isBlurred: boolean;
  isPremium?: boolean;
}

const mockLikers: Liker[] = [
  {
    id: 1,
    name: 'Mystery Admirer #1',
    age: 25,
    location: 'Nearby',
    image: 'https://images.unsplash.com/photo-1614436201459-156d322d38c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    isBlurred: true
  },
  {
    id: 2,
    name: 'Mystery Admirer #2',
    age: 28,
    location: 'Nearby',
    image: 'https://images.unsplash.com/photo-1762708590808-c453c0e4fb0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    isBlurred: true
  },
  {
    id: 3,
    name: 'Mystery Admirer #3',
    age: 26,
    location: 'Nearby',
    image: 'https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    isBlurred: true,
    isPremium: true
  },
  {
    id: 4,
    name: 'Mystery Admirer #4',
    age: 24,
    location: 'Nearby',
    image: 'https://images.unsplash.com/photo-1614436201459-156d322d38c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    isBlurred: true
  }
];

export function LikersPage() {
  return (
    <div className="min-h-screen grass-dots flex flex-col">
      <VillageHeader
        title="PEERZEE"
        subtitle="SECRET ADMIRER MAIL"
        userLevel={5}
      />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <WoodenFrame>
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-accent-pink border-3 border-border-dark flex items-center justify-center relative">
                  <Mail className="w-10 h-10 text-parchment" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-red border-2 border-parchment rounded-full flex items-center justify-center">
                    <span className="font-pixel text-parchment text-sm">{mockLikers.length}</span>
                  </div>
                </div>
                <div>
                  <h1 className="font-pixel text-4xl text-text-pixel">SECRET FAN MAIL</h1>
                  <p className="text-text-pixel/70 uppercase tracking-wide text-sm">
                    {mockLikers.length} Adventurers sent you hearts!
                  </p>
                </div>
              </div>
              
              <div className="w-full h-1 bg-border-dark mb-8" />
              
              {/* Premium Upsell Banner */}
              <div className="bg-gradient-to-r from-accent-yellow/30 to-primary-orange/30 border-3 border-border-dark p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent-yellow border-3 border-border-dark flex items-center justify-center">
                      <Lock className="w-7 h-7 text-text-pixel" />
                    </div>
                    <div>
                      <h3 className="font-pixel text-xl text-text-pixel mb-1">UNLOCK PREMIUM LETTERS</h3>
                      <p className="text-sm text-text-pixel/80">
                        See who likes you and match instantly with Premium Village Pass!
                      </p>
                    </div>
                  </div>
                  <PixelButton variant="success" size="md">
                    UPGRADE NOW
                  </PixelButton>
                </div>
              </div>
              
              {/* Grid of Likers */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {mockLikers.map((liker) => (
                  <div key={liker.id} className="relative group">
                    <div className="bg-white border-3 border-border-dark overflow-hidden hover:border-primary-orange transition-colors cursor-pointer">
                      {/* Envelope/Polaroid style */}
                      <div className="aspect-[3/4] relative overflow-hidden bg-wood-dark">
                        <img
                          src={liker.image}
                          alt={liker.name}
                          className={`w-full h-full object-cover ${liker.isBlurred ? 'pixel-blur' : ''}`}
                        />
                        
                        {liker.isBlurred && (
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                            <Lock className="w-12 h-12 text-parchment mb-2" />
                            <span className="font-pixel text-parchment">LOCKED</span>
                          </div>
                        )}
                        
                        {liker.isPremium && (
                          <div className="absolute top-2 right-2 bg-accent-yellow border-2 border-border-dark px-2 py-1">
                            <span className="font-pixel text-xs text-text-pixel">★ SUPER</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="p-3 bg-parchment border-t-3 border-border-dark">
                        <p className="font-pixel text-sm text-text-pixel truncate">{liker.name}</p>
                        <p className="text-xs text-text-pixel/60">{liker.age} • {liker.location}</p>
                      </div>
                      
                      {/* Heart indicator */}
                      <div className="absolute -top-3 -left-3 w-10 h-10 bg-accent-pink border-2 border-border-dark rounded-full flex items-center justify-center shadow-lg">
                        <Heart className="w-5 h-5 text-parchment fill-parchment" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Bottom Info */}
              <div className="mt-8 grid md:grid-cols-2 gap-4">
                <div className="bg-parchment-dark border-2 border-border-dark p-4">
                  <h4 className="font-pixel text-sm text-text-pixel mb-2">💡 TIP</h4>
                  <p className="text-xs text-text-pixel/70">
                    Keep swiping in Discover mode! The more you explore, the more matches you'll get.
                  </p>
                </div>
                <div className="bg-parchment-dark border-2 border-border-dark p-4">
                  <h4 className="font-pixel text-sm text-text-pixel mb-2">❓ HOW IT WORKS</h4>
                  <p className="text-xs text-text-pixel/70">
                    When someone likes you, they appear here. Match with them by liking them back!
                  </p>
                </div>
              </div>
            </div>
          </WoodenFrame>
        </div>
      </div>
    </div>
  );
}
