import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface StudentLayoutProps {
    children: React.ReactNode;
    hideNavbar?: boolean;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ children, hideNavbar = false }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        if (!isDarkMode) {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }, [isDarkMode]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const navItems = [
        { label: 'PORTAL', path: '/student/dashboard', icon: 'fa-th-large' },
        { label: 'QUIZZES', path: '/student/quizzes', icon: 'fa-file-invoice' },
        { label: 'REPORTS', path: '/student/report', icon: 'fa-chart-line' },
        { label: 'PROFILE', path: '/student/profile', icon: 'fa-user' },
    ];

    return (
        <div className="min-h-screen bg-[#030508] text-white font-inter pb-24 md:pb-0">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#00E5FF11] to-transparent" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#9D4EDD08] rounded-full blur-[150px]" />
            </div>

            {/* Header */}
            {!hideNavbar && (
                <header className="sticky top-0 z-50 bg-[#030508]/80 backdrop-blur-xl border-b border-white/5 py-4">
                    <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                        <div>
                            <Link to="/student/dashboard" className="flex items-center gap-3 group">
                                <div className="w-10 h-10 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center group-hover:border-[#00E5FF33] transition-colors">
                                    <i className="fas fa-image text-white/10 text-xs"></i>
                                </div>
                                <span className="text-2xl font-black tracking-tighter">SkillBuilder</span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className="relative w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors group"
                                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            >
                                <i className={`fas ${isDarkMode ? 'fa-moon' : 'fa-sun'} text-[#8E9AAF] group-hover:text-[#00E5FF]`}></i>
                            </button>
                            <button
                                onClick={() => setShowLogoutModal(true)}
                                className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-red-500/20 px-4 py-2 rounded-xl transition-all border border-white/10 group"
                            >
                                <i className="fas fa-power-off text-xs text-[#8E9AAF] group-hover:text-red-400"></i>
                                <span className="text-xs font-black tracking-widest uppercase">Logout</span>
                            </button>
                        </div>
                    </div>
                </header>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8 relative z-10 md:pl-28">
                {children}
            </main>

            {/* Bottom Navigation (Mobile/Tablet Focused) */}
            {!hideNavbar && (
                <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#030508]/90 backdrop-blur-2xl border-t border-white/10 px-6 py-4 md:hidden">
                    <div className="flex justify-around items-center max-w-lg mx-auto">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    className="flex flex-col items-center gap-1.5 group"
                                >
                                    <div className={`text-xl transition-all duration-300 ${isActive ? 'neon-text-cyan scale-110' : 'text-[#8E9AAF] group-hover:text-white'}`}>
                                        <i className={`fas ${item.icon}`}></i>
                                    </div>
                                    <span className={`text-[9px] font-black tracking-widest transition-colors ${isActive ? 'text-[#00E5FF]' : 'text-[#8E9AAF] group-hover:text-white'}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            )}

            {/* Desktop Navigation (Sidebar-alternative) */}
            {!hideNavbar && (
                <div className="hidden md:block fixed left-0 top-1/2 -translate-y-1/2 z-50 ml-6">
                    <div className="glass-card p-3 flex flex-col gap-6">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 relative group ${isActive ? 'bg-[#00E5FF] text-black shadow-[0_0_20px_#00E5FF55]' : 'bg-white/5 text-[#8E9AAF] hover:bg-white/10 hover:text-white'}`}
                                >
                                    <i className={`fas ${item.icon} text-lg`}></i>
                                    {/* Tooltip */}
                                    <span className="absolute left-16 bg-[#030508] border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card max-w-sm w-full p-8 space-y-6 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto text-2xl">
                            <i className="fas fa-power-off"></i>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black tracking-tighter">Confirm Logout</h3>
                            <p className="text-[#8E9AAF] text-sm font-medium leading-relaxed">
                                Are you sure you want to exit? Your session will be terminated.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 py-3 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black tracking-widest uppercase transition-all"
                            >
                                Stay
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 py-3 px-6 rounded-xl bg-red-500 text-white hover:bg-red-600 text-xs font-black tracking-widest uppercase transition-all shadow-lg shadow-red-500/20"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentLayout;
