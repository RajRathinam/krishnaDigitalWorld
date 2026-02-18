import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const getImageUrl = (path) => {
    if (!path) return '/placeholder.svg';
    
    // If it's already a full URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    
    // If it starts with /uploads, construct the full URL
    if (path.startsWith('/uploads')) {
        // Remove leading slash if present to avoid double slash
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        
        // Use API URL from environment variable
        if (import.meta.env.VITE_API_URL) {
            const baseUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '');
            return `${baseUrl}/${cleanPath}`;
        }
        
        // Fallback: return as relative path
        return `/${cleanPath}`;
    }
    
    // For other paths, ensure they start with /
    return path.startsWith('/') ? path : `/${path}`;
};

// Add getVideoUrl function (similar to getImageUrl)
export const getVideoUrl = (path) => {
    if (!path) return '';
    
    // If it's already a full URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    
    // If it's a data URL (for previews), return as is
    if (path.startsWith('data:')) {
        return path;
    }
    
    // If it starts with /uploads, construct the full URL
    if (path.startsWith('/uploads')) {
        // Remove leading slash if present to avoid double slash
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        
        // Use API URL from environment variable
        if (import.meta.env.VITE_API_URL) {
            const baseUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '');
            return `${baseUrl}/${cleanPath}`;
        }
        
        // Fallback: return as relative path
        return `/${cleanPath}`;
    }
    
    // For other paths, ensure they start with /
    return path.startsWith('/') ? path : `/${path}`;
};

// Optional: Add formatDate function if needed elsewhere
export const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};