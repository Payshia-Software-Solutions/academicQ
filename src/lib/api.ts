
'use client';

import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { toast } = useToast();
    const router = useRouter();

    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors, e.g., redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
      toast({
        variant: 'destructive',
        title: 'Session Expired',
        description: 'Please log in again.',
      });
      router.push('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
