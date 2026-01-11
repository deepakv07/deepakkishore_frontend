import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface StudentLayoutProps {
    children: React.ReactNode;
    hideNavbar?: boolean;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ children, hideNavbar = false }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-blue-50">
            {/* Top Navigation Bar */}
            {!hideNavbar && (
                <header className="bg-blue-600 text-white shadow-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            {/* Logo */}
                            {/* Logo - Clickable to Dashboard */}
                            <Link to="/student/dashboard" className="flex items-center space-x-3 hover:opacity-90 transition">
                                <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
                                    <span className="text-blue-600 font-bold text-lg">SB</span>
                                </div>
                                <h1 className="text-xl font-bold">Skill Builder</h1>
                            </Link>

                            {/* Nav Links + Profile */}
                            <div className="flex items-center space-x-8">
                                <nav className="hidden md:flex space-x-6 text-sm font-medium">
                                    <Link to="/student/dashboard" className="opacity-100 hover:opacity-100">
                                        Dashboard
                                    </Link>
                                    <Link to="/student/quizzes" className="opacity-80 hover:opacity-100">
                                        Quizzes
                                    </Link>
                                    <Link to="/student/report" className="opacity-80 hover:opacity-100">
                                        Reports
                                    </Link>
                                    <Link to="/student/profile" className="opacity-80 hover:opacity-100">
                                        Profile
                                    </Link>
                                </nav>

                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition shadow-sm border border-white/10"
                                        title="Logout"
                                    >
                                        <i className="fas fa-sign-out-alt text-sm"></i>
                                        <span className="text-sm font-bold uppercase tracking-wider">Logout</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
            )}

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

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
};

export default StudentLayout;
