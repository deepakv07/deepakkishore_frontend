import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const StudentLogin: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login({ email, password }, 'student');
                navigate('/student/dashboard');
            } else {
                await register({ name, email, password, role: 'student' });
                navigate('/student/dashboard');
            }
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message ||
                err?.message ||
                'Authentication failed. Please check your credentials and try again.';
            setError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030508] relative overflow-hidden flex items-center justify-center p-6">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#9D4EDD]/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00E5FF]/10 rounded-full blur-[120px]" />

            <div className="max-w-md w-full relative z-10">
                <div className="text-center mb-10 space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#00E5FF] to-[#9D4EDD] rounded-2xl flex items-center justify-center text-black font-black text-3xl mx-auto mb-6 shadow-[0_0_30px_rgba(157,78,221,0.2)]">
                        SB
                    </div>
                    {/* <p className="text-[#9D4EDD] font-bold tracking-[0.4em] text-xs uppercase opacity-70">Student Portal</p> */}
                    <h2 className="text-4xl font-black text-white tracking-tighter">
                        {isLogin ? 'Student Login' : 'Create Account'}
                    </h2>
                    {!isLogin && (
                        <p className="text-[#8E9AAF] text-sm italic">Join our learning community today.</p>
                    )}
                    {isLogin && (
                        <p className="text-[#8E9AAF] text-sm">Welcome back! Please enter your details.</p>
                    )}
                </div>

                <div className="glass-card p-10 border-white/10">
                    <div className="flex bg-white/5 p-1 rounded-xl mb-8">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${isLogin ? 'bg-[#9D4EDD] text-black shadow-lg shadow-[#9D4EDD]/20' : 'text-[#8E9AAF] hover:text-white'}`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${!isLogin ? 'bg-[#9D4EDD] text-black shadow-lg shadow-[#9D4EDD]/20' : 'text-[#8E9AAF] hover:text-white'}`}
                        >
                            Enlist
                        </button>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-400 text-sm rounded-r-lg">
                            <i className="fas fa-exclamation-triangle mr-2"></i> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-white uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E9AAF]">
                                        <i className="fas fa-user text-sm"></i>
                                    </span>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="elite-input pl-12"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-xs font-black text-white uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E9AAF]">
                                    <i className="fas fa-envelope text-sm"></i>
                                </span>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="elite-input pl-12"
                                    placeholder="Email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-black text-white uppercase tracking-widest ml-1">Password *</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E9AAF]">
                                    <i className="fas fa-lock text-sm"></i>
                                </span>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="elite-input pl-12"
                                    placeholder="Password"
                                    minLength={isLogin ? 1 : 6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="elite-button w-full py-4 text-xs tracking-widest uppercase disabled:opacity-50 !from-[#9D4EDD] !to-[#0077FF]"
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin mr-2"></i> Processing...
                                </>
                            ) : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <div className="mt-8">
                        <div className="relative flex items-center justify-center mb-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <span className="relative px-4 bg-[#0A0E14] text-[#8E9AAF] text-[10px] uppercase tracking-widest">or continue with</span>
                        </div>

                        <button
                            onClick={() => {
                                const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                                const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`;
                                window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email profile openid&access_type=offline`;
                            }}
                            className="w-full flex items-center justify-center gap-3 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition font-bold text-white text-xs tracking-widest uppercase"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-4 h-4" alt="Google" />
                            Continue with Google
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs">
                    <button
                        onClick={() => navigate('/role-selection')}
                        className="text-[#8E9AAF] hover:text-white transition-all flex items-center justify-center gap-2 mx-auto font-bold tracking-widest uppercase"
                    >
                        <i className="fas fa-arrow-left text-[10px]"></i> Back to Role Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentLogin;
