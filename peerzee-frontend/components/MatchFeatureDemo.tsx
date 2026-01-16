'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
    motion,
    AnimatePresence,
    useMotionValue,
    useTransform,
    PanInfo,
} from 'framer-motion';
import {
    X,
    Check,
    Star,
    MapPin,
    Briefcase,
    GraduationCap,
    Music,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    MessageCircle,
    Heart,
} from 'lucide-react';
import EngagementModal, { type EngagementTarget } from './EngagementModal';

// =============================================================================
// TYPES
// =============================================================================

interface ProfilePhoto {
    id: string;
    url: string;
}

interface ProfilePrompt {
    id: string;
    emoji: string;
    question: string;
    answer: string;
}

interface UserProfile {
    id: string;
    name: string;
    age: number;
    distance: string;
    occupation: string;
    education: string;
    photos: ProfilePhoto[];
    chips: string[];
    about: string;
    prompts: ProfilePrompt[];
    spotify?: {
        song: string;
        artist: string;
    };
    instagram?: string;
}

// Current user's interests (for compatibility calculation)
const CURRENT_USER_INTERESTS = ['NextJS', 'Coffee', 'Coding', 'Gym', 'Travel', 'K-Drama'];

// =============================================================================
// MOCK DATA - With contentIds for interactive elements
// =============================================================================

const MOCK_PROFILES: UserProfile[] = [
    {
        id: '1',
        name: 'Minh Anh',
        age: 24,
        distance: '3km away',
        occupation: 'UX Designer at Shopee',
        education: 'RMIT University',
        photos: [
            { id: 'p1-1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop' },
            { id: 'p1-2', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop' },
            { id: 'p1-3', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop' },
        ],
        chips: ['Figma', 'Coffee', 'K-Drama', 'Yoga', 'Coding'],
        about: 'Design enthusiast who believes great products start with empathy. When I\'m not pushing pixels, you\'ll find me hunting for the best egg coffee in Saigon.',
        prompts: [
            {
                id: 'pr1-1',
                emoji: '🧟',
                question: 'My zombie apocalypse plan...',
                answer: 'Find a Starbucks, barricade the doors, and live off espresso until help arrives. Priorities, right?',
            },
            {
                id: 'pr1-2',
                emoji: '🚀',
                question: 'A goal I\'m working towards...',
                answer: 'Building a design portfolio that makes recruiters say "we need her, not just want her."',
            },
        ],
        spotify: { song: 'Hẹn Ước Từ Hư Vô', artist: 'Mỹ Tâm' },
        instagram: '@minhanh.design',
    },
    {
        id: '2',
        name: 'Đức Khang',
        age: 26,
        distance: '7km away',
        occupation: 'Backend Engineer at Tiki',
        education: 'Bach Khoa University',
        photos: [
            { id: 'p2-1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop' },
            { id: 'p2-2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop' },
        ],
        chips: ['Golang', 'NextJS', 'Chess', 'Hiking', 'Coffee'],
        about: 'Code by day, chess by night. I optimize everything—queries, routes, and even my coffee brewing ratio.',
        prompts: [
            {
                id: 'pr2-1',
                emoji: '💡',
                question: 'The way to my heart is...',
                answer: 'A perfectly optimized SQL query. Or tacos. Probably tacos.',
            },
            {
                id: 'pr2-2',
                emoji: '🎯',
                question: 'I\'m looking for someone who...',
                answer: 'Can explain complex topics simply, laughs at my puns, and doesn\'t mind weekend hiking trips.',
            },
        ],
        spotify: { song: 'Chạy Ngay Đi', artist: 'Sơn Tùng M-TP' },
    },
    {
        id: '3',
        name: 'Thu Hà',
        age: 23,
        distance: '2km away',
        occupation: 'Product Manager at VNG',
        education: 'FPT University',
        photos: [
            { id: 'p3-1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop' },
            { id: 'p3-2', url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop' },
        ],
        chips: ['Agile', 'Coffee', 'Startup', 'Travel', 'Piano'],
        about: 'I turn chaos into product roadmaps. My superpower? Making engineers smile during sprint planning.',
        prompts: [
            {
                id: 'pr3-1',
                emoji: '🌟',
                question: 'My simple pleasures...',
                answer: 'Morning pho, perfectly synced calendars, and that feeling when a feature ships with zero bugs.',
            },
        ],
        instagram: '@thuha.pm',
    },
    {
        id: '4',
        name: 'Quốc Bảo',
        age: 27,
        distance: '5km away',
        occupation: 'Data Scientist at Grab',
        education: 'National University of Singapore',
        photos: [
            { id: 'p4-1', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop' },
        ],
        chips: ['Python', 'ML/AI', 'Gym', 'Podcast', 'Travel'],
        about: 'I teach machines to think, but I promise I\'m still human. Host of a tech podcast with 10K listeners.',
        prompts: [
            {
                id: 'pr4-1',
                emoji: '🤖',
                question: 'Unpopular opinion I have...',
                answer: 'AI won\'t replace developers—developers who use AI will replace those who don\'t.',
            },
        ],
        spotify: { song: 'Đông Kiếm Em', artist: 'Vũ.' },
    },
];

// =============================================================================
// CONSTANTS
// =============================================================================

const SWIPE_THRESHOLD = 120;
const SWIPE_VELOCITY = 500;

// =============================================================================
// COMPATIBILITY RADAR COMPONENT
// =============================================================================

interface CompatibilityRadarProps {
    userChips: string[];
    percentage: number;
}

function CompatibilityRadar({ userChips, percentage }: CompatibilityRadarProps) {
    const commonInterests = userChips.filter((chip) =>
        CURRENT_USER_INTERESTS.some((interest) =>
            chip.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(chip.toLowerCase())
        )
    );

    return (
        <div className="bg-[#262626]/80 backdrop-blur-sm border border-[#2F2F2F] rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
                {/* Progress Circle */}
                <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        <circle
                            cx="18"
                            cy="18"
                            r="15"
                            fill="none"
                            stroke="#3A3A3A"
                            strokeWidth="3"
                        />
                        <circle
                            cx="18"
                            cy="18"
                            r="15"
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${percentage * 0.94} 94`}
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ec4899" />
                                <stop offset="100%" stopColor="#f43f5e" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[#E3E3E3]">
                        {percentage}%
                    </span>
                </div>

                {/* Common Interests */}
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#9B9A97] mb-1">Compatible vibes</p>
                    <div className="flex flex-wrap gap-1.5">
                        {commonInterests.slice(0, 3).map((interest, i) => (
                            <span
                                key={i}
                                className="px-2 py-0.5 text-xs bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-300 rounded-full border border-pink-500/30"
                            >
                                #{interest}
                            </span>
                        ))}
                        {commonInterests.length > 3 && (
                            <span className="text-xs text-[#9B9A97]">
                                +{commonInterests.length - 3} more
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// INTERACTIVE PROFILE CARD COMPONENT
// =============================================================================

interface ProfileCardProps {
    profile: UserProfile;
    isTop: boolean;
    onSwipe: (direction: 'left' | 'right') => void;
    onEngagement: (target: EngagementTarget) => void;
    compatibilityScore: number;
}

function ProfileCard({ profile, isTop, onSwipe, onEngagement, compatibilityScore }: ProfileCardProps) {
    const [photoIndex, setPhotoIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Motion values
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12]);
    const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0.5, 0.8, 1, 0.8, 0.5]);
    const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
    const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

    const handleDragEnd = useCallback(
        (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > SWIPE_VELOCITY) {
                onSwipe('right');
            } else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY) {
                onSwipe('left');
            }
        },
        [onSwipe]
    );

    const nextPhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (photoIndex < profile.photos.length - 1) {
            setPhotoIndex((prev) => prev + 1);
        }
    };

    const prevPhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (photoIndex > 0) {
            setPhotoIndex((prev) => prev - 1);
        }
    };

    const handlePhotoClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const currentPhoto = profile.photos[photoIndex];
        onEngagement({
            type: 'photo',
            contentId: currentPhoto.id,
            preview: `${profile.name}'s photo`,
            emoji: '📸',
        });
    };

    const handlePromptClick = (prompt: ProfilePrompt) => {
        onEngagement({
            type: 'prompt',
            contentId: prompt.id,
            preview: prompt.answer,
            emoji: prompt.emoji,
        });
    };

    const handleChipClick = (chip: string) => {
        onEngagement({
            type: 'vibe',
            contentId: `chip-${chip}`,
            preview: chip,
            emoji: '✨',
        });
    };

    return (
        <motion.div
            style={{
                x: isTop ? x : 0,
                rotate: isTop ? rotate : 0,
                opacity: isTop ? opacity : 0.6,
                scale: isTop ? 1 : 0.95,
            }}
            drag={isTop ? 'x' : false}
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={isTop ? handleDragEnd : undefined}
            className={`absolute inset-x-4 top-0 bg-[#202020] border border-[#2F2F2F] rounded-3xl overflow-hidden shadow-2xl ${isTop ? 'z-10 cursor-grab active:cursor-grabbing' : 'z-0'
                }`}
        >
            {/* Like/Nope Indicators */}
            {isTop && (
                <>
                    <motion.div
                        style={{ opacity: likeOpacity }}
                        className="absolute top-8 left-6 z-30 px-4 py-2 border-4 border-green-400 text-green-400 text-2xl font-bold rounded-lg rotate-[-15deg] bg-black/20 backdrop-blur-sm"
                    >
                        LIKE
                    </motion.div>
                    <motion.div
                        style={{ opacity: passOpacity }}
                        className="absolute top-8 right-6 z-30 px-4 py-2 border-4 border-red-400 text-red-400 text-2xl font-bold rounded-lg rotate-[15deg] bg-black/20 backdrop-blur-sm"
                    >
                        NOPE
                    </motion.div>
                </>
            )}

            {/* Scrollable Container */}
            <div ref={scrollContainerRef} className="h-[72vh] overflow-y-auto scrollbar-hide">
                {/* Photo Slider */}
                <div className="relative aspect-[3/4] w-full bg-[#191919]">
                    <img
                        src={profile.photos[photoIndex].url}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                        draggable={false}
                    />

                    {/* Photo Click Overlay for Engagement */}
                    <button
                        onClick={handlePhotoClick}
                        className="absolute inset-0 z-10 group"
                        title="Tap to react to this photo"
                    >
                        <div className="absolute bottom-24 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="p-3 bg-black/50 backdrop-blur-sm rounded-full">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </button>

                    {/* Photo Navigation Areas */}
                    {profile.photos.length > 1 && (
                        <>
                            <div onClick={prevPhoto} className="absolute left-0 top-0 bottom-0 w-1/4 z-20 cursor-pointer" />
                            <div onClick={nextPhoto} className="absolute right-0 top-0 bottom-0 w-1/4 z-20 cursor-pointer" />
                        </>
                    )}

                    {/* Photo Dots */}
                    {profile.photos.length > 1 && (
                        <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4 z-20">
                            {profile.photos.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1 flex-1 rounded-full transition-colors ${i === photoIndex ? 'bg-white' : 'bg-white/40'
                                        }`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Photo Navigation Arrows */}
                    {profile.photos.length > 1 && (
                        <>
                            {photoIndex > 0 && (
                                <button
                                    onClick={prevPhoto}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-sm rounded-full text-white/80 hover:text-white transition-colors z-20"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            )}
                            {photoIndex < profile.photos.length - 1 && (
                                <button
                                    onClick={nextPhoto}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-sm rounded-full text-white/80 hover:text-white transition-colors z-20"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            )}
                        </>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#202020] via-[#202020]/90 to-transparent z-10 pointer-events-none" />

                    {/* Name & Basic Info - Magazine Style */}
                    <div className="absolute bottom-4 left-5 right-5 z-20">
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl font-bold text-[#E3E3E3]" style={{ fontFamily: 'Georgia, serif' }}>
                                {profile.name}
                            </h2>
                            <span className="text-2xl text-[#9B9A97] font-light">{profile.age}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[#9B9A97]">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                <span>{profile.distance}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Briefcase className="w-4 h-4" />
                                <span>{profile.occupation}</span>
                            </div>
                        </div>

                        {profile.education && (
                            <div className="flex items-center gap-1.5 mt-1 text-sm text-[#9B9A97]">
                                <GraduationCap className="w-4 h-4" />
                                <span>{profile.education}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Sections */}
                <div className="p-5 space-y-5">
                    {/* Compatibility Radar */}
                    <CompatibilityRadar userChips={profile.chips} percentage={compatibilityScore} />

                    {/* Interactive Chips/Tags */}
                    <div>
                        <p className="text-xs text-[#6B6B6B] mb-2 uppercase tracking-wider">Tap to connect</p>
                        <div className="flex flex-wrap gap-2">
                            {profile.chips.map((chip) => {
                                const isCommon = CURRENT_USER_INTERESTS.some((i) =>
                                    chip.toLowerCase().includes(i.toLowerCase()) ||
                                    i.toLowerCase().includes(chip.toLowerCase())
                                );
                                return (
                                    <button
                                        key={chip}
                                        onClick={() => handleChipClick(chip)}
                                        className={`group px-3 py-1.5 text-sm rounded-full border transition-all hover:scale-105 ${isCommon
                                                ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-300 border-pink-500/30 hover:border-pink-400'
                                                : 'bg-[#2F2F2F] text-[#E3E3E3] border-[#3A3A3A] hover:border-[#4A4A4A]'
                                            }`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            {chip}
                                            <Heart className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* About Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">
                            About Me
                        </h3>
                        <p className="text-[#E3E3E3] text-sm leading-relaxed">{profile.about}</p>
                    </div>

                    {/* Interactive Prompts - Notion Callout Style */}
                    <div className="space-y-3">
                        <p className="text-xs text-[#6B6B6B] uppercase tracking-wider">Tap to reply</p>
                        {profile.prompts.map((prompt) => (
                            <button
                                key={prompt.id}
                                onClick={() => handlePromptClick(prompt)}
                                className="w-full text-left bg-[#262626] border border-[#2F2F2F] rounded-xl p-4 flex gap-3 hover:border-[#4A4A4A] hover:bg-[#2A2A2A] transition-all group"
                            >
                                <span className="text-2xl flex-shrink-0">{prompt.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#E3E3E3] mb-1">{prompt.question}</p>
                                    <p className="text-sm text-[#9B9A97] leading-relaxed">{prompt.answer}</p>
                                </div>
                                <MessageCircle className="w-4 h-4 text-[#4A4A4A] group-hover:text-pink-400 transition-colors flex-shrink-0 mt-1" />
                            </button>
                        ))}
                    </div>

                    {/* Spotify Section */}
                    {profile.spotify && (
                        <div className="flex items-center gap-3 p-4 bg-[#1DB954]/10 border border-[#1DB954]/20 rounded-xl">
                            <Music className="w-5 h-5 text-[#1DB954]" />
                            <div>
                                <p className="text-sm text-[#E3E3E3] font-medium">{profile.spotify.song}</p>
                                <p className="text-xs text-[#9B9A97]">{profile.spotify.artist}</p>
                            </div>
                        </div>
                    )}

                    {/* Instagram */}
                    {profile.instagram && (
                        <div className="flex items-center gap-2 text-sm text-[#9B9A97]">
                            <span className="text-lg">📸</span>
                            <span>{profile.instagram}</span>
                        </div>
                    )}

                    {/* Bottom Padding */}
                    <div className="h-20" />
                </div>
            </div>
        </motion.div>
    );
}

// =============================================================================
// ACTION BUTTONS COMPONENT
// =============================================================================

interface ActionButtonsProps {
    onPass: () => void;
    onLike: () => void;
    onSuperLike?: () => void;
    disabled?: boolean;
}

function ActionButtons({ onPass, onLike, onSuperLike, disabled }: ActionButtonsProps) {
    return (
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-5 z-20">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPass}
                disabled={disabled}
                className="w-16 h-16 rounded-full border-2 border-[#E3E3E3] bg-[#191919]/80 backdrop-blur-sm flex items-center justify-center text-[#E3E3E3] hover:border-red-400 hover:text-red-400 transition-colors disabled:opacity-40 shadow-lg"
                aria-label="Pass"
            >
                <X className="w-7 h-7" strokeWidth={2.5} />
            </motion.button>

            {onSuperLike && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onSuperLike}
                    disabled={disabled}
                    className="w-12 h-12 rounded-full bg-[#2F2F2F] border border-[#3A3A3A] flex items-center justify-center text-[#9B9A97] hover:text-blue-400 hover:border-blue-400 transition-colors disabled:opacity-40 shadow-lg"
                    aria-label="Super Like"
                >
                    <Star className="w-5 h-5" />
                </motion.button>
            )}

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLike}
                disabled={disabled}
                className="w-16 h-16 rounded-full bg-[#E3E3E3] flex items-center justify-center text-[#191919] hover:bg-white transition-colors disabled:opacity-40 shadow-lg"
                aria-label="Like"
            >
                <Check className="w-7 h-7" strokeWidth={2.5} />
            </motion.button>
        </div>
    );
}

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-[72vh] px-6 text-center">
            <div className="text-7xl mb-6">🔍</div>
            <h2 className="text-2xl font-semibold text-[#E3E3E3] mb-3">No more profiles</h2>
            <p className="text-[#9B9A97] text-sm mb-8 max-w-xs">
                You&apos;ve seen everyone nearby! Check back later for new people.
            </p>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRefresh}
                className="flex items-center gap-2 px-6 py-3 bg-[#E3E3E3] text-[#191919] font-medium rounded-xl hover:bg-white transition-colors"
            >
                <RefreshCw className="w-4 h-4" />
                Refresh
            </motion.button>
        </div>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function MatchFeatureDemo() {
    const [profiles, setProfiles] = useState<UserProfile[]>(MOCK_PROFILES);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

    // Engagement Modal State
    const [engagementModal, setEngagementModal] = useState<{
        isOpen: boolean;
        target: EngagementTarget | null;
    }>({ isOpen: false, target: null });

    const currentProfile = profiles[currentIndex];
    const nextProfile = profiles[currentIndex + 1];

    // Calculate compatibility score
    const compatibilityScore = useMemo(() => {
        if (!currentProfile) return 0;
        const commonCount = currentProfile.chips.filter((chip) =>
            CURRENT_USER_INTERESTS.some((interest) =>
                chip.toLowerCase().includes(interest.toLowerCase()) ||
                interest.toLowerCase().includes(chip.toLowerCase())
            )
        ).length;
        return Math.round((commonCount / Math.max(currentProfile.chips.length, CURRENT_USER_INTERESTS.length)) * 100);
    }, [currentProfile]);

    const handleSwipe = useCallback(
        (direction: 'left' | 'right') => {
            setExitDirection(direction);
            setTimeout(() => {
                setCurrentIndex((prev) => prev + 1);
                setExitDirection(null);
            }, 200);
            console.log(`${direction === 'right' ? '❤️ Liked' : '❌ Passed'}: ${currentProfile?.name}`);
        },
        [currentProfile]
    );

    const handleEngagement = useCallback((target: EngagementTarget) => {
        setEngagementModal({ isOpen: true, target });
    }, []);

    const handleEngagementSend = useCallback(
        (message: string) => {
            console.log(`💬 Like with message to ${currentProfile?.name}:`, message);
            console.log('Target:', engagementModal.target);
            // In real app, call API here
            handleSwipe('right');
        },
        [currentProfile, engagementModal.target, handleSwipe]
    );

    const handleSuperLike = useCallback(() => {
        console.log(`⭐ Super Liked: ${currentProfile?.name}`);
        handleSwipe('right');
    }, [currentProfile, handleSwipe]);

    const handleRefresh = useCallback(() => {
        setCurrentIndex(0);
        setProfiles([...MOCK_PROFILES].sort(() => Math.random() - 0.5));
    }, []);

    const isFinished = currentIndex >= profiles.length;

    return (
        <div className="min-h-screen bg-[#191919] font-[Inter,system-ui,sans-serif]">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-[#191919]/95 backdrop-blur-lg border-b border-[#2F2F2F]">
                <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-center">
                    <h1 className="text-lg font-semibold text-[#E3E3E3]">Discover</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative max-w-lg mx-auto pt-4">
                {isFinished ? (
                    <EmptyState onRefresh={handleRefresh} />
                ) : (
                    <div className="relative h-[calc(72vh+80px)]">
                        <div className="relative h-[72vh]">
                            <AnimatePresence mode="popLayout">
                                {nextProfile && (
                                    <ProfileCard
                                        key={nextProfile.id + '-next'}
                                        profile={nextProfile}
                                        isTop={false}
                                        onSwipe={() => { }}
                                        onEngagement={() => { }}
                                        compatibilityScore={0}
                                    />
                                )}

                                {currentProfile && !exitDirection && (
                                    <ProfileCard
                                        key={currentProfile.id}
                                        profile={currentProfile}
                                        isTop={true}
                                        onSwipe={handleSwipe}
                                        onEngagement={handleEngagement}
                                        compatibilityScore={compatibilityScore}
                                    />
                                )}

                                {currentProfile && exitDirection && (
                                    <motion.div
                                        key={currentProfile.id + '-exit'}
                                        initial={{ x: 0, opacity: 1 }}
                                        animate={{
                                            x: exitDirection === 'right' ? 400 : -400,
                                            opacity: 0,
                                            rotate: exitDirection === 'right' ? 20 : -20,
                                        }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute inset-x-4 top-0 z-20"
                                    >
                                        <ProfileCard
                                            profile={currentProfile}
                                            isTop={false}
                                            onSwipe={() => { }}
                                            onEngagement={() => { }}
                                            compatibilityScore={compatibilityScore}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <ActionButtons
                            onPass={() => handleSwipe('left')}
                            onLike={() => handleSwipe('right')}
                            onSuperLike={handleSuperLike}
                            disabled={isFinished}
                        />
                    </div>
                )}
            </main>

            {/* Progress Indicator */}
            {!isFinished && (
                <div className="fixed bottom-2 left-0 right-0 flex justify-center">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#2F2F2F]/80 backdrop-blur-sm rounded-full">
                        {profiles.map((_, i) => (
                            <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIndex
                                        ? 'bg-[#E3E3E3]'
                                        : i < currentIndex
                                            ? 'bg-[#9B9A97]'
                                            : 'bg-[#4A4A4A]'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Engagement Modal */}
            <EngagementModal
                isOpen={engagementModal.isOpen}
                target={engagementModal.target}
                recipientName={currentProfile?.name || ''}
                onClose={() => setEngagementModal({ isOpen: false, target: null })}
                onSend={handleEngagementSend}
            />
        </div>
    );
}
