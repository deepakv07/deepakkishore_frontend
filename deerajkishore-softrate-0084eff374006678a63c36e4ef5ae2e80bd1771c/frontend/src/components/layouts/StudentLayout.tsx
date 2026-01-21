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
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Force light theme and clean up legacy classes
    useEffect(() => {
        document.body.classList.remove('light-theme');
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }, []);

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
        <div className="flex min-h-screen bg-bg-main text-text-main font-inter transition-all duration-500">
            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-border-color flex flex-col transform transition-all duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 overflow-hidden'
                }`}>
                <div className="p-10 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-[1.2rem] flex items-center justify-center shadow-sm overflow-hidden p-2 border border-slate-100">
                        <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter leading-none">Skill Builder</h2>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">Student Portal</span>
                    </div>
                </div>

                <nav className="flex-1 px-6 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center space-x-4 p-4 rounded-[1.5rem] transition-all duration-300 group ${isActive
                                    ? 'bg-pastel-blue text-blue-600 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                                }`
                            }
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg">
                                <i className={item.icon}></i>
                            </div>
                            <span className="font-bold text-sm tracking-tight">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-8 space-y-4">
                    <div className="p-4 bg-slate-50 rounded-[2rem] flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                            <i className="fas fa-user-graduate"></i>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-black truncate">{user?.name || 'Student'}</p>
                            <p className="text-[9px] font-medium text-slate-400 truncate tracking-wide">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full flex items-center justify-center space-x-3 py-4 text-red-500 bg-red-50 hover:bg-red-100 rounded-[1.5rem] transition-all font-bold text-[10px] uppercase tracking-widest border border-red-100/50"
                    >
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-0">
                <header className="px-6 md:px-12 py-6 flex items-center justify-between sticky top-0 bg-bg-main/80 backdrop-blur-md z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="w-12 h-12 hidden lg:flex items-center justify-center rounded-2xl bg-white border border-border-color text-slate-400 hover:text-slate-900 shadow-sm transition-all"
                        >
                            <i className={`fas ${isSidebarOpen ? 'fa-indent' : 'fa-outdent'}`}></i>
                        </button>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 leading-none">
                            {navItems.find(item => location.pathname.includes(item.path))?.label || 'Overview'}
                        </h1>
                    </div>

                    <button
                        onClick={() => navigate('/student/notifications')}
                        className="w-12 h-12 rounded-2xl bg-white border border-border-color flex items-center justify-center text-slate-400 hover:text-blue-500 shadow-sm transition-all relative"
                    >
                        <i className="fas fa-bell"></i>
                        <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                </header>

                <div className="flex-1 p-6 md:p-12 pt-0">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] lg:hidden bg-white/80 backdrop-blur-xl border border-white p-2 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute inset-0 bg-slate-900 rounded-full animate-scale-in"></div>
                            )}
                            <i className={`${item.icon} text-lg relative z-10`}></i>
                        </NavLink>
                    );
                })}
                <button
                    onClick={() => setShowLogoutModal(true)}
                    className="w-14 h-14 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 transition-all"
                >
                    <i className="fas fa-power-off text-lg"></i>
                </button>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white max-w-sm w-full p-10 rounded-[3rem] shadow-2xl space-y-8 text-center border border-white">
                        <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto text-3xl">
                            <i className="fas fa-power-off"></i>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black tracking-tighter">Sign Out?</h3>
                            <p className="text-slate-500 font-medium">Ready to end your session?</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 py-5 rounded-[1.5rem] bg-slate-100 hover:bg-slate-200 text-[10px] font-bold tracking-widest uppercase transition-all"
                            >
                                Stay
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 py-5 rounded-[1.5rem] bg-slate-900 text-white hover:bg-black text-[10px] font-bold tracking-widest uppercase transition-all shadow-xl shadow-slate-200"
                            >
                                Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentLayout;
