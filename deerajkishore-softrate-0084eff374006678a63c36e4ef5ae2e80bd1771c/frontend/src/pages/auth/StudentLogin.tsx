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

    React.useEffect(() => {
        document.body.classList.remove('light-theme');
    }, []);

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
        <div className="min-h-screen bg-bg-main relative overflow-hidden flex items-center justify-center p-6">
            {/* Soft Pastel Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pastel- blue/40 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pastel-pink/40 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="max-w-md w-full relative z-10 px-4 animate-fade-in">
                <div className="text-center mb-12 space-y-4">
                    <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-slate-200/50 overflow-hidden p-3">
                        <img src="/logo.png" className="w-full h-full object-contain" alt="Skill Builder" />
                    </div>
                    <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        {isLogin ? 'Welcome Back' : 'Get Started'}
                    </h2>
                    <p className="text-slate-700 text-base font-semibold leading-relaxed">
                        {isLogin ? 'Ready to pick up where you left off?' : 'Start your learning journey with us today.'}
                    </p>
                </div>

                <div className="glass-card p-10 md:p-14 border-white">
                    <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] mb-10">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-700'}`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-700'}`}
                        >
                            Join
                        </button>
                    </div>

                    {error && (
                        <div className="mb-10 p-5 bg-red-50 text-red-700 text-xs font-bold rounded-[1.2rem] flex items-center gap-3">
                            <i className="fas fa-circle-exclamation"></i> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {!isLogin && (
                            <div className="space-y-3">
                                <label className="block text-[10px] font-bold text-slate-900/80 uppercase tracking-widest ml-2">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="elite-input"
                                    placeholder="Enter your name"
                                />
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-slate-900/80 uppercase tracking-widest ml-2">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="elite-input"
                                placeholder="email@address.com"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-slate-900/80 uppercase tracking-widest ml-2">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="elite-input"
                                placeholder="••••••••"
                                minLength={isLogin ? 1 : 6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="elite-button w-full shadow-2xl shadow-slate-200"
                        >
                            {loading ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                                <span>{isLogin ? 'Continue' : 'Create Account'}</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-12">
                        <div className="relative flex items-center justify-center mb-10">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <span className="relative px-6 bg-white text-slate-900/60 text-[10px] font-bold uppercase tracking-widest">or</span>
                        </div>

                        <button
                            onClick={() => {
                                const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                                const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`;
                                window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email profile openid&access_type=offline`;
                            }}
                            className="w-full flex items-center justify-center gap-4 py-5 bg-slate-50 hover:bg-slate-100 rounded-[1.5rem] transition-all font-bold text-slate-900 text-[10px] tracking-widest uppercase"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-4 h-4" alt="Google" />
                            Sign in with Google
                        </button>
                    </div>
                </div>

                <div className="mt-14 text-center">
                    <button
                        onClick={() => navigate('/role-selection')}
                        className="text-slate-900/60 hover:text-slate-900 transition-all flex items-center justify-center gap-4 mx-auto font-bold tracking-widest uppercase text-[10px]"
                    >
                        <i className="fas fa-arrow-left"></i> Change Role
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentLogin;
