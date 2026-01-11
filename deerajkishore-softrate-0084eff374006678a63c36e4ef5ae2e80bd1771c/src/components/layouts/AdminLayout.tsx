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

    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
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
        <div className="flex min-h-screen bg-gray-50">
            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl lg:shadow-xl flex flex-col transform transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 overflow-hidden'
                }`}>
                <div className="p-8 border-b border-gray-50 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-200">
                        SB
                    </div>
                    <div>
                        <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block">
                            SkillBuilder
                        </span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Admin Portal</span>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-3">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center space-x-4 p-4 rounded-2xl transition-all ${isActive
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-200'
                                    : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                                }`
                            }
                        >
                            <i className={`${item.icon} text-lg w-6`}></i>
                            <span className="font-extrabold text-sm uppercase tracking-wider">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-6 border-t border-gray-50">
                    <div className="flex items-center space-x-4 p-4 mb-4 bg-gray-50 rounded-2xl">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                            <i className="fas fa-user-shield text-blue-600"></i>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-black text-gray-900 truncate">{user?.name || 'Administrator'}</p>
                            <p className="text-[10px] font-bold text-gray-400 truncate uppercase tracking-tighter">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-3 py-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all font-black text-xs uppercase tracking-widest border border-red-100/50"
                    >
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Logout Account</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="px-6 py-4 flex items-center bg-transparent sticky top-0 z-30">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-xl shadow-gray-200/50 border border-gray-100 text-gray-600 hover:text-blue-600 hover:border-blue-100 transition-all group"
                        title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
                    >
                        <i className={`fas ${isSidebarOpen ? 'fa-indent rotate-180' : 'fa-outdent'} text-lg transition-transform group-hover:scale-110`}></i>
                    </button>
                </header>
                <div className="flex-1 overflow-auto p-4 lg:p-10 pt-2 lg:pt-0">
                    {children}
                </div>
            </main>
            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl transform transition-all scale-100 border border-gray-100">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg shadow-red-50">
                                <i className="fas fa-sign-out-alt"></i>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">Logout?</h3>
                            <p className="text-gray-500 font-medium text-sm">Are you sure you want to end your session?</p>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-200"
                            >
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLayout;
