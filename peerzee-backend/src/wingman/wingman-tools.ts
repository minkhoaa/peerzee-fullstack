/**
 * Wingman AI Tool Definitions
 * Tools available for the Agentic Wingman Chatbot
 */

export const WINGMAN_TOOLS = [
    {
        name: 'get_my_profile',
        description: 'Lấy thông tin profile hiện tại của user để xem xét và đưa ra gợi ý',
        parameters: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
    {
        name: 'update_bio',
        description: 'Cập nhật bio của user. Dùng khi user yêu cầu viết lại bio hoặc chấp nhận gợi ý bio mới.',
        parameters: {
            type: 'object',
            properties: {
                bio: {
                    type: 'string',
                    description: 'Nội dung bio mới',
                },
            },
            required: ['bio'],
        },
    },
    {
        name: 'update_tags',
        description: 'Cập nhật tags/interests của user. Dùng khi user muốn thay đổi sở thích.',
        parameters: {
            type: 'object',
            properties: {
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Danh sách tags mới',
                },
            },
            required: ['tags'],
        },
    },
    {
        name: 'get_recent_matches',
        description: 'Lấy danh sách những người đã match gần đây',
        parameters: {
            type: 'object',
            properties: {
                limit: {
                    type: 'number',
                    description: 'Số lượng matches muốn lấy (default: 5)',
                },
            },
            required: [],
        },
    },
    {
        name: 'get_who_liked_me',
        description: 'Xem ai đã like mình (chỉ hiện cho premium users hoặc 1 người đầu)',
        parameters: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
    {
        name: 'generate_icebreaker',
        description: 'Tạo câu mở đầu cho một match cụ thể dựa trên profile của họ',
        parameters: {
            type: 'object',
            properties: {
                matchUserId: {
                    type: 'string',
                    description: 'ID của người muốn gửi tin nhắn',
                },
            },
            required: ['matchUserId'],
        },
    },
    {
        name: 'search_match_by_name',
        description: 'Tìm người đang chat/match theo tên. Dùng khi user nhắc đến tên người muốn hẹn thay vì ID. Trả về danh sách matches có tên phù hợp để user chọn nếu có nhiều người trùng tên.',
        parameters: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Tên hoặc một phần tên của người muốn tìm (ví dụ: "Linh", "Mai", "Hùng")',
                },
            },
            required: ['name'],
        },
    },
    {
        name: 'suggest_date_spots',
        description: 'Gợi ý địa điểm hẹn hò gần cả 2 người (quán cà phê, nhà hàng, công viên). Có thể dùng matchUserId hoặc matchName.',
        parameters: {
            type: 'object',
            properties: {
                matchUserId: {
                    type: 'string',
                    description: 'ID của người muốn hẹn (nếu đã biết ID)',
                },
                matchName: {
                    type: 'string',
                    description: 'Tên của người muốn hẹn (nếu chưa biết ID, sẽ tự động tìm kiếm)',
                },
                preferences: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Loại địa điểm mong muốn: cafe, restaurant, park, bar',
                },
            },
            required: [],
        },
    },
    {
        name: 'analyze_profile_strength',
        description: 'Phân tích điểm mạnh/yếu của profile và đưa ra gợi ý cải thiện',
        parameters: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
    {
        name: 'get_conversation_tips',
        description: 'Đưa ra gợi ý trả lời tin nhắn dựa trên context cuộc trò chuyện',
        parameters: {
            type: 'object',
            properties: {
                matchUserId: {
                    type: 'string',
                    description: 'ID của người đang chat',
                },
                recentMessages: {
                    type: 'string',
                    description: 'Nội dung tin nhắn gần đây (optional)',
                },
            },
            required: ['matchUserId'],
        },
    },
];

export interface WingmanToolCall {
    name: string;
    args: Record<string, any>;
}

export interface WingmanMessage {
    role: 'user' | 'assistant' | 'tool';
    content: string;
    toolCall?: {
        name: string;
        args: Record<string, any>;
        result?: any;
    };
    timestamp: Date;
}

export interface DateSpot {
    id: string;
    name: string;
    type: 'cafe' | 'restaurant' | 'park' | 'bar' | 'other';
    address: string;
    coordinates: { lat: number; lng: number };
    distanceFromYou: number;
    distanceFromMatch: number;
    avgDistance: number;
    whyRecommended: string;
    openingHours?: string;
    googleMapsUrl: string;
}

export interface MatchInfo {
    userId: string;
    displayName: string;
    bio?: string;
    tags?: string[];
    occupation?: string;
    matchedAt: Date;
    lastMessage?: string;
    commonInterests: string[];
}

export interface ProfileStrength {
    overallScore: number;
    sections: {
        photos: { score: number; tips: string[] };
        bio: { score: number; tips: string[] };
        tags: { score: number; tips: string[] };
        prompts: { score: number; tips: string[] };
    };
    quickWins: string[];
}
