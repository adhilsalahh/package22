import { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
    priority?: boolean;
    placeholder?: 'blur' | 'empty';
    onLoad?: () => void;
}

/**
 * OptimizedImage component with lazy loading and performance optimizations
 * - Uses Intersection Observer for true lazy loading
 * - Shows blur placeholder while loading
 * - Proper width/height to prevent CLS
 * - Priority loading for LCP images
 */
export const OptimizedImage = ({
    src,
    alt,
    className = '',
    width,
    height,
    priority = false,
    placeholder = 'blur',
    onLoad,
}: OptimizedImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (priority) {
            setIsInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '200px', // Start loading 200px before visible
                threshold: 0.01,
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [priority]);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    // Generate blur placeholder
    const blurStyle = placeholder === 'blur' && !isLoaded ? {
        filter: 'blur(10px)',
        transform: 'scale(1.1)',
    } : {};

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden ${className}`}
            style={{
                width: width ? `${width}px` : '100%',
                height: height ? `${height}px` : '100%',
                backgroundColor: '#f3f4f6', // gray-100 placeholder
            }}
        >
            {isInView && (
                <img
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    loading={priority ? 'eager' : 'lazy'}
                    decoding={priority ? 'sync' : 'async'}
                    fetchPriority={priority ? 'high' : 'auto'}
                    onLoad={handleLoad}
                    className={`w-full h-full object-cover transition-all duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                    style={{
                        ...blurStyle,
                        transition: 'filter 0.3s ease, transform 0.3s ease, opacity 0.3s ease',
                    }}
                />
            )}

            {/* Placeholder skeleton */}
            {!isLoaded && (
                <div
                    className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"
                    style={{
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite',
                    }}
                />
            )}

            <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
        </div>
    );
};

/**
 * Preload critical images for LCP optimization
 * Call this in your main App or HomePage for hero images
 */
export const preloadImage = (src: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
};

/**
 * Get optimized image URL with size parameters
 * For future CDN/image optimization service integration
 */
export const getOptimizedImageUrl = (src: string, _width?: number, _quality = 80): string => {
    // If using a CDN like Cloudinary, Imgix, or Vercel Image Optimization,
    // you would transform the URL here. For now, return as-is.
    // Example for Cloudinary:
    // return `https://res.cloudinary.com/your-cloud/image/fetch/w_${width},q_${quality}/${src}`;
    return src;
};
