import { NextRequest, NextResponse } from 'next/server';

// Mock posts data
const mockPosts = [
  {
    id: '1',
    content: 'Hôm nay mình đi thử quán cà phê mới ở Tây Hồ, view siêu đẹp! Ai muốn đi cùng cuối tuần không? ☕✨',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
        type: 'image' as const
      }
    ],
    author: {
      id: '101',
      email: 'minhanh@peerzee.com',
      display_name: 'Minh Anh',
      avatar: 'https://i.pravatar.cc/150?img=1'
    },
    score: 127,
    userVote: 0,
    likesCount: 127,
    isLiked: false,
    commentsCount: 23,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tags: ['Cà phê', 'Hà Nội', 'Weekend']
  },
  {
    id: '2',
    content: 'Playlist mới của mình đây! Nhạc indie Việt nghe rất chill 🎵 Mọi người thử nghe xem sao nhé~',
    media: [],
    author: {
      id: '102',
      email: 'tuankiet@peerzee.com',
      display_name: 'Tuấn Kiệt',
      avatar: 'https://i.pravatar.cc/150?img=12'
    },
    score: 89,
    userVote: 1,
    likesCount: 89,
    isLiked: true,
    commentsCount: 15,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    tags: ['Music', 'Indie', 'Chill']
  },
  {
    id: '3',
    content: 'Sunset hôm nay đẹp quá! Ai ở Đà Nẵng cùng đi dạo biển không? 🌅',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1495954222046-2c427ecb546d?w=800&q=80',
        type: 'image' as const
      }
    ],
    author: {
      id: '103',
      email: 'thuha@peerzee.com',
      display_name: 'Thu Hà',
      avatar: 'https://i.pravatar.cc/150?img=5'
    },
    score: 234,
    userVote: 1,
    likesCount: 234,
    isLiked: true,
    commentsCount: 41,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    tags: ['Sunset', 'Beach', 'Đà Nẵng']
  },
  {
    id: '4',
    content: 'Có ai thích đọc sách như mình không? Vừa đọc xong "Nhà Giả Kim", hay lắm! Recommend mọi người đọc 📚✨',
    media: [],
    author: {
      id: '104',
      email: 'hoanglong@peerzee.com',
      display_name: 'Hoàng Long',
      avatar: 'https://i.pravatar.cc/150?img=8'
    },
    score: 156,
    userVote: 0,
    likesCount: 156,
    isLiked: false,
    commentsCount: 67,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    tags: ['Books', 'Reading', 'Recommend']
  },
  {
    id: '5',
    content: 'Hôm nay vừa hoàn thành dự án lớn! Cảm giác thật tuyệt 🎉 Ai muốn chia sẻ kinh nghiệm làm việc không?',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
        type: 'image' as const
      }
    ],
    author: {
      id: '105',
      email: 'lananh@peerzee.com',
      display_name: 'Lan Anh',
      avatar: 'https://i.pravatar.cc/150?img=20'
    },
    score: 93,
    userVote: 0,
    likesCount: 93,
    isLiked: false,
    commentsCount: 28,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    tags: ['Work', 'Success', 'Career']
  },
  {
    id: '6',
    content: 'Cuối tuần đi Leo núi Ba Vì, ai cùng đi không nào? Khung cảnh tuyệt vời lắm! ⛰️🌲',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
        type: 'image' as const
      }
    ],
    author: {
      id: '106',
      email: 'quanghuy@peerzee.com',
      display_name: 'Quang Huy',
      avatar: 'https://i.pravatar.cc/150?img=15'
    },
    score: 178,
    userVote: 1,
    likesCount: 178,
    isLiked: true,
    commentsCount: 52,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    tags: ['Travel', 'Hiking', 'Nature']
  },
  {
    id: '7',
    content: 'Mới học được món bánh mì Việt Nam, ai muốn thử nào? 🥖🇻🇳',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
        type: 'image' as const
      }
    ],
    author: {
      id: '107',
      email: 'thanhthao@peerzee.com',
      display_name: 'Thanh Thảo',
      avatar: 'https://i.pravatar.cc/150?img=25'
    },
    score: 215,
    userVote: 0,
    likesCount: 215,
    isLiked: false,
    commentsCount: 38,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    tags: ['Food', 'Cooking', 'Vietnamese']
  },
  {
    id: '8',
    content: 'Buổi chiều làm việc chill với ly trà đá 🍵 Ai cũng đang làm gì vậy?',
    media: [],
    author: {
      id: '108',
      email: 'ducminh@peerzee.com',
      display_name: 'Đức Minh',
      avatar: 'https://i.pravatar.cc/150?img=18'
    },
    score: 67,
    userVote: 0,
    likesCount: 67,
    isLiked: false,
    commentsCount: 19,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    tags: ['Chill', 'Work', 'Tea']
  },
  {
    id: '9',
    content: 'Vừa xem xong phim mới trên Netflix, hay lắm! Có ai xem chưa? 🎬🍿',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
        type: 'image' as const
      }
    ],
    author: {
      id: '109',
      email: 'ngocmai@peerzee.com',
      display_name: 'Ngọc Mai',
      avatar: 'https://i.pravatar.cc/150?img=30'
    },
    score: 142,
    userVote: 1,
    likesCount: 142,
    isLiked: true,
    commentsCount: 54,
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    tags: ['Movies', 'Netflix', 'Entertainment']
  },
  {
    id: '10',
    content: 'Tối nay đi chơi ở Phố cổ Hà Nội! Ai muốn join không? 🏮✨',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80',
        type: 'image' as const
      }
    ],
    author: {
      id: '110',
      email: 'anhvu@peerzee.com',
      display_name: 'Anh Vũ',
      avatar: 'https://i.pravatar.cc/150?img=22'
    },
    score: 189,
    userVote: 0,
    likesCount: 189,
    isLiked: false,
    commentsCount: 44,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    tags: ['Nightlife', 'Hà Nội', 'Social']
  }
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const cursor = searchParams.get('cursor');

  // Simulate pagination
  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const endIndex = startIndex + limit;
  const paginatedPosts = mockPosts.slice(startIndex, endIndex);

  return NextResponse.json({
    ok: true,
    data: paginatedPosts,
    posts: paginatedPosts,
    nextCursor: endIndex < mockPosts.length ? endIndex.toString() : null,
    hasMore: endIndex < mockPosts.length
  });
}
