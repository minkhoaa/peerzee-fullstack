'use client';

import React, { useRef, useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Default cozy placeholders from Unsplash
const DEFAULT_PHOTOS = [
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=500&q=80", // Cute Toy
    "https://images.unsplash.com/photo-1515488042361-25f4682ee084?w=500&q=80", // Cozy Bear
    "https://images.unsplash.com/photo-1519681393798-2f152e8e2e30?w=500&q=80", // Pastel Sky
];

interface ProfilePhotosProps {
    photos: Array<{ id: string; url: string; order?: number }>;
    isOwnProfile: boolean;
    isEditing: boolean;
    onUpload: (file: File) => Promise<void>;
    onDelete: (photoId: string) => Promise<void>;
}

export default function ProfilePhotos({
    photos,
    isOwnProfile,
    isEditing,
    onUpload,
    onDelete,
}: ProfilePhotosProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

    // Display photos: user photos or default placeholders
    const displayPhotos = photos.length > 0 ? photos : DEFAULT_PHOTOS.map((url, i) => ({ 
        id: `default-${i}`, 
        url,
        order: i 
    }));

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh!');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('Ảnh quá lớn! Vui lòng chọn ảnh dưới 10MB.');
            return;
        }

        try {
            setUploadingIndex(photos.length);
            await onUpload(file);
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Upload thất bại. Vui lòng thử lại!');
        } finally {
            setUploadingIndex(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDelete = async (photoId: string) => {
        if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return;

        try {
            setDeletingId(photoId);
            await onDelete(photoId);
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Xóa ảnh thất bại. Vui lòng thử lại!');
        } finally {
            setDeletingId(null);
        }
    };

    const handleImageError = (photoId: string) => {
        setImageErrors((prev) => new Set(prev).add(photoId));
    };

    const getFallbackImage = (index: number) => {
        return DEFAULT_PHOTOS[index % DEFAULT_PHOTOS.length];
    };

    return (
        <div className="w-full">
            {/* Grid Layout */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
                <AnimatePresence mode="popLayout">
                    {displayPhotos.map((photo, index) => (
                        <motion.div
                            key={photo.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="aspect-square rounded-xl overflow-hidden relative group border-3 border-cocoa shadow-pixel hover:shadow-pixel-lg hover:-translate-y-1 transition-all duration-300"
                        >
                            {/* Image */}
                            <img
                                src={imageErrors.has(photo.id) ? getFallbackImage(index) : photo.url}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={() => handleImageError(photo.id)}
                                loading="lazy"
                            />

                            {/* Delete Button (Only for own profile, real photos, in edit mode) */}
                            {isOwnProfile && isEditing && !photo.id.startsWith('default-') && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDelete(photo.id)}
                                    disabled={deletingId === photo.id}
                                    className="absolute top-3 right-3 w-10 h-10 bg-pixel-red text-retro-white rounded-lg flex items-center justify-center border-2 border-cocoa shadow-pixel-sm hover:bg-pixel-red/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                                >
                                    {deletingId === photo.id ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-5 h-5" />
                                    )}
                                </motion.button>
                            )}

                            {/* Overlay on Hover (for edit mode) */}
                            {isOwnProfile && isEditing && (
                                <div className="absolute inset-0 bg-cocoa/0 group-hover:bg-cocoa/10 transition-colors duration-300" />
                            )}
                        </motion.div>
                    ))}

                    {/* Add Photo Widget (Upload Trigger) */}
                    {isOwnProfile && isEditing && photos.length < 9 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: displayPhotos.length * 0.05 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded-xl border-3 border-dashed border-cocoa-light bg-retro-paper flex flex-col items-center justify-center cursor-pointer hover:bg-pixel-pink/10 hover:border-pixel-pink transition-all duration-300 group"
                        >
                            {uploadingIndex !== null ? (
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="w-12 h-12 text-pixel-pink animate-spin" />
                                    <span className="text-sm font-bold text-cocoa">Đang tải...</span>
                                </div>
                            ) : (
                                <>
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        transition={{ duration: 0.3 }}
                                        className="w-16 h-16 rounded-xl bg-pixel-pink flex items-center justify-center mb-3 border-2 border-cocoa shadow-pixel-sm"
                                    >
                                        <Plus className="w-8 h-8 text-cocoa" strokeWidth={3} />
                                    </motion.div>
                                    <span className="text-sm font-bold text-cocoa group-hover:text-pixel-pink-dark transition-colors">
                                        Thêm ảnh
                                    </span>
                                    <span className="text-xs text-cocoa-light mt-1 font-medium">
                                        ({photos.length}/9)
                                    </span>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Info Text (when not editing) */}
            {!isEditing && isOwnProfile && photos.length === 0 && (
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-sm text-cocoa-light mt-6 font-medium"
                >
                    💡 Nhấn "Chỉnh sửa" để thêm ảnh của bạn!
                </motion.p>
            )}
        </div>
    );
}
