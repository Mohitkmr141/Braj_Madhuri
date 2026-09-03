'use client';

export default function cloudinaryLoader({ src, width, quality }) {
  // Cloudinary Cloud Name for this project
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dvcav350s';

  // Check if the image is an external URL (e.g., from Supabase)
  if (src.startsWith('http')) {
    // f_auto: auto format (WebP/AVIF based on browser)
    // c_limit: scale down if larger, keep aspect ratio
    // w_<width>: resize to requested width
    // q_<quality>: auto quality compression
    const params = ['f_auto', 'c_limit', `w_${width}`, `q_${quality || 'auto'}`];
    
    // Construct the Cloudinary Fetch URL
    return `https://res.cloudinary.com/${cloudName}/image/fetch/${params.join(',')}/${src}`;
  }

  // If it's a local static asset (like /Logo.jpeg), serve it normally
  return src;
}
