import { NextRequest, NextResponse } from 'next/server';

// Mock suggested users data
const mockUsers = [
  {
    id: '201',
    email: 'phuonganh@peerzee.com',
    display_name: 'Phương Anh',
    avatar: 'https://i.pravatar.cc/150?img=9',
    age: 24,
    location: 'Hà Nội',
    bio: 'Travel enthusiast | Coffee addict ☕✈️',
    interests: ['Travel', 'Photography', 'Coffee'],
    mutualFriends: 5
  },
  {
    id: '202',
    email: 'trungkien@peerzee.com',
    display_name: 'Trung Kiên',
    avatar: 'https://i.pravatar.cc/150?img=14',
    age: 27,
    location: 'TP.HCM',
    bio: 'Music lover | Guitar player 🎸',
    interests: ['Music', 'Guitar', 'Rock'],
    mutualFriends: 3
  },
  {
    id: '203',
    email: 'thuhang@peerzee.com',
    display_name: 'Thu Hằng',
    avatar: 'https://i.pravatar.cc/150?img=16',
    age: 25,
    location: 'Đà Nẵng',
    bio: 'Foodie | Love to cook 🍜',
    interests: ['Food', 'Cooking', 'Baking'],
    mutualFriends: 8
  },
  {
    id: '204',
    email: 'minhtuan@peerzee.com',
    display_name: 'Minh Tuấn',
    avatar: 'https://i.pravatar.cc/150?img=11',
    age: 28,
    location: 'Hà Nội',
    bio: 'Tech geek | Startup founder 💻',
    interests: ['Tech', 'Startup', 'AI'],
    mutualFriends: 12
  },
  {
    id: '205',
    email: 'kimchi@peerzee.com',
    display_name: 'Kim Chi',
    avatar: 'https://i.pravatar.cc/150?img=24',
    age: 23,
    location: 'Hải Phòng',
    bio: 'Artist | Designer 🎨',
    interests: ['Art', 'Design', 'Drawing'],
    mutualFriends: 6
  }
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '3', 10);

  const suggestedUsers = mockUsers.slice(0, limit);

  return NextResponse.json({
    ok: true,
    users: suggestedUsers,
    total: mockUsers.length
  });
}
