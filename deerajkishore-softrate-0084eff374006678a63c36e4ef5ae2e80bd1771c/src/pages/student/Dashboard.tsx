import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { StudentDashboardData } from '../../types';

const StudentDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const data = await apiService.getStudentDashboard();
            setDashboardData(data);
        } catch (err: any) {
            console.error('Error loading dashboard:', err);
            // Show error but don't use mock data
            alert('Failed to load dashboard data. Please refresh the page.');
            // Set minimal data to prevent crashes
            setDashboardData({
                user: user as any,
                stats: {
                    totalCourses: 0,
                    hoursLearned: 0,
                    quizzesCompleted: 0,
                    pendingQuizzes: 0,
                },
                recentActivity: [],
                aiJobPrediction: {
                    role: 'Student',
                    confidence: 0,
                    salaryRange: { min: 0, max: 0 },
                },
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2rem] p-10 text-white shadow-2xl mb-10 relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-8">
                    <div>
                        <h2 className="text-4xl font-black mb-3">
                            Welcome back, {user?.name || 'Alex Johnson'}!
                        </h2>

                    </div>
                    <button
                        onClick={() => navigate('/student/quizzes')}
                        className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black shadow-xl shadow-blue-900/20 hover:scale-105 transition-all active:scale-95 whitespace-nowrap"
                    >
                        View Quizzes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column (Progress & Activity) */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Learning Progress */}
                    <div>
                        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center">
                            Your Learning Progress
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            {[
                                {
                                    label: 'Quizzes',
                                    val: dashboardData?.stats.totalAvailableQuizzes || 0, // Showing Total Quizzes as requested
                                    icon: 'fa-check-circle',
                                    color: 'text-blue-600'
                                },
                                {
                                    label: 'Pending',
                                    val: dashboardData?.stats.pendingQuizzes && dashboardData.stats.pendingQuizzes > 0 ? 'Attend Quiz' : 'No quiz to attempt',
                                    icon: 'fa-hourglass-half',
                                    isAction: true,
                                    hasPending: dashboardData?.stats.pendingQuizzes && dashboardData.stats.pendingQuizzes > 0
                                },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-8 rounded-[1.5rem] border border-gray-100/50 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group">
                                    <div className="text-blue-600 text-xl font-black mb-4 group-hover:scale-110 transition-transform">
                                        <i className={`fas ${stat.icon}`}></i>
                                    </div>
                                    {!stat.isAction ? (
                                        <>
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</h3>
                                            <p className="text-2xl font-black text-gray-800 tracking-tight">{stat.val}</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Pending</p>
                                            <button
                                                onClick={() => {
                                                    if (stat.hasPending) {
                                                        navigate('/student/quizzes');
                                                    }
                                                }}
                                                disabled={!stat.hasPending}
                                                className={`w-full text-xs font-black py-3 rounded-xl transition shadow-lg ${stat.hasPending
                                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-gray-100'
                                                    }`}
                                            >
                                                {stat.hasPending ? 'Attend Quiz' : 'No quiz to attempt'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 p-8">
                        <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center">
                            Recent Activity
                        </h3>
                        <div className="space-y-6">
                            {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                                dashboardData.recentActivity.map((activity, i) => (
                                    <div key={activity.id} className="flex items-center p-5 rounded-2xl hover:bg-gray-50/80 transition-all border border-transparent hover:border-gray-100">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-5 ${i === 0 ? 'bg-blue-50 text-blue-600' :
                                            i === 1 ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400'
                                            }`}>
                                            <i className={`fas ${i === 0 ? 'fa-check-circle' :
                                                i === 1 ? 'fa-play' : 'fa-spinner fa-spin'
                                                } text-sm`}></i>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-800">{activity.title}</p>
                                            <p className="text-sm text-gray-400 font-medium">{activity.timestamp}</p>
                                        </div>
                                    </div>
                                ))
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-10">

                    {/* Quick Actions */}
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 p-8">
                        <h3 className="text-lg font-black text-gray-800 mb-6">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <button
                                onClick={() => navigate('/student/profile')}
                                className="flex flex-col items-center justify-center p-6 border border-gray-50 rounded-2xl hover:bg-blue-50/50 hover:border-blue-100 transition-all group"
                            >
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm group-hover:shadow-md">
                                    <i className="fas fa-user-circle text-xl"></i>
                                </div>
                                <span className="text-xs font-bold text-gray-600">My Profile</span>
                            </button>
                            <button
                                onClick={() => navigate('/student/quizzes')}
                                className="flex flex-col items-center justify-center p-6 border border-gray-50 rounded-2xl hover:bg-blue-50/50 hover:border-blue-100 transition-all group"
                            >
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm group-hover:shadow-md">
                                    <i className="fas fa-file-invoice text-xl"></i>
                                </div>
                                <span className="text-xs font-bold text-gray-600">View Quizzes</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentDashboard;
