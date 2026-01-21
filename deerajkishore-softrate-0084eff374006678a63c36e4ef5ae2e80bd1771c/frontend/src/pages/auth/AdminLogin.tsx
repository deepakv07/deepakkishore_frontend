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
        <div className="min-h-screen bg-bg-main relative overflow-hidden flex items-center justify-center p-6">
            {/* Soft Pastel Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pastel-orange/40 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pastel-mint/40 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="max-w-md w-full relative z-10 px-4 animate-fade-in">
                <div className="text-center mb-12 space-y-4">
                    <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-amber-600 font-extrabold text-3xl mx-auto mb-8 shadow-2xl shadow-slate-200/50">
                        SB
                    </div>
                    <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        Admin Login
                    </h2>
                    <p className="text-amber-700 text-base font-semibold leading-relaxed">
                        Secure Administration Access
                    </p>
                </div>

                <div className="glass-card p-10 md:p-14 border-white">
                    {error && (
                        <div className="mb-10 p-5 bg-red-50 text-red-700 text-xs font-bold rounded-[1.2rem] flex items-center gap-3">
                            <i className="fas fa-circle-exclamation"></i> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-slate-900/80 uppercase tracking-widest ml-2">Admin Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="elite-input"
                                placeholder="admin@skillbuilder.com"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-slate-900/80 uppercase tracking-widest ml-2">Access Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="elite-input"
                                placeholder="••••••••"
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
                                <span>Enter Dashboard</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
                            Authorized personnel only.
                        </p>
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

export default AdminLogin;
