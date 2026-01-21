import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const GoogleCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { socialLogin } = useAuth();
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const processingRef = useRef(false);

    useEffect(() => {
        const processCallback = async () => {
            // Prevent duplicate processing with ref (better than state for effects)
            if (processingRef.current) return;

            const code = searchParams.get('code');
            const errorParam = searchParams.get('error');

            if (errorParam) {
                setError('Google authentication was cancelled or failed.');
                setLoading(false);
                return;
            }

            if (!code) {
                setError('No authorization code received from Google.');
                setLoading(false);
                return;
            }

            try {
                processingRef.current = true;
                console.log('🔄 Starting Google OAuth flow...');
                console.log('Debug - Client ID available:', !!import.meta.env.VITE_GOOGLE_CLIENT_ID);
                console.log('Debug - Client Secret available:', !!import.meta.env.VITE_GOOGLE_CLIENT_SECRET);

                // Exchange authorization code for access token
                const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        code,
                        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                        client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
                        redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`,
                        grant_type: 'authorization_code',
                    }),
                });

                if (!tokenResponse.ok) {
                    const errorData = await tokenResponse.json().catch(() => ({}));
                    console.error('❌ Token exchange failed:', errorData);
                    throw new Error(errorData.error_description || errorData.error || 'Failed to exchange code for token');
                }

                const tokenData = await tokenResponse.json();
                const accessToken = tokenData.access_token;

                if (!accessToken) {
                    throw new Error('No access token received from Google');
                }

                // Get user info from Google
                const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!userResponse.ok) {
                    throw new Error('Failed to get user info from Google');
                }

                const userData = await userResponse.json();
                const email = userData.email;
                const name = userData.name; // Extract name for signup if needed

                if (!email) {
                    throw new Error('No email received from Google');
                }

                console.log('✅ User info retrieved:', email);

                // Use the centralized login method from context (helper handles signup if login fails)
                await socialLogin(email, name || email.split('@')[0]);

                console.log('✅ Login successful, navigating to dashboard...');
                navigate('/student/dashboard');

            } catch (err: any) {
                console.error('❌ Google auth error:', err);
                const errorMessage = err?.message || 'Failed to authenticate with Google. Please try again.';
                setError(errorMessage);
                setLoading(false);
                processingRef.current = false;
            }
        };

        processCallback();
    }, [searchParams, navigate, socialLogin]);



    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-6">
                <div className="text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-8 overflow-hidden p-3 animate-pulse">
                        <img src="/logo.png" className="w-full h-full object-contain" alt="Skill Builder" />
                    </div>
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
                    <p className="text-white font-black uppercase tracking-[0.2em] text-xs">Authenticating...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 md:p-14 text-center">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-10 overflow-hidden p-3">
                        <img src="/logo.png" className="w-full h-full object-contain" alt="Skill Builder" />
                    </div>
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Auth Failure</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                setError('');
                                setLoading(true);
                                // Retry by going back to login and trying again
                                navigate('/student/login');
                            }}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => navigate('/student/login')}
                            className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-300 transition"
                        >
                            Return to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default GoogleCallback;

