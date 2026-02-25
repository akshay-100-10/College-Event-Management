/**
 * Image Optimization Utilities
 * Compress images before upload to save storage space
 */

interface CompressOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Compress image file before upload
 * Can reduce file size by 70-90% without visible quality loss
 */
export async function compressImage(
    file: File,
    options: CompressOptions = {}
): Promise<File> {
    const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.8,
        format = 'webp'
    } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions while maintaining aspect ratio
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                // Create canvas and draw resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Canvas to Blob conversion failed'));
                            return;
                        }

                        // Create new file from blob
                        const compressedFile = new File(
                            [blob],
                            file.name.replace(/\.[^/.]+$/, `.${format}`),
                            {
                                type: `image/${format}`,
                                lastModified: Date.now(),
                            }
                        );

                        console.log(`Original: ${(file.size / 1024).toFixed(2)}KB → Compressed: ${(compressedFile.size / 1024).toFixed(2)}KB`);
                        resolve(compressedFile);
                    },
                    `image/${format}`,
                    quality
                );
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Validate image file before upload
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB before compression
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Please upload a valid image (JPEG, PNG, or WebP)'
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'Image size must be less than 10MB'
        };
    }

    return { valid: true };
}

/**
 * Generate thumbnail from image
 */
export async function generateThumbnail(
    file: File,
    size: number = 200
): Promise<File> {
    return compressImage(file, {
        maxWidth: size,
        maxHeight: size,
        quality: 0.7,
        format: 'webp'
    });
}
