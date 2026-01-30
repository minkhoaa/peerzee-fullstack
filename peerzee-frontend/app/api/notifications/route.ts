import { NextRequest, NextResponse } from 'next/server';

// Mock notifications data
const mockNotifications = [
  {
    id: '1',
    type: 'like',
    title: 'New Like',
    message: 'Minh Anh liked your post',
    avatar: 'https://i.pravatar.cc/150?img=1',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    actionUrl: '/community'
  },
  {
    id: '2',
    type: 'comment',
    title: 'New Comment',
    message: 'Tuấn Kiệt commented on your post: "Hay quá!"',
    avatar: 'https://i.pravatar.cc/150?img=12',
    read: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    actionUrl: '/community'
  },
  {
    id: '3',
    type: 'match',
    title: 'New Match!',
    message: 'You matched with Thu Hà',
    avatar: 'https://i.pravatar.cc/150?img=5',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    actionUrl: '/match'
  },
  {
    id: '4',
    type: 'message',
    title: 'New Message',
    message: 'Hoàng Long sent you a message',
    avatar: 'https://i.pravatar.cc/150?img=8',
    read: true,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    actionUrl: '/chat'
  },
  {
    id: '5',
    type: 'follow',
    title: 'New Follower',
    message: 'Lan Anh started following you',
    avatar: 'https://i.pravatar.cc/150?img=20',
    read: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/profile/105'
  },
  {
    id: '6',
    type: 'like',
    title: 'New Like',
    message: 'Quang Huy liked your comment',
    avatar: 'https://i.pravatar.cc/150?img=15',
    read: true,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/community'
  },
  {
    id: '7',
    type: 'match',
    title: 'New Match!',
    message: 'You matched with Thanh Thảo',
    avatar: 'https://i.pravatar.cc/150?img=25',
    read: true,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/match'
  },
  {
    id: '8',
    type: 'comment',
    title: 'New Comment',
    message: 'Đức Minh commented on your post: "Đúng vậy!"',
    avatar: 'https://i.pravatar.cc/150?img=18',
    read: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/community'
  },
  {
    id: '9',
    type: 'message',
    title: 'New Message',
    message: 'Ngọc Mai sent you a message',
    avatar: 'https://i.pravatar.cc/150?img=30',
    read: true,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/chat'
  },
  {
    id: '10',
    type: 'like',
    title: 'New Like',
    message: 'Anh Vũ liked your post',
    avatar: 'https://i.pravatar.cc/150?img=22',
    read: true,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/community'
  },
  {
    id: '11',
    type: 'follow',
    title: 'New Follower',
    message: 'Phương Anh started following you',
    avatar: 'https://i.pravatar.cc/150?img=9',
    read: true,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/profile/201'
  },
  {
    id: '12',
    type: 'match',
    title: 'New Match!',
    message: 'You matched with Trung Kiên',
    avatar: 'https://i.pravatar.cc/150?img=14',
    read: true,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/match'
  },
  {
    id: '13',
    type: 'comment',
    title: 'New Comment',
    message: 'Thu Hằng commented on your post: "Tuyệt vời!"',
    avatar: 'https://i.pravatar.cc/150?img=16',
    read: true,
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/community'
  },
  {
    id: '14',
    type: 'message',
    title: 'New Message',
    message: 'Minh Tuấn sent you a message',
    avatar: 'https://i.pravatar.cc/150?img=11',
    read: true,
    createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/chat'
  },
  {
    id: '15',
    type: 'like',
    title: 'New Like',
    message: 'Kim Chi liked your photo',
    avatar: 'https://i.pravatar.cc/150?img=24',
    read: true,
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/profile'
  },
  {
    id: '16',
    type: 'follow',
    title: 'New Follower',
    message: 'Hoàng Long started following you',
    avatar: 'https://i.pravatar.cc/150?img=8',
    read: true,
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/profile/104'
  },
  {
    id: '17',
    type: 'match',
    title: 'New Match!',
    message: 'You matched with Lan Anh',
    avatar: 'https://i.pravatar.cc/150?img=20',
    read: true,
    createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/match'
  },
  {
    id: '18',
    type: 'comment',
    title: 'New Comment',
    message: 'Quang Huy commented on your post: "Cool!"',
    avatar: 'https://i.pravatar.cc/150?img=15',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/community'
  },
  {
    id: '19',
    type: 'message',
    title: 'New Message',
    message: 'Thanh Thảo sent you a message',
    avatar: 'https://i.pravatar.cc/150?img=25',
    read: true,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/chat'
  },
  {
    id: '20',
    type: 'like',
    title: 'New Like',
    message: 'Đức Minh liked your post',
    avatar: 'https://i.pravatar.cc/150?img=18',
    read: true,
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/community'
  }
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const notifications = mockNotifications.slice(0, limit);
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return NextResponse.json({
    ok: true,
    notifications,
    unreadCount,
    total: mockNotifications.length
  });
}
