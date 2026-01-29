import { NextRequest, NextResponse } from 'next/server';

// Mock recent matches data
const mockMatches = [
  {
    id: 'match-1',
    matchedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    user: {
      id: '301',
      name: 'Thu Hà',
      avatar: 'https://i.pravatar.cc/150?img=5',
      age: 23,
      location: 'Đà Nẵng',
      bio: 'Beach lover | Sunset chaser 🌅',
      interests: ['Beach', 'Travel', 'Photography'],
      photos: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80'
      ],
      compatibility: 92
    },
    iceBreaker: 'Bạn thích đi biển vào mùa nào nhất?',
    hasUnreadMessage: true,
    lastMessage: {
      text: 'Chào bạn! Mình cũng thích đi Đà Nẵng lắm 😊',
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      from: '301'
    }
  },
  {
    id: 'match-2',
    matchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: {
      id: '302',
      name: 'Minh Tuấn',
      avatar: 'https://i.pravatar.cc/150?img=14',
      age: 27,
      location: 'TP.HCM',
      bio: 'Tech enthusiast | Startup founder 💻',
      interests: ['Tech', 'Startup', 'Coffee'],
      photos: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80'
      ],
      compatibility: 88
    },
    iceBreaker: 'Công nghệ nào bạn đang quan tâm nhất?',
    hasUnreadMessage: false,
    lastMessage: {
      text: 'Mình đang làm về AI, còn bạn?',
      timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      from: 'current'
    }
  },
  {
    id: 'match-3',
    matchedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    user: {
      id: '303',
      name: 'Lan Anh',
      avatar: 'https://i.pravatar.cc/150?img=20',
      age: 25,
      location: 'Hà Nội',
      bio: 'Bookworm | Coffee addict ☕📚',
      interests: ['Books', 'Coffee', 'Writing'],
      photos: [
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80'
      ],
      compatibility: 85
    },
    iceBreaker: 'Cuốn sách nào bạn đang đọc?',
    hasUnreadMessage: true,
    lastMessage: {
      text: 'Mình vừa đọc xong Nhà Giả Kim, hay lắm!',
      timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
      from: '303'
    }
  },
  {
    id: 'match-4',
    matchedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    user: {
      id: '304',
      name: 'Quang Huy',
      avatar: 'https://i.pravatar.cc/150?img=15',
      age: 26,
      location: 'Hà Nội',
      bio: 'Adventure seeker | Mountain lover ⛰️',
      interests: ['Hiking', 'Travel', 'Photography'],
      photos: [
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
        'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=400&q=80'
      ],
      compatibility: 90
    },
    iceBreaker: 'Chuyến leo núi nào ấn tượng nhất?',
    hasUnreadMessage: false,
    lastMessage: {
      text: 'Cuối tuần mình định đi Sapa, bạn có muốn đi không?',
      timestamp: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString(),
      from: 'current'
    }
  },
  {
    id: 'match-5',
    matchedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    user: {
      id: '305',
      name: 'Thanh Thảo',
      avatar: 'https://i.pravatar.cc/150?img=25',
      age: 24,
      location: 'Đà Nẵng',
      bio: 'Foodie | Love to cook 🍳',
      interests: ['Food', 'Cooking', 'Travel'],
      photos: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80'
      ],
      compatibility: 87
    },
    iceBreaker: 'Món ăn yêu thích của bạn là gì?',
    hasUnreadMessage: true,
    lastMessage: {
      text: 'Mình mới học được món mới, có muốn thử không? 😊',
      timestamp: new Date(Date.now() - 7.5 * 60 * 60 * 1000).toISOString(),
      from: '305'
    }
  }
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '5', 10);

  const recentMatches = mockMatches.slice(0, limit);
  const unreadCount = mockMatches.filter(m => m.hasUnreadMessage).length;

  return NextResponse.json({
    ok: true,
    matches: recentMatches,
    unreadCount,
    total: mockMatches.length
  });
}
