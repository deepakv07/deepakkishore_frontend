import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

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
        { path: '/admin/dashboard', icon: 'fas fa-th-large', label: 'Dashboard' },
        { path: '/admin/students', icon: 'fas fa-user-graduate', label: 'Students' },
        { path: '/admin/courses', icon: 'fas fa-book', label: 'Courses' },
        { path: '/admin/analytics', icon: 'fas fa-chart-line', label: 'Analytics' },
    ];

    return (
        <div className="flex min-h-screen bg-[#030508] text-gray-300 font-sans selection:bg-[#FFD70033] selection:text-[#FFD700]">
            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-[#00000088] backdrop-blur-md z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Tactical Control Panel */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-[#0A0E14CC] backdrop-blur-2xl border-r border-white/5 flex flex-col transform transition-all duration-500 ease-in-out shadow-[20px_0_50px_rgba(0,0,0,0.5)] ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 overflow-hidden'
                }`}>
                <div className="p-10 border-b border-white/5 flex items-center space-x-5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FFD70005] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className="w-14 h-14 bg-[#FFD70011] border border-[#FFD70033] rounded-2xl flex items-center justify-center text-[#FFD700] font-black text-2xl shadow-[0_0_20px_rgba(255,215,0,0.1)] group-hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all duration-500">
                        SB
                    </div>
                    <div>
                        <span className="text-2xl font-black text-white tracking-tighter block group-hover:text-[#FFD700] transition-colors">
                            SkillBuilder
                        </span>
                        <span className="text-[10px] font-black text-[#FFD700] uppercase tracking-[0.4em] opacity-70">ADMIN PORTAL</span>
                    </div>
                </div>

                <nav className="flex-1 p-8 space-y-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center space-x-5 p-5 rounded-2xl transition-all duration-300 group ${isActive
                                    ? 'bg-[#FFD70011] text-white border border-[#FFD70033] shadow-[0_0_30px_rgba(255,215,0,0.05)]'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'
                                }`
                            }
                        >
                            <div className={`p-2 rounded-xl transition-colors duration-300 ${location.pathname === item.path ? 'bg-[#FFD70022] text-[#FFD700]' : 'group-hover:text-gray-300'}`}>
                                <i className={`${item.icon} text-lg`}></i>
                            </div>
                            <span className="font-black text-xs uppercase tracking-[0.2em]">{item.label}</span>
                            {location.pathname === item.path && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FFD700] shadow-[0_0_10px_#FFD700]"></div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-8 border-t border-white/5 space-y-6">
                    <div className="flex items-center space-x-5 p-5 bg-white/2 rounded-2xl border border-white/5 group hover:border-[#FFD70022] transition-colors duration-500">
                        <div className="w-12 h-12 bg-[#FFD70011] border border-[#FFD70033] rounded-xl flex items-center justify-center text-[#FFD700] transition-transform group-hover:scale-110 duration-500 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                            <i className="fas fa-user-shield text-xl"></i>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-black text-white truncate tracking-tight uppercase">{user?.name || 'Admin'}</p>
                            <p className="text-[10px] font-bold text-gray-500 truncate uppercase tracking-widest">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
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
                        className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/2 backdrop-blur-xl border border-white/10 text-gray-400 hover:text-white hover:border-[#FFD70044] hover:shadow-[0_0_20px_rgba(255,215,0,0.1)] transition-all duration-300 group"
                        title={isSidebarOpen ? 'Retract Panel' : 'Expand Panel'}
                    >
                        <i className={`fas ${isSidebarOpen ? 'fa-align-right' : 'fa-align-left'} text-lg transition-transform group-hover:scale-110`}></i>
                    </button>

                    <div className="ml-auto flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end text-right">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Administrator Session</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                            <i className="fas fa-bell"></i>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6 lg:p-12 pt-2 lg:pt-0 relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
