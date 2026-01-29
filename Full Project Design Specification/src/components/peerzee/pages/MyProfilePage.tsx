import { useState } from 'react';
import { VillageHeader } from '../VillageHeader';
import { WoodenFrame } from '../WoodenFrame';
import { PixelButton } from '../PixelButton';
import { CarvedInput } from '../CarvedInput';
import { CarvedTextarea } from '../CarvedTextarea';
import { Edit, Camera, MapPin, Briefcase, Heart, Star } from 'lucide-react';

export function MyProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('Hero_Player');
  const [age, setAge] = useState(25);
  const [bio, setBio] = useState('Looking for a Player 2 to join my party. Love coffee runs, hiking, and re-watching 90s anime.');
  const [location, setLocation] = useState('Stardew Valley');
  const [occupation, setOccupation] = useState('Graphic Designer');
  
  const photos = [
    'https://images.unsplash.com/photo-1614436201459-156d322d38c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    null,
    null,
    null,
    null,
    null
  ];
  
  const interests = ['☕ Coffee', '🎮 Gaming', '📚 Reading', '⛰️ Hiking'];
  
  return (
    <div className="min-h-screen grass-dots flex flex-col">
      <VillageHeader
        title="PEERZEE"
        subtitle="HERO REGISTRY • MY PROFILE"
        userLevel={5}
      />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[400px_1fr] gap-6">
            {/* Hero Card */}
            <div>
              <WoodenFrame>
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-pixel text-2xl text-text-pixel">HERO CARD</h2>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="pixel-btn pixel-btn-secondary px-3 py-2 font-pixel text-xs flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      {isEditing ? 'SAVE' : 'EDIT'}
                    </button>
                  </div>
                  
                  {/* Avatar */}
                  <div className="relative mb-6">
                    <div className="aspect-square border-4 border-border-dark overflow-hidden bg-gradient-to-br from-accent-blue to-accent-blue/70">
                      <img
                        src={photos[0] || ''}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {isEditing && (
                      <button className="absolute bottom-3 right-3 w-12 h-12 bg-primary-orange border-3 border-border-dark flex items-center justify-center hover:bg-primary-red transition-colors">
                        <Camera className="w-6 h-6 text-parchment" />
                      </button>
                    )}
                    
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-landscape-green border-3 border-border-dark px-6 py-2">
                      <p className="font-pixel text-xl text-parchment text-center">LEVEL {age}</p>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="space-y-4 mt-8">
                    {isEditing ? (
                      <>
                        <CarvedInput
                          label="NAME"
                          pixelLabel
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                        <CarvedInput
                          label="AGE/LEVEL"
                          pixelLabel
                          type="number"
                          value={age}
                          onChange={(e) => setAge(Number(e.target.value))}
                        />
                      </>
                    ) : (
                      <div className="text-center">
                        <h3 className="font-pixel text-3xl text-text-pixel mb-1">{name}</h3>
                        <p className="text-text-pixel/70">Age {age} • Level {age}</p>
                      </div>
                    )}
                    
                    <div className="bg-parchment-dark border-2 border-border-dark p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4" />
                        <span className="font-pixel text-sm">CLASS</span>
                      </div>
                      {isEditing ? (
                        <CarvedInput
                          value={occupation}
                          onChange={(e) => setOccupation(e.target.value)}
                          className="text-sm"
                        />
                      ) : (
                        <p className="text-sm">{occupation}</p>
                      )}
                    </div>
                    
                    <div className="bg-parchment-dark border-2 border-border-dark p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="font-pixel text-sm">REGION</span>
                      </div>
                      {isEditing ? (
                        <CarvedInput
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="text-sm"
                        />
                      ) : (
                        <p className="text-sm">{location}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <div className="bg-white border-2 border-border-dark p-3 text-center">
                      <Heart className="w-5 h-5 text-accent-pink mx-auto mb-1" />
                      <div className="font-pixel text-xl text-accent-pink">85</div>
                      <div className="text-xs text-text-pixel/60">CHARM</div>
                    </div>
                    <div className="bg-white border-2 border-border-dark p-3 text-center">
                      <Star className="w-5 h-5 text-accent-blue mx-auto mb-1" />
                      <div className="font-pixel text-xl text-accent-blue">92</div>
                      <div className="text-xs text-text-pixel/60">WIT</div>
                    </div>
                    <div className="bg-white border-2 border-border-dark p-3 text-center">
                      <span className="text-xl mx-auto mb-1 block">⚡</span>
                      <div className="font-pixel text-xl text-landscape-green">70</div>
                      <div className="text-xs text-text-pixel/60">STAMINA</div>
                    </div>
                  </div>
                </div>
              </WoodenFrame>
            </div>
            
            {/* Main Content */}
            <div className="space-y-6">
              {/* Photos/Inventory */}
              <WoodenFrame>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-pixel text-2xl text-text-pixel">PHOTO INVENTORY</h3>
                      <p className="text-xs text-text-pixel/60">Upload up to 6 photos</p>
                    </div>
                    <span className="font-pixel text-sm text-primary-orange">
                      {photos.filter(p => p).length}/6 SLOTS
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {photos.map((photo, i) => (
                      <div key={i} className="aspect-[3/4] border-4 border-border-dark bg-parchment-dark relative group">
                        {photo ? (
                          <>
                            <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                            {isEditing && (
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button className="w-10 h-10 bg-primary-orange border-2 border-parchment flex items-center justify-center">
                                  <Edit className="w-5 h-5 text-parchment" />
                                </button>
                                <button className="w-10 h-10 bg-destructive border-2 border-parchment flex items-center justify-center">
                                  ×
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <button className="w-full h-full flex flex-col items-center justify-center text-text-pixel/40 hover:text-text-pixel/60 hover:bg-parchment transition-colors">
                            <Camera className="w-8 h-8 mb-2" />
                            <span className="font-pixel text-xs">ADD PHOTO</span>
                          </button>
                        )}
                        
                        {/* Slot number */}
                        <div className="absolute top-2 left-2 w-6 h-6 bg-wood-dark border-2 border-border-dark flex items-center justify-center">
                          <span className="font-pixel text-xs text-parchment">{i + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </WoodenFrame>
              
              {/* Bio/Journal Entry */}
              <WoodenFrame>
                <div className="p-6">
                  <h3 className="font-pixel text-2xl text-text-pixel mb-4">JOURNAL ENTRY</h3>
                  <p className="text-xs text-text-pixel/60 mb-4">Tell your story (200 characters max)</p>
                  
                  {isEditing ? (
                    <CarvedTextarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={5}
                      maxLength={200}
                    />
                  ) : (
                    <div className="bg-parchment-dark border-3 border-border-dark p-4">
                      <p className="text-sm leading-relaxed italic">&ldquo;{bio}&rdquo;</p>
                    </div>
                  )}
                  
                  <p className="text-xs text-right text-text-pixel/50 mt-2">{bio.length}/200</p>
                </div>
              </WoodenFrame>
              
              {/* Interests */}
              <WoodenFrame>
                <div className="p-6">
                  <h3 className="font-pixel text-2xl text-text-pixel mb-4">INTEREST BADGES</h3>
                  <p className="text-xs text-text-pixel/60 mb-4">Select up to 5 interests</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest, i) => (
                      <div key={i} className="bg-white border-3 border-border-dark px-4 py-2 font-medium">
                        {interest}
                      </div>
                    ))}
                    {isEditing && (
                      <button className="bg-parchment-dark border-3 border-dashed border-border-dark px-4 py-2 font-pixel text-sm text-primary-orange hover:bg-parchment transition-colors">
                        + ADD MORE
                      </button>
                    )}
                  </div>
                </div>
              </WoodenFrame>
              
              {/* Action Buttons */}
              {isEditing && (
                <div className="grid grid-cols-2 gap-4">
                  <PixelButton
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    CANCEL
                  </PixelButton>
                  <PixelButton
                    variant="success"
                    onClick={() => setIsEditing(false)}
                  >
                    SAVE CHANGES
                  </PixelButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
