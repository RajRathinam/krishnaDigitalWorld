import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    // Use environment variable or default to localhost:5000
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
