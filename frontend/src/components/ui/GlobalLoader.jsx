import React from 'react';
import { useLoader } from '@/contexts/LoaderContext';

export const GlobalLoader = () => {
    const { isLoading } = useLoader();

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="bg-white p-8 rounded shadow-2xl flex flex-col items-center">
                {/* Simple spinner with accent color */}
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
                <p className="mt-4 text-sm font-medium text-gray-600">Loading...</p>
            </div>
        </div>
    );
};