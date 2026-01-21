// Predefined tags organized by categories
export interface TagCategory {
    name: string;
    emoji: string;
    tags: { label: string; emoji: string }[];
}

export const TAG_CATEGORIES: TagCategory[] = [
    {
        name: 'Sở thích',
        emoji: '🎯',
        tags: [
            { label: 'Du lịch', emoji: '✈️' },
            { label: 'Ẩm thực', emoji: '🍜' },
            { label: 'Nhiếp ảnh', emoji: '📸' },
            { label: 'Âm nhạc', emoji: '🎵' },
            { label: 'Phim ảnh', emoji: '🎬' },
            { label: 'Đọc sách', emoji: '📚' },
            { label: 'Gaming', emoji: '🎮' },
            { label: 'Nghệ thuật', emoji: '🎨' },
            { label: 'Thời trang', emoji: '👗' },
            { label: 'Công nghệ', emoji: '💻' },
        ],
    },
    {
        name: 'Thể thao',
        emoji: '🏃',
        tags: [
            { label: 'Gym', emoji: '💪' },
            { label: 'Yoga', emoji: '🧘' },
            { label: 'Chạy bộ', emoji: '🏃' },
            { label: 'Bơi lội', emoji: '🏊' },
            { label: 'Đạp xe', emoji: '🚴' },
            { label: 'Bóng đá', emoji: '⚽' },
            { label: 'Cầu lông', emoji: '🏸' },
            { label: 'Tennis', emoji: '🎾' },
            { label: 'Dance', emoji: '💃' },
            { label: 'Hiking', emoji: '🥾' },
        ],
    },
    {
        name: 'Ẩm thực',
        emoji: '🍕',
        tags: [
            { label: 'Cà phê', emoji: '☕' },
            { label: 'Trà sữa', emoji: '🧋' },
            { label: 'Nấu ăn', emoji: '👨‍🍳' },
            { label: 'Ăn vặt', emoji: '🍿' },
            { label: 'BBQ', emoji: '🍖' },
            { label: 'Hải sản', emoji: '🦐' },
            { label: 'Đồ Nhật', emoji: '🍣' },
            { label: 'Đồ Hàn', emoji: '🍲' },
            { label: 'Ăn chay', emoji: '🥗' },
            { label: 'Rượu vang', emoji: '🍷' },
        ],
    },
    {
        name: 'Lối sống',
        emoji: '🌟',
        tags: [
            { label: 'Thức khuya', emoji: '🦉' },
            { label: 'Dậy sớm', emoji: '🌅' },
            { label: 'Introvert', emoji: '🏠' },
            { label: 'Extrovert', emoji: '🎉' },
            { label: 'Workaholic', emoji: '💼' },
            { label: 'Thư giãn', emoji: '😌' },
            { label: 'Thiền định', emoji: '🧘‍♂️' },
            { label: 'Tối giản', emoji: '✨' },
        ],
    },
    {
        name: 'Thú cưng',
        emoji: '🐾',
        tags: [
            { label: 'Chó', emoji: '🐕' },
            { label: 'Mèo', emoji: '🐈' },
            { label: 'Cá', emoji: '🐠' },
            { label: 'Chim', emoji: '🐦' },
            { label: 'Hamster', emoji: '🐹' },
            { label: 'Thích thú cưng', emoji: '❤️' },
        ],
    },
    {
        name: 'Giải trí',
        emoji: '🎭',
        tags: [
            { label: 'Netflix', emoji: '📺' },
            { label: 'K-pop', emoji: '🎤' },
            { label: 'Anime', emoji: '🎌' },
            { label: 'Concert', emoji: '🎸' },
            { label: 'Stand-up', emoji: '😂' },
            { label: 'Board game', emoji: '🎲' },
            { label: 'Karaoke', emoji: '🎤' },
            { label: 'Đi bar', emoji: '🍻' },
        ],
    },
];

// Flatten all tags for easy search
export const ALL_TAGS = TAG_CATEGORIES.flatMap((cat) =>
    cat.tags.map((t) => ({ ...t, category: cat.name }))
);

// Get tag with emoji display
export function getTagDisplay(label: string): string {
    const tag = ALL_TAGS.find((t) => t.label === label);
    return tag ? `${tag.emoji} ${tag.label}` : label;
}

// Zodiac signs
export const ZODIAC_SIGNS = [
    { label: 'Bạch Dương', emoji: '♈', dates: '21/3 - 19/4' },
    { label: 'Kim Ngưu', emoji: '♉', dates: '20/4 - 20/5' },
    { label: 'Song Tử', emoji: '♊', dates: '21/5 - 20/6' },
    { label: 'Cự Giải', emoji: '♋', dates: '21/6 - 22/7' },
    { label: 'Sư Tử', emoji: '♌', dates: '23/7 - 22/8' },
    { label: 'Xử Nữ', emoji: '♍', dates: '23/8 - 22/9' },
    { label: 'Thiên Bình', emoji: '♎', dates: '23/9 - 22/10' },
    { label: 'Bọ Cạp', emoji: '♏', dates: '23/10 - 21/11' },
    { label: 'Nhân Mã', emoji: '♐', dates: '22/11 - 21/12' },
    { label: 'Ma Kết', emoji: '♑', dates: '22/12 - 19/1' },
    { label: 'Bảo Bình', emoji: '♒', dates: '20/1 - 18/2' },
    { label: 'Song Ngư', emoji: '♓', dates: '19/2 - 20/3' },
];

// Education levels
export const EDUCATION_LEVELS = [
    'THPT',
    'Trung cấp',
    'Cao đẳng',
    'Đại học',
    'Thạc sĩ',
    'Tiến sĩ',
];
