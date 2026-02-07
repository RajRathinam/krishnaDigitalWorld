import axios from 'axios';
import { baseUrl } from '@/config/baseUrl';

const api = axios.create({
    baseURL: baseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
