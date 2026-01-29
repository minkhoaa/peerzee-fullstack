import { useState } from 'react';
import { VillageHeader } from '../VillageHeader';
import { WoodenFrame } from '../WoodenFrame';
import { PixelButton } from '../PixelButton';
import { CarvedInput } from '../CarvedInput';
import { Telescope, Sliders, MapPin, User } from 'lucide-react';

export function SearchPage() {
  const [ageMin, setAgeMin] = useState(21);
  const [ageMax, setAgeMax] = useState(35);
  const [distance, setDistance] = useState(25);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const availableTags = [
    '☕ Coffee Lover',
    '🎮 Gamer',
    '📚 Book Worm',
    '🏃 Fitness',
    '🎨 Artist',
    '🎵 Music',
    '🍕 Foodie',
    '✈️ Traveler',
    '🐕 Dog Person',
    '🐱 Cat Person',
    '🌱 Nature Lover',
    '💻 Tech Savvy'
  ];
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };
  
  return (
    <div className="min-h-screen grass-dots flex flex-col">
      <VillageHeader
        title="PEERZEE"
        subtitle="MAP ROOM • ADVANCED SEARCH"
        userLevel={5}
      />
      
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <WoodenFrame>
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-accent-blue border-3 border-border-dark flex items-center justify-center">
                  <Telescope className="w-10 h-10 text-parchment" />
                </div>
                <div>
                  <h1 className="font-pixel text-4xl text-text-pixel">THE MAP ROOM</h1>
                  <p className="text-text-pixel/70 uppercase tracking-wide text-sm">
                    Advanced Adventurer Search Controls
                  </p>
                </div>
              </div>
              
              <div className="w-full h-1 bg-border-dark mb-8" />
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column - Range Controls */}
                <div className="space-y-8">
                  <div className="bg-parchment-dark border-3 border-border-dark p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Sliders className="w-5 h-5" />
                      <h3 className="font-pixel text-xl text-text-pixel">RANGE PARAMETERS</h3>
                    </div>
                    
                    {/* Age Range */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <label className="font-pixel text-lg text-text-pixel">AGE RANGE</label>
                        <span className="font-pixel text-xl text-primary-orange">
                          {ageMin} - {ageMax}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type="range"
                            min="18"
                            max="60"
                            value={ageMin}
                            onChange={(e) => setAgeMin(Number(e.target.value))}
                            className="w-full h-3 bg-wood-dark border-2 border-border-dark appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #D84315 0%, #D84315 ${((ageMin - 18) / 42) * 100}%, #4A3B32 ${((ageMin - 18) / 42) * 100}%, #4A3B32 100%)`
                            }}
                          />
                          <div className="flex justify-between text-xs text-text-pixel/60 mt-1">
                            <span>MIN: 18</span>
                            <span>60</span>
                          </div>
                        </div>
                        
                        <div className="relative">
                          <input
                            type="range"
                            min="18"
                            max="60"
                            value={ageMax}
                            onChange={(e) => setAgeMax(Number(e.target.value))}
                            className="w-full h-3 bg-wood-dark border-2 border-border-dark appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #D84315 0%, #D84315 ${((ageMax - 18) / 42) * 100}%, #4A3B32 ${((ageMax - 18) / 42) * 100}%, #4A3B32 100%)`
                            }}
                          />
                          <div className="flex justify-between text-xs text-text-pixel/60 mt-1">
                            <span>18</span>
                            <span>MAX: 60</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Distance */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="font-pixel text-lg text-text-pixel flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          DISTANCE
                        </label>
                        <span className="font-pixel text-xl text-primary-orange">
                          {distance} KM
                        </span>
                      </div>
                      
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={distance}
                        onChange={(e) => setDistance(Number(e.target.value))}
                        className="w-full h-3 bg-wood-dark border-2 border-border-dark appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #7CB342 0%, #7CB342 ${distance}%, #4A3B32 ${distance}%, #4A3B32 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-text-pixel/60 mt-1">
                        <span>1 KM</span>
                        <span>100 KM</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Gender Selection */}
                  <div className="bg-parchment-dark border-3 border-border-dark p-6">
                    <h3 className="font-pixel text-lg text-text-pixel mb-4">SEEKING</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <button className="pixel-btn pixel-btn-primary p-3 font-pixel text-sm">
                        ♀ WOMEN
                      </button>
                      <button className="pixel-btn pixel-btn-secondary p-3 font-pixel text-sm">
                        ♂ MEN
                      </button>
                      <button className="pixel-btn pixel-btn-secondary p-3 font-pixel text-sm">
                        ⚥ ALL
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Tags */}
                <div className="bg-parchment-dark border-3 border-border-dark p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-pixel text-xl text-text-pixel">INTEREST TAGS</h3>
                    <span className="text-xs text-text-pixel/60 font-mono">
                      {selectedTags.length} SELECTED
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {availableTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-4 py-2 border-3 border-border-dark font-medium text-sm transition-colors ${
                            isSelected
                              ? 'bg-primary-orange text-parchment'
                              : 'bg-white text-text-pixel hover:bg-parchment-dark'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                  
                  {selectedTags.length > 0 && (
                    <div className="bg-white border-2 border-border-dark p-4">
                      <p className="text-xs text-text-pixel/70 mb-2 uppercase tracking-wide">Active Filters:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag) => (
                          <div key={tag} className="bg-primary-orange text-parchment px-3 py-1 text-sm font-medium flex items-center gap-2">
                            {tag}
                            <button
                              onClick={() => toggleTag(tag)}
                              className="hover:text-accent-yellow"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <PixelButton variant="secondary" size="lg">
                  RESET FILTERS
                </PixelButton>
                <PixelButton variant="success" size="lg">
                  BEGIN SEARCH
                </PixelButton>
              </div>
              
              {/* Info Footer */}
              <div className="mt-6 p-4 bg-white border-2 border-border-dark text-center">
                <p className="text-xs text-text-pixel/60 italic">
                  Tip: More specific filters = more compatible matches!
                </p>
              </div>
            </div>
          </WoodenFrame>
        </div>
      </div>
    </div>
  );
}
