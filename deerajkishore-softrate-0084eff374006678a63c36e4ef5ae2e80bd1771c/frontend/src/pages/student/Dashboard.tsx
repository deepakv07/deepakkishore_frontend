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
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-16 h-16 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#00E5FF55]"></div>
                </div>
            </StudentLayout>
        );
    }

    const stats = [
        { label: 'QUizzes', value: dashboardData?.stats?.totalAvailableQuizzes || '0', icon: 'fa-check-circle', color: '#00E5FF' },
        { label: 'COMPLETED', value: dashboardData?.stats?.quizzesCompleted || '0', icon: 'fa-hourglass-half', color: '#9D4EDD' },
    ];

    return (
        <StudentLayout>
            <div className="space-y-6 md:space-y-8 animate-fade-in">
                {/* Hero Banner */}
                <div className="w-full min-h-[10rem] md:h-40 bg-gradient-to-r from-[#00E5FF] to-[#9D4EDD] rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col md:flex-row items-center justify-center md:justify-between px-6 md:px-12 py-6 md:py-0 shadow-[0_20px_40px_rgba(0,229,255,0.15)] relative overflow-hidden group gap-6">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="relative z-10 text-center md:text-left">
                        <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter">
                            Welcome back, {user?.name || 'Student'}!
                        </h1>
                    </div>
                    <button
                        onClick={() => navigate('/student/quizzes')}
                        className="relative z-10 px-6 md:px-8 py-2 md:py-3 bg-white text-[#9D4EDD] rounded-xl md:rounded-2xl font-black text-xs md:text-sm tracking-widest uppercase hover:scale-105 transition-transform shadow-lg"
                    >
                        View Quizzes
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h3 className="text-2xl font-black tracking-tighter mb-6">Your Learning Progress</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {stats.map((stat, i) => (
                                <div key={i} className="glass-card p-6 flex flex-col gap-4 relative overflow-hidden group">
                                    <div
                                        className="absolute -top-4 -right-4 w-16 h-16 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"
                                        style={{ backgroundColor: stat.color }}
                                    />
                                    <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-sm" style={{ color: stat.color }}>
                                        <i className={`fas ${stat.icon}`}></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black tracking-widest text-gray-600 dark:text-[#8E9AAF] uppercase">{stat.label}</p>
                                        <p className="text-3xl font-black tracking-tighter mt-1 text-gray-900 dark:text-white">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-2xl font-black tracking-tighter">Quick Actions</h3>
                        <div className="glass-card p-6 grid grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate('/student/profile')}
                                className="aspect-square flex flex-col items-center justify-center gap-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-border-color hover:bg-black/10 dark:hover:bg-white/10 hover:border-[#9D4EDD]/30 transition-all group"
                            >
                                <div className="w-10 h-10 bg-[#9D4EDD]/10 rounded-xl flex items-center justify-center text-[#9D4EDD] group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(157,78,221,0.1)]">
                                    <i className="fas fa-user"></i>
                                </div>
                                <span className="text-[10px] font-black tracking-widest text-gray-500 dark:text-[#8E9AAF] uppercase">My Profile</span>
                            </button>
                            <button
                                onClick={() => navigate('/student/quizzes')}
                                className="aspect-square flex flex-col items-center justify-center gap-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-border-color hover:bg-black/10 dark:hover:bg-white/10 hover:border-[#00E5FF]/30 transition-all group"
                            >
                                <div className="w-10 h-10 bg-[#00E5FF]/10 rounded-xl flex items-center justify-center text-[#00E5FF] group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,229,255,0.1)]">
                                    <i className="fas fa-file-alt"></i>
                                </div>
                                <span className="text-[10px] font-black tracking-widest text-gray-500 dark:text-[#8E9AAF] uppercase">View Quizzes</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <h3 className="text-2xl font-black tracking-tighter">Recent Activity</h3>
                        <button className="text-[10px] font-black tracking-widest uppercase text-[#00E5FF] bg-[#00E5FF11] border border-[#00E5FF33] px-4 py-1.5 rounded-full hover:bg-[#00E5FF] hover:text-black transition-all">
                            See All
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {(() => {
                            const completedActivities = dashboardData?.recentActivity.filter(a => a.type === 'quiz_completed') || [];

                            if (completedActivities.length === 0) {
                                return (
                                    <div className="glass-card p-8 text-center opacity-50">
                                        <p className="text-[10px] font-black tracking-widest uppercase">No recently completed quizzes found</p>
                                    </div>
                                );
                            }

                            return completedActivities.map((activity: any) => (
                                <div key={activity.id} className="glass-card glass-card-hover p-5 flex items-center justify-between group">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center text-[#9D4EDD] group-hover:scale-110 transition-transform">
                                            <i className="fas fa-clipboard-check text-xl"></i>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-lg group-hover:text-[#00E5FF] transition-colors">
                                                {activity.title}
                                            </h4>
                                            <p className="text-[10px] font-bold text-gray-500 dark:text-[#8E9AAF] tracking-widest uppercase mt-1">
                                                {new Date(activity.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>

            {/* Floating Attend Quiz button in middle section fallback or as extra action */}
            <div className="pt-4 lg:hidden">
                <button
                    onClick={() => navigate('/student/quizzes')}
                    className="w-full elite-button !py-4 shadow-[0_20px_40px_rgba(0,229,255,0.2)]"
                >
                    <i className="fas fa-play-circle text-lg"></i>
                    <span className="text-sm font-black tracking-widest uppercase">Attend Quiz</span>
                </button>
            </div>
        </StudentLayout>
    );
};

export default StudentDashboard;
