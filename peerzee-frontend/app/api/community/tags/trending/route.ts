import { NextRequest, NextResponse } from 'next/server';

// Mock trending tags data
const mockTags = [
  {
    name: 'Cà phê',
    count: 234,
    trend: 'up',
    color: '#8B4513'
  },
  {
    name: 'Music',
    count: 189,
    trend: 'up',
    color: '#E91E63'
  },
  {
    name: 'Travel',
    count: 156,
    trend: 'stable',
    color: '#2196F3'
  },
  {
    name: 'Food',
    count: 145,
    trend: 'up',
    color: '#FF9800'
  },
  {
    name: 'Hà Nội',
    count: 134,
    trend: 'up',
    color: '#9C27B0'
  },
  {
    name: 'Books',
    count: 98,
    trend: 'stable',
    color: '#4CAF50'
  },
  {
    name: 'Weekend',
    count: 87,
    trend: 'down',
    color: '#00BCD4'
  },
  {
    name: 'Beach',
    count: 76,
    trend: 'up',
    color: '#FF5722'
  },
  {
    name: 'Tech',
    count: 65,
    trend: 'stable',
    color: '#607D8B'
  },
  {
    name: 'Art',
    count: 54,
    trend: 'up',
    color: '#E91E63'
  }
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '5', 10);

  const trendingTags = mockTags.slice(0, limit);

  return NextResponse.json({
    ok: true,
    tags: trendingTags,
    total: mockTags.length
  });
}
