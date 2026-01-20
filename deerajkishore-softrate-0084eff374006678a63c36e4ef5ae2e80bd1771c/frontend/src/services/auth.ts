import apiService from './api';
import type { LoginCredentials, RegisterData, User } from '../types';

export const authService = {
    async studentLogin(credentials: LoginCredentials) {
        try {
            const data = await apiService.studentLogin(credentials);
            if (data.token) {
                // Clear admin token if exists to avoid conflicts
                localStorage.removeItem('admin_auth_token');
                localStorage.setItem('student_auth_token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                console.log('✅ Student token stored:', data.user?.role);
            }
            return data;
        } catch (error: any) {
            console.error('Student login error:', error);
            throw error;
        }
    },

    async adminLogin(credentials: LoginCredentials) {
        try {
            const data = await apiService.adminLogin(credentials);
            if (data.token) {
                // Clear student token if exists to avoid conflicts
                localStorage.removeItem('student_auth_token');
                localStorage.setItem('admin_auth_token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                console.log('✅ Admin token stored:', data.user?.role);
            }
            return data;
        } catch (error: any) {
            console.error('Admin login error:', error);
            throw error;
        }
    },

    async register(registerData: RegisterData) {
        const data = await apiService.register(registerData);
        if (data.token) {
            localStorage.setItem('student_auth_token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },

    logout() {
        localStorage.removeItem('student_auth_token');
        localStorage.removeItem('admin_auth_token');
        localStorage.removeItem('user');
    },

    getCurrentUser(): User | null {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    },

    isAuthenticated(): boolean {
        return !!(
            localStorage.getItem('student_auth_token') ||
            localStorage.getItem('admin_auth_token')
        );
    },

    async googleLogin(email: string, name?: string) {
        try {
            console.log('🔐 Processing Google login in auth service for:', email);
            const data = await apiService.googleLogin(email, name);
            if (data.token) {
                // Clear admin token if exists to avoid conflicts
                localStorage.removeItem('admin_auth_token');
                localStorage.setItem('student_auth_token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                console.log('✅ Google login success, token stored');
            }
            return data;
        } catch (error: any) {
            console.error('Google login service error:', error);
            throw error;
        }
    }
};

export const GOOGLE_REDIRECT_URI = 'http://localhost:5173/auth/callback';

export default authService;
