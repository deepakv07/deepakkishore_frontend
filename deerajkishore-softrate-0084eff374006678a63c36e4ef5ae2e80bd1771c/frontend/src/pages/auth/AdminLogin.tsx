import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    React.useEffect(() => {
        document.body.classList.remove('light-theme');
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email) {
            setError('Email is required');
            setLoading(false);
            return;
        }

        if (!password) {
            setError('Password is required');
            setLoading(false);
            return;
        }

        try {
            await login({ email, password }, 'admin');
            navigate('/admin/dashboard');
        } catch (err: any) {
            console.error('Admin login error:', err);
            const errorMessage = err?.response?.data?.message ||
                err?.message ||
                'Invalid email or password. Please try again.';
            setError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030508] relative overflow-hidden flex items-center justify-center p-6">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00E5FF]/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#9D4EDD]/10 rounded-full blur-[120px]" />

            <div className="max-w-md w-full relative z-10 px-4">
                <div className="text-center mb-6 md:mb-10 space-y-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#00E5FF] to-[#9D4EDD] rounded-2xl flex items-center justify-center text-black font-black text-2xl md:text-3xl mx-auto mb-4 md:mb-6 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
                        SB
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">Administrator Panel</h2>
                    <p className="text-[#00E5FF] font-medium tracking-wide text-xs md:text-sm opacity-70">Secure sign-in for platform management</p>
                </div>

                <div className="glass-card p-6 md:p-10 border-white/10">
                    {error && (
                        <div className="mb-8 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-400 text-sm rounded-r-lg">
                            <i className="fas fa-exclamation-triangle mr-2"></i> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-400 ml-1">Admin Email</label>
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
                            <label className="block text-sm font-bold text-gray-400 ml-1">Password *</label>
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
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="elite-button w-full py-4 text-sm font-bold tracking-wide disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin mr-2"></i> Initializing...
                                </>
                            ) : 'Sign In as Admin'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-[#8E9AAF] leading-relaxed">
                            Note: Administrator access is restricted to authorized personnel only.
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs">
                    <button
                        onClick={() => navigate('/role-selection')}
                        className="text-[#8E9AAF] hover:text-white transition-all flex items-center justify-center gap-2 mx-auto font-bold tracking-wide"
                    >
                        <i className="fas fa-chevron-left text-[10px]"></i> Return to Role Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
