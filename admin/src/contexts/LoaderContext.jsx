import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

const LoaderContext = createContext();

export const useLoader = () => useContext(LoaderContext);

export const LoaderProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    // Using a ref for count to avoid closure staleness in interceptors if they were recreated, 
    // but simpler state update pattern is fine too.

    useEffect(() => {
        let count = 0;

        const showLoader = () => {
            count++;
            setIsLoading(true);
        };

        const hideLoader = () => {
            count = Math.max(0, count - 1);
            if (count === 0) {
                setIsLoading(false);
            }
        };

        const reqInterceptor = api.interceptors.request.use(
            (config) => {
                showLoader();
                return config;
            },
            (error) => {
                hideLoader();
                return Promise.reject(error);
            }
        );

        const resInterceptor = api.interceptors.response.use(
            (response) => {
                hideLoader();
                return response;
            },
            (error) => {
                hideLoader();
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.request.eject(reqInterceptor);
            api.interceptors.response.eject(resInterceptor);
        };
    }, []);

    return (
        <LoaderContext.Provider value={{ isLoading }}>
            {children}
        </LoaderContext.Provider>
    );
};
