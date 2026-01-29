import { VillageHeader } from '../VillageHeader';
import { WoodenFrame } from '../WoodenFrame';
import { PixelButton } from '../PixelButton';
import { MapPin, Briefcase, Heart, Star, MessageSquare, Gift, X } from 'lucide-react';

interface UserProfileProps {
  userId?: string;
}

export function UserProfilePage({ userId = '1' }: UserProfileProps) {
  const user = {
    name: 'Sarah',
    age: 24,
    level: 24,
    class: 'Graphic Designer',
    location: 'Stardew Valley',
    distance: '2 km away',
    bio: 'Looking for a Player 2 to join my party. Love coffee runs, hiking, and re-watching 90s anime. Let\'s go on an adventure!',
    stats: {
      charm: 85,
      wit: 92,
      stamina: 70
    },
    interests: ['☕ Coffee Addict', '🎮 Gamer', '📚 Book Worm', '🐱 Cat Lover', '🌙 Night Owl'],
    photos: [
      'https://images.unsplash.com/photo-1614436201459-156d322d38c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      'https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      'https://images.unsplash.com/photo-1614436201459-156d322d38c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    ],
    compatibility: 94
  };
  
  return (
    <div className="min-h-screen grass-dots flex flex-col">
      <VillageHeader
        title="PEERZEE"
        subtitle="INSPECTING PLAYER"
        userLevel={5}
      />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button className="pixel-btn pixel-btn-secondary mb-6 px-4 py-2 font-pixel text-sm">
            ← BACK TO DISCOVER
          </button>
          
          <div className="grid lg:grid-cols-[400px_1fr] gap-6">
            {/* Hero Card (Read-Only) */}
            <div>
              <WoodenFrame>
                <div className="p-6">
                  {/* Header */}
                  <div className="mb-6 text-center">
                    <h2 className="font-pixel text-2xl text-text-pixel mb-1">PLAYER PROFILE</h2>
                    <div className="inline-block bg-landscape-green border-2 border-border-dark px-3 py-1">
                      <span className="font-pixel text-sm text-parchment">ONLINE</span>
                    </div>
                  </div>
                  
                  {/* Avatar */}
                  <div className="relative mb-6">
                    <div className="aspect-square border-4 border-border-dark overflow-hidden">
                      <img
                        src={user.photos[0]}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-landscape-green border-3 border-border-dark px-6 py-2">
                      <p className="font-pixel text-xl text-parchment text-center">LVL {user.level}</p>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="space-y-4 mt-8">
                    <div className="text-center">
                      <h3 className="font-pixel text-3xl text-text-pixel mb-1">{user.name}</h3>
                      <p className="text-text-pixel/70">Age {user.age}</p>
                    </div>
                    
                    <div className="bg-parchment-dark border-2 border-border-dark p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4" />
                        <span className="font-pixel text-sm">CLASS</span>
                      </div>
                      <p className="text-sm">{user.class}</p>
                    </div>
                    
                    <div className="bg-parchment-dark border-2 border-border-dark p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="font-pixel text-sm">REGION</span>
                      </div>
                      <p className="text-sm">{user.location}</p>
                      <p className="text-xs text-text-pixel/60 mt-1">{user.distance}</p>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <div className="bg-white border-2 border-border-dark p-3 text-center">
                      <Heart className="w-5 h-5 text-accent-pink mx-auto mb-1" />
                      <div className="font-pixel text-xl text-accent-pink">{user.stats.charm}</div>
                      <div className="text-xs text-text-pixel/60">CHARM</div>
                    </div>
                    <div className="bg-white border-2 border-border-dark p-3 text-center">
                      <Star className="w-5 h-5 text-accent-blue mx-auto mb-1" />
                      <div className="font-pixel text-xl text-accent-blue">{user.stats.wit}</div>
                      <div className="text-xs text-text-pixel/60">WIT</div>
                    </div>
                    <div className="bg-white border-2 border-border-dark p-3 text-center">
                      <span className="text-xl mx-auto mb-1 block">⚡</span>
                      <div className="font-pixel text-xl text-landscape-green">{user.stats.stamina}</div>
                      <div className="text-xs text-text-pixel/60">STAMINA</div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-6 space-y-3">
                    <PixelButton
                      variant="primary"
                      size="lg"
                      className="w-full"
                      icon={<Heart className="w-5 h-5 fill-current" />}
                    >
                      IT'S A MATCH!
                    </PixelButton>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <PixelButton
                        variant="success"
                        icon={<MessageSquare className="w-5 h-5" />}
                      >
                        MESSAGE
                      </PixelButton>
                      <PixelButton
                        variant="wood"
                        icon={<Gift className="w-5 h-5" />}
                      >
                        SEND GIFT
                      </PixelButton>
                    </div>
                    
                    <PixelButton
                      variant="secondary"
                      className="w-full"
                      icon={<X className="w-5 h-5" />}
                    >
                      SKIP
                    </PixelButton>
                  </div>
                </div>
              </WoodenFrame>
            </div>
            
            {/* Main Content */}
            <div className="space-y-6">
              {/* Compatibility */}
              <WoodenFrame>
                <div className="p-6">
                  <h3 className="font-pixel text-2xl text-text-pixel mb-4">COMPATIBILITY XP</h3>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1">
                      <div className="h-8 bg-wood-dark border-3 border-border-dark overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-accent-pink via-accent-pink to-primary-red flex items-center justify-end pr-2"
                          style={{ width: `${user.compatibility}%` }}
                        >
                          <span className="font-pixel text-parchment text-sm">{user.compatibility}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-parchment-dark border-2 border-border-dark p-4">
                    <p className="text-xs text-text-pixel/70">
                      ⭐ High compatibility! You share {Math.floor(user.interests.length * 0.6)} interests and similar play styles.
                    </p>
                  </div>
                </div>
              </WoodenFrame>
              
              {/* Photos */}
              <WoodenFrame>
                <div className="p-6">
                  <h3 className="font-pixel text-2xl text-text-pixel mb-4">PHOTO GALLERY</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {user.photos.map((photo, i) => (
                      <div key={i} className="aspect-[3/4] border-4 border-border-dark overflow-hidden group cursor-pointer relative">
                        <img 
                          src={photo} 
                          alt={`Photo ${i + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <span className="font-pixel text-parchment text-sm">VIEW</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </WoodenFrame>
              
              {/* Bio */}
              <WoodenFrame>
                <div className="p-6">
                  <h3 className="font-pixel text-2xl text-text-pixel mb-4">PLAYER BIO</h3>
                  
                  <div className="bg-parchment-dark border-3 border-border-dark p-6">
                    <p className="text-sm leading-relaxed italic mb-4">
                      &ldquo;{user.bio}&rdquo;
                    </p>
                    
                    <div className="pt-4 border-t border-border-dark">
                      <p className="text-xs text-text-pixel/60 mb-2">Looking for a</p>
                      <span className="bg-primary-orange text-parchment px-3 py-1 text-sm font-pixel">
                        Player 2
                      </span>
                    </div>
                  </div>
                </div>
              </WoodenFrame>
              
              {/* Interests */}
              <WoodenFrame>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-pixel text-2xl text-text-pixel">INVENTORY (INTERESTS)</h3>
                    <span className="font-pixel text-sm text-primary-orange">
                      {user.interests.length} ITEMS
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest, i) => (
                      <div key={i} className="bg-white border-3 border-border-dark px-4 py-2 font-medium">
                        {interest}
                      </div>
                    ))}
                  </div>
                </div>
              </WoodenFrame>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
