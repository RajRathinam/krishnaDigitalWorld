import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const getImageUrl = (path) => {
    if (!path) return '/placeholder.svg';
    
    // If it's already a full URL (starts with http), return as is
    if (path.startsWith('http')) return path;
    
    // If it starts with /uploads, check if we need to prefix with API URL
    if (path.startsWith('/uploads')) {
        // If we're in development mode and want to use the local API
        if (import.meta.env.DEV && import.meta.env.VITE_API_URL) {
            // Check if path is already a full URL from the API
            if (!path.startsWith(import.meta.env.VITE_API_URL)) {
                return `${import.meta.env.VITE_API_URL}${path}`;
            }
        }
        // In production or if no API_URL, return relative path
        return path;
    }
    
    // If it doesn't start with /, add it
    return path.startsWith('/') ? path : `/${path}`;
};