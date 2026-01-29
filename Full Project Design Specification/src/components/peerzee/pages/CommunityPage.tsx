import { VillageHeader } from '../VillageHeader';
import { VillageSidebar } from '../VillageSidebar';
import { WoodenFrame } from '../WoodenFrame';
import { PushPin } from '../PushPin';
import { PixelButton } from '../PixelButton';
import { CarvedTextarea } from '../CarvedTextarea';
import { Heart, MessageSquare, Share2, Image as ImageIcon, Smile } from 'lucide-react';

interface Post {
  id: number;
  author: string;
  authorTitle: string;
  avatar?: string;
  timestamp: string;
  content: string;
  image?: string;
  tags?: string[];
  likes: number;
  comments: number;
  type: 'official' | 'post' | 'quest' | 'announcement';
  badge?: string;
}

const mockPosts: Post[] = [
  {
    id: 1,
    author: "Mayor's Office",
    authorTitle: 'OFFICIAL NOTICE',
    timestamp: '2 hours ago',
    type: 'official',
    badge: '🏛️',
    content: "Don't forget to bring your biggest pumpkins to the town square this Friday at sundown. The contest begins promptly at 6 PM! 🎃",
    image: 'https://images.unsplash.com/photo-1603174373801-9f4695294f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    likes: 124,
    comments: 42
  },
  {
    id: 2,
    author: 'Farmer Joe',
    authorTitle: 'Local Trader',
    timestamp: '4 hours ago',
    type: 'post',
    content: "Anyone have spare wood? I'm trying to upgrade my barn before winter hits. Will trade for fresh eggs! 🐔🪵",
    tags: ['#TRADING', '#HELP'],
    likes: 8,
    comments: 2
  },
  {
    id: 3,
    author: 'Merlin_Official',
    authorTitle: 'Village Wizard',
    timestamp: '6 hours ago',
    type: 'quest',
    badge: '🔮',
    content: 'Found this strange glowing rock near the mystic cave. Does anyone know what it is?',
    image: 'https://images.unsplash.com/photo-1691723576318-90ad87e5842d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    likes: 45,
    comments: 12
  },
  {
    id: 4,
    author: 'Sarah_Baker',
    authorTitle: 'Artisan',
    timestamp: '1 day ago',
    type: 'announcement',
    content: 'Opening a new bakery next week! First 10 customers get free samples 🥐🍰',
    tags: ['#NEWS', '#FOOD'],
    likes: 67,
    comments: 23
  }
];

export function CommunityPage() {
  return (
    <div className="min-h-screen grass-dots flex flex-col">
      <VillageHeader
        title="PEERZEE VILLAGE"
        subtitle="EST. 2024 • POPULATION: 1,304"
        showSearch
        userLevel={5}
      />
      
      <div className="flex-1 flex">
        <VillageSidebar activeItem="map" />
        
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_320px] gap-6">
            {/* Main Feed */}
            <div>
              <WoodenFrame className="mb-6" variant="cork">
                <div className="relative p-6">
                  <div className="absolute -top-4 left-8 z-10">
                    <PushPin color="red" />
                  </div>
                  
                  <h2 className="font-pixel text-3xl text-text-pixel mb-4">Town Square Notices</h2>
                  
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b-2 border-dashed border-text-pixel/20">
                    <span className="bg-parchment border border-border-dark px-2 py-1 text-xs">
                      Today's Date: <span className="font-pixel">Harvest 12</span>
                    </span>
                  </div>
                  
                  {/* Create Post */}
                  <div className="bg-[#FFFEF5] border-3 border-border-dark p-4 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-accent-blue border-2 border-border-dark rounded-full" />
                      <div className="flex-1">
                        <div className="bg-parchment-dark border-2 border-border-dark px-3 py-1 text-sm">
                          <span className="font-pixel text-xs text-text-pixel">Write a Note</span>
                        </div>
                      </div>
                    </div>
                    
                    <CarvedTextarea
                      placeholder="What's happening in the village?"
                      rows={3}
                      className="mb-3"
                    />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <button className="w-8 h-8 bg-wood-dark border-2 border-border-dark flex items-center justify-center hover:bg-wood-light">
                          <ImageIcon className="w-4 h-4 text-parchment" />
                        </button>
                        <button className="w-8 h-8 bg-wood-dark border-2 border-border-dark flex items-center justify-center hover:bg-wood-light">
                          <Smile className="w-4 h-4 text-parchment" />
                        </button>
                      </div>
                      
                      <PixelButton variant="primary" size="sm">
                        PIN NOTE
                      </PixelButton>
                    </div>
                  </div>
                </div>
              </WoodenFrame>
              
              {/* Posts Feed */}
              <div className="space-y-6">
                {mockPosts.map((post) => (
                  <div key={post.id} className="relative">
                    <div className="bg-white border-3 border-border-dark shadow-md hover:border-primary-orange transition-colors">
                      <div className="absolute -top-2 -left-2 z-10">
                        <PushPin 
                          color={post.type === 'official' ? 'red' : post.type === 'quest' ? 'blue' : 'yellow'} 
                        />
                      </div>
                      
                      {/* Post Header */}
                      <div className="bg-parchment-dark border-b-2 border-border-dark px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-wood-dark border-2 border-border-dark flex items-center justify-center">
                            {post.badge || '👤'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-text-pixel">{post.author}</span>
                              {post.type === 'official' && (
                                <span className="bg-primary-orange text-parchment px-2 py-0.5 text-xs font-pixel">
                                  OFFICIAL
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-text-pixel/60">{post.authorTitle} • {post.timestamp}</span>
                          </div>
                        </div>
                        <button className="text-text-pixel/60 hover:text-text-pixel">⋯</button>
                      </div>
                      
                      {/* Post Content */}
                      <div className="p-4">
                        {post.type === 'official' && (
                          <div className="bg-primary-red/10 border-2 border-primary-red px-4 py-2 mb-3">
                            <p className="font-pixel text-sm text-primary-red">
                              {post.content.split('!')[0]}!
                            </p>
                          </div>
                        )}
                        
                        <p className="text-sm leading-relaxed mb-3">{post.content}</p>
                        
                        {post.image && (
                          <div className="border-3 border-border-dark overflow-hidden mb-3">
                            <img
                              src={post.image}
                              alt="Post image"
                              className="w-full h-auto"
                            />
                          </div>
                        )}
                        
                        {post.tags && (
                          <div className="flex gap-2 mb-3">
                            {post.tags.map((tag, i) => (
                              <span key={i} className="bg-parchment-dark border border-border-dark px-2 py-1 text-xs font-pixel">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Post Actions */}
                        <div className="flex items-center gap-4 pt-3 border-t border-border-dark">
                          <button className="flex items-center gap-2 text-text-pixel/70 hover:text-accent-pink transition-colors">
                            <Heart className="w-4 h-4" />
                            <span className="font-pixel text-sm">{post.likes}</span>
                          </button>
                          <button className="flex items-center gap-2 text-text-pixel/70 hover:text-accent-blue transition-colors">
                            <MessageSquare className="w-4 h-4" />
                            <span className="font-pixel text-sm">{post.comments}</span>
                          </button>
                          <button className="flex items-center gap-2 text-text-pixel/70 hover:text-primary-orange transition-colors ml-auto">
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {post.type === 'official' && (
                        <div className="bg-primary-orange px-4 py-2 text-center">
                          <button className="font-pixel text-sm text-parchment hover:text-accent-yellow">
                            Read More
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Town Crier */}
              <WoodenFrame>
                <div className="p-4">
                  <h3 className="font-pixel text-xl text-text-pixel mb-4">TOWN CRIER</h3>
                  <p className="text-xs text-text-pixel/70 mb-3 uppercase tracking-wide">EXTRA! EXTRA!</p>
                  
                  <div className="space-y-3">
                    <div className="bg-parchment-dark border border-border-dark p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">📣</span>
                        <span className="font-medium text-xs">TALK OF THE TOWN</span>
                      </div>
                      <div className="space-y-1">
                        <button className="text-xs text-primary-orange hover:underline block">#HarvestFestival <span className="text-text-pixel/50">1.2k</span></button>
                        <button className="text-xs text-primary-orange hover:underline block">#LostCat <span className="text-text-pixel/50">856</span></button>
                        <button className="text-xs text-primary-orange hover:underline block">#PotionRecipes <span className="text-text-pixel/50">420</span></button>
                      </div>
                    </div>
                    
                    <div className="bg-parchment-dark border border-border-dark p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">👥</span>
                        <span className="font-medium text-xs">NEW VILLAGERS</span>
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="w-10 h-10 bg-accent-blue border-2 border-border-dark" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </WoodenFrame>
              
              {/* Footer */}
              <div className="bg-parchment border-3 border-border-dark p-4 space-y-2">
                <div className="flex flex-wrap gap-2 justify-center">
                  <button className="text-xs text-primary-red hover:underline">RULES</button>
                  <span className="text-xs">•</span>
                  <button className="text-xs text-primary-red hover:underline">HELP</button>
                  <span className="text-xs">•</span>
                  <button className="text-xs text-primary-red hover:underline">PRIVACY</button>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
