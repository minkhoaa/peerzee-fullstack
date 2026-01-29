import { useState } from 'react';
import { VillageHeader } from '../VillageHeader';
import { WoodenFrame } from '../WoodenFrame';
import { PixelButton } from '../PixelButton';
import { X, Heart, Star, MapPin, Briefcase, Coffee, Book, User } from 'lucide-react';

interface Profile {
  id: number;
  name: string;
  age: number;
  level: number;
  class: string;
  location: string;
  distance: string;
  quest: string;
  stats: {
    charm: number;
    wit: number;
    stamina: number;
  };
  interests: string[];
  image: string;
}

const mockProfiles: Profile[] = [
  {
    id: 1,
    name: 'Sarah',
    age: 24,
    level: 24,
    class: 'Graphic Designer',
    location: 'Stardew Valley',
    distance: '2 km away',
    quest: 'Looking for someone to join my coffee runs and maybe help me water my pumpkins? 🎃☕',
    stats: { charm: 85, wit: 92, stamina: 70 },
    interests: ['Cat Lover', 'Gamer', 'Coffee Addict', 'Night Owl'],
    image: 'https://images.unsplash.com/photo-1614436201459-156d322d38c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600'
  },
  {
    id: 2,
    name: 'Alex',
    age: 27,
    level: 27,
    class: 'Software Engineer',
    location: 'Pelican Town',
    distance: '5 km away',
    quest: 'Seeking a co-op partner for life\'s quests. Must love dogs and late-night coding sessions! 💻🐕',
    stats: { charm: 78, wit: 95, stamina: 82 },
    interests: ['Dog Person', 'Tech Geek', 'Hiker', 'Foodie'],
    image: 'https://images.unsplash.com/photo-1762708590808-c453c0e4fb0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600'
  },
  {
    id: 3,
    name: 'Emma',
    age: 26,
    level: 26,
    class: 'Teacher',
    location: 'Cindersap Forest',
    distance: '3 km away',
    quest: 'Adventure seeker looking for Player 2! Love hiking, reading, and finding hidden gems. 📚⛰️',
    stats: { charm: 90, wit: 88, stamina: 85 },
    interests: ['Book Worm', 'Adventurer', 'Baker', 'Music Lover'],
    image: 'https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600'
  }
];

export function DiscoverPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  
  const currentProfile = mockProfiles[currentIndex];
  
  const handleSwipe = (swipeDirection: 'left' | 'right') => {
    setDirection(swipeDirection);
    setTimeout(() => {
      setDirection(null);
      setCurrentIndex((prev) => (prev + 1) % mockProfiles.length);
    }, 300);
  };
  
  if (!currentProfile) {
    return (
      <div className="min-h-screen grass-dots flex flex-col">
        <VillageHeader userLevel={5} />
        <div className="flex-1 flex items-center justify-center">
          <WoodenFrame>
            <div className="p-12 text-center">
              <p className="font-pixel text-2xl text-text-pixel">NO MORE ADVENTURERS NEARBY</p>
              <p className="mt-4">Check back later for new arrivals!</p>
            </div>
          </WoodenFrame>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen grass-dots flex flex-col">
      <VillageHeader
        title="PEERZEE"
        subtitle="QUEST BOARD • DISCOVER"
        userLevel={5}
      />
      
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        {/* System Message */}
        <div className="absolute top-20 md:top-24 left-1/2 -translate-x-1/2 z-20 max-w-[90%] md:max-w-none">
          <div className="bg-parchment border-3 border-border-dark px-3 md:px-6 py-2 flex items-center gap-2 shadow-lg">
            <div className="w-6 h-6 bg-accent-blue rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-parchment text-xs">ℹ️</span>
            </div>
            <p className="font-mono text-xs md:text-sm text-text-pixel">
              <span className="font-medium">SYSTEM MESSAGE:</span> A new villager has moved into town! Say hello to {currentProfile.name}.
            </p>
          </div>
        </div>
        
        {/* Character Card */}
        <div className={`relative transition-transform duration-300 ${
          direction === 'left' ? '-translate-x-full rotate-12 opacity-0' :
          direction === 'right' ? 'translate-x-full -rotate-12 opacity-0' : ''
        }`}>
          <div className="w-[340px] sm:w-[400px] md:w-[480px] lg:w-[520px] bg-accent-pink border-4 border-border-dark p-3 shadow-2xl">
            {/* Header */}
            <div className="bg-parchment border-3 border-border-dark px-4 py-2 mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-pixel text-xl md:text-2xl text-text-pixel flex items-center gap-2">
                  {currentProfile.name}
                  <span className="text-accent-pink text-base md:text-lg">♀</span>
                </h2>
                <p className="text-xs text-text-pixel/70">
                  LVL {currentProfile.level} • {currentProfile.class}
                </p>
              </div>
              <button className="w-8 h-8 bg-wood-dark border-2 border-border-dark flex items-center justify-center hover:bg-primary-orange transition-colors">
                <span className="text-parchment">⚙️</span>
              </button>
            </div>
            
            {/* Photo */}
            <div className="relative mb-3">
              <div className="border-4 border-border-dark overflow-hidden bg-wood-dark" style={{ aspectRatio: '3/4' }}>
                <img
                  src={currentProfile.image}
                  alt={currentProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Location Badge */}
              <div className="absolute bottom-3 left-3 bg-parchment border-2 border-border-dark px-3 py-1 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-medium">{currentProfile.location}</span>
              </div>
            </div>
            
            {/* Current Quest */}
            <div className="bg-parchment border-3 border-border-dark p-3 md:p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="px-2 py-0.5 bg-wood-dark border border-border-dark">
                  <span className="font-pixel text-xs text-parchment">CURRENT QUEST</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{currentProfile.quest}</p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-parchment border-2 border-border-dark p-2 text-center">
                <div className="font-pixel text-xs md:text-sm text-accent-pink mb-1">CHARM</div>
                <div className="font-pixel text-xl md:text-2xl flex items-center justify-center gap-1">
                  <Heart className="w-4 h-4 text-accent-pink fill-accent-pink" />
                  {currentProfile.stats.charm}
                </div>
              </div>
              <div className="bg-parchment border-2 border-border-dark p-2 text-center">
                <div className="font-pixel text-xs md:text-sm text-accent-blue mb-1">WIT</div>
                <div className="font-pixel text-xl md:text-2xl flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-accent-blue fill-accent-blue" />
                  {currentProfile.stats.wit}
                </div>
              </div>
              <div className="bg-parchment border-2 border-border-dark p-2 text-center">
                <div className="font-pixel text-xs md:text-sm text-landscape-green mb-1">STAMINA</div>
                <div className="font-pixel text-xl md:text-2xl flex items-center justify-center gap-1">
                  <span className="text-landscape-green">⚡</span>
                  {currentProfile.stats.stamina}
                </div>
              </div>
            </div>
            
            {/* Inventory (Interests) */}
            <div className="bg-parchment border-3 border-border-dark p-3 md:p-4 mb-3">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4" />
                <span className="font-pixel text-sm">INVENTORY (INTERESTS)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentProfile.interests.map((interest, i) => (
                  <div key={i} className="bg-white border-2 border-border-dark px-3 py-1.5 flex items-center gap-2">
                    {interest.includes('Cat') && '🐱'}
                    {interest.includes('Dog') && '🐕'}
                    {interest.includes('Gamer') && '🎮'}
                    {interest.includes('Coffee') && '☕'}
                    {interest.includes('Book') && '📚'}
                    {interest.includes('Tech') && '💻'}
                    {interest.includes('Hiker') && '⛰️'}
                    {interest.includes('Foodie') && '🍔'}
                    {interest.includes('Adventurer') && '🗺️'}
                    {interest.includes('Baker') && '🍰'}
                    {interest.includes('Music') && '🎵'}
                    {interest.includes('Night Owl') && '🌙'}
                    <span className="text-xs font-medium">{interest}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSwipe('left')}
                className="pixel-btn bg-wood-dark text-parchment hover:bg-wood-shadow flex flex-col items-center justify-center p-3 md:p-4 gap-1"
              >
                <X className="w-6 md:w-8 h-6 md:h-8" />
                <span className="font-pixel text-xs">SKIP TURN</span>
              </button>
              <button className="pixel-btn bg-accent-blue text-parchment hover:bg-accent-blue/80 flex flex-col items-center justify-center p-3 md:p-4 gap-1">
                <Star className="w-6 md:w-8 h-6 md:h-8" />
                <span className="font-pixel text-xs">SEND GIFT</span>
              </button>
              <button
                onClick={() => handleSwipe('right')}
                className="pixel-btn pixel-btn-primary flex flex-col items-center justify-center p-3 md:p-4 gap-1"
              >
                <Heart className="w-6 md:w-8 h-6 md:h-8 fill-current" />
                <span className="font-pixel text-xs">MATCH!</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Cards remaining indicator */}
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2">
          <div className="bg-parchment border-3 border-border-dark px-4 py-2">
            <p className="font-pixel text-xs md:text-sm text-text-pixel">
              {mockProfiles.length - currentIndex} ADVENTURERS WAITING
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}