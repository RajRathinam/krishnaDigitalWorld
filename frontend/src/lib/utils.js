import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const getImageUrl = (path) => {
    if (!path) return '/placeholder.svg';
    if (path.startsWith('http')) return path;

    // Return relative path - let the proxy handle it
    // If it starts with /uploads, return as is (relative)
    if (path.startsWith('/uploads')) return path;

    // If it doesn't start with /, add it
    return path.startsWith('/') ? path : `/${path}`;
};
