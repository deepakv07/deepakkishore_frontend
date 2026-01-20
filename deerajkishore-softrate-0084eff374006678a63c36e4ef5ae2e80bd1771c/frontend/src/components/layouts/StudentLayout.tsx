import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface StudentLayoutProps {
    children: React.ReactNode;
    hideNavbar?: boolean;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ children, hideNavbar = false }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'dark' : true;
    });
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        if (!isDarkMode) {
            document.body.classList.add('light-theme');
            document.documentElement.classList.remove('dark');
        } else {
            document.body.classList.remove('light-theme');
            document.documentElement.classList.add('dark');
        }
    }, [isDarkMode]);

    // Close sidebar on mobile when navigating
    useEffect(() => {
        if (window.innerWidth <= 1024) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1024) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = [
        { label: 'Portal', path: '/student/dashboard', icon: 'fas fa-th-large' },
        { label: 'Quizzes', path: '/student/quizzes', icon: 'fas fa-file-invoice' },
        { label: 'Reports', path: '/student/report', icon: 'fas fa-chart-line' },
        { label: 'Profile', path: '/student/profile', icon: 'fas fa-user' },
    ];

    if (hideNavbar) {
        return <div className="min-h-screen bg-bg-main text-text-main font-inter transition-colors duration-300">{children}</div>;
    }

    return (
        <div className="flex min-h-screen bg-bg-main text-text-main font-sans selection:bg-[#00E5FF33] selection:text-[#00E5FF] transition-colors duration-300">
            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-[#00000088] backdrop-blur-md z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Tactical Control Panel */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-card-bg backdrop-blur-2xl border-r border-border-color flex flex-col transform transition-all duration-500 ease-in-out shadow-[20px_0_50px_rgba(0,0,0,0.5)] ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 overflow-hidden'
                }`}>


                <nav className="flex-1 p-8 space-y-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center space-x-5 p-5 rounded-2xl transition-all duration-300 group ${isActive
                                    ? `bg-[#00E5FF11] ${isDarkMode ? 'text-white' : 'text-[#00838F]'} border border-[#00E5FF33] shadow-[0_0_30px_rgba(0,229,255,0.05)]`
                                    : 'text-gray-500 hover:text-text-main hover:bg-card-bg border border-transparent'
                                }`
                            }
                        >
                            <div className={`p-2 rounded-xl transition-colors duration-300 ${location.pathname === item.path ? `bg-[#00E5FF22] ${isDarkMode ? 'text-[#00E5FF]' : 'text-[#00838F]'}` : 'group-hover:text-gray-300'}`}>
                                <i className={`${item.icon} text-lg`}></i>
                            </div>
                            <span className="font-black text-xs uppercase tracking-[0.2em]">{item.label}</span>
                            {location.pathname === item.path && (
                                <div className={`ml-auto w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-[#00E5FF]' : 'bg-[#00838F]'} shadow-[0_0_10px_#00E5FF]`}></div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-8 border-t border-border-color space-y-6">
                    <div className="flex items-center space-x-5 p-5 bg-card-bg rounded-2xl border border-border-color group hover:border-[#00E5FF22] transition-colors duration-500">
                        <div className="w-12 h-12 bg-[#00E5FF11] border border-[#00E5FF33] rounded-xl flex items-center justify-center text-[#00E5FF] transition-transform group-hover:scale-110 duration-500 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                            <i className="fas fa-user-graduate text-xl"></i>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-black text-text-main truncate tracking-tight uppercase">{user?.name || 'Student'}</p>
                            <p className="text-[10px] font-bold text-gray-500 truncate uppercase tracking-widest">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full flex items-center justify-center space-x-4 py-5 bg-[#FF3D000D] text-[#FF3D00] rounded-2xl hover:bg-[#FF3D001A] transition-all duration-300 font-black text-[10px] uppercase tracking-[0.3em] border border-[#FF3D0022] hover:border-[#FF3D0044] hover:shadow-[0_0_30px_rgba(255,61,0,0.1)] group"
                    >
                        <i className="fas fa-power-off group-hover:rotate-90 transition-transform duration-500"></i>
                        <span>LOGOUT ACCOUNT</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>

                <header className="px-10 py-6 flex items-center bg-transparent sticky top-0 z-30">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-14 h-14 flex items-center justify-center rounded-2xl bg-card-bg backdrop-blur-xl border border-border-color text-gray-400 hover:text-white hover:border-[#00E5FF44] hover:shadow-[0_0_20px_rgba(0,229,255,0.1)] transition-all duration-300 group mr-6"
                        title={isSidebarOpen ? 'Retract Panel' : 'Expand Panel'}
                    >
                        <i className={`fas ${isSidebarOpen ? 'fa-align-right' : 'fa-align-left'} text-lg transition-transform group-hover:scale-110`}></i>
                    </button>

                    <div className="flex items-center space-x-5 relative overflow-hidden group mr-auto">
                        <div className="w-12 h-12 bg-[#00E5FF11] border border-[#00E5FF33] rounded-2xl flex items-center justify-center text-[#00E5FF] font-black text-xl shadow-[0_0_20px_rgba(0,229,255,0.1)] group-hover:shadow-[0_0_30px_rgba(0,229,255,0.2)] transition-all duration-500">
                            SB
                        </div>
                        <div className="hidden sm:block">
                            <span className="text-xl font-black text-text-main tracking-tighter block group-hover:text-[#00E5FF] transition-colors">
                                SkillBuilder
                            </span>
                            <span className="text-[8px] font-black text-[#00E5FF] uppercase tracking-[0.4em] opacity-70">STUDENT PORTAL</span>
                        </div>
                    </div>

                    <div className="ml-auto flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end text-right">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Student Session</span>
                        </div>
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="w-10 h-10 rounded-xl bg-card-bg border border-border-color flex items-center justify-center hover:bg-white/10 transition-colors group"
                            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            <i className={`fas ${isDarkMode ? 'fa-moon' : 'fa-sun'} text-[#8E9AAF] group-hover:text-[#00E5FF]`}></i>
                        </button>
                        <button
                            onClick={() => navigate('/student/notifications')}
                            className="w-10 h-10 rounded-xl bg-card-bg border border-border-color flex items-center justify-center text-gray-400 hover:text-[#00E5FF] hover:border-[#00E5FF44] hover:shadow-[0_0_15px_rgba(0,229,255,0.1)] transition-all duration-300 group"
                            title="Notifications"
                        >
                            <i className="fas fa-bell group-hover:animate-swing"></i>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6 lg:p-12 pt-2 lg:pt-0 relative z-10">
                    {children}
                </div>
            </main>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card max-w-sm w-full p-8 space-y-6 border-border-color shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto text-2xl">
                            <i className="fas fa-power-off"></i>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black tracking-tighter text-text-main">Confirm Logout</h3>
                            <p className="text-[#8E9AAF] text-sm font-medium leading-relaxed">
                                Are you sure you want to exit? Your session will be terminated.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 py-3 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black tracking-widest uppercase transition-all text-text-main"
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
