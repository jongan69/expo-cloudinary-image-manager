/**
 * Optimize Cloudinary image URLs for performance
 * Adds transformations for smaller file sizes and faster loading
 */

export const optimizeCloudinaryImage = (
  url: string,
  width?: number,
  quality: string = 'auto'
): string => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // Check if transformations already exist
  if (url.includes('/upload/')) {
    const parts = url.split('/upload/');
    
    // If URL already has transformations, don't add more
    if (parts[1].includes(',')) {
      return url;
    }
    
    const transformations: string[] = [];
    
    // Add width constraint if specified (reduces file size significantly)
    if (width) {
      const roundedWidth = Math.max(1, Math.round(width));
      transformations.push(`w_${roundedWidth}`);
    }
    
    // Add quality and format optimizations
    transformations.push(`q_${quality}`); // Auto quality optimization
    transformations.push('f_auto'); // Auto format (WebP/AVIF when supported)
    
    const transformString = transformations.join(',');
    return `${parts[0]}/upload/${transformString}/${parts[1]}`;
  }
  
  return url;
};

/**
 * Generate thumbnail URL for list views
 */
export const getThumbnailUrl = (url: string, size: number = 300): string => {
  return optimizeCloudinaryImage(url, size, 'auto');
};

/**
 * Generate optimized URL for detail views
 */
export const getDetailImageUrl = (url: string, maxWidth: number = 1200): string => {
  return optimizeCloudinaryImage(url, maxWidth, 'auto');
};

