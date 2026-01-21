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
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </StudentLayout>
        );
    }

    const stats = [
        { label: 'QUIZZES', value: dashboardData?.stats?.totalAvailableQuizzes || '0', icon: 'fa-check-double', color: 'text-indigo-600', bg: 'bg-pastel-blue' },
        { label: 'COMPLETED', value: dashboardData?.stats?.quizzesCompleted || '0', icon: 'fa-clock-rotate-left', color: 'text-emerald-700', bg: 'bg-pastel-mint' },
    ];

    return (
        <StudentLayout>
            <div className="space-y-12 md:space-y-16 pb-12">
                {/* Hero Overview Card */}
                <div className="w-full bg-indigo-900 rounded-[3.5rem] p-12 md:p-20 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden shadow-xl">
                    <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="relative z-10 space-y-6 text-center md:text-left">
                        <h1 className="text-fluid-h1 font-extrabold tracking-tight text-white leading-tight uppercase">
                            Welcome back, <br />{user?.name?.split(' ')[0] || 'User'}!
                        </h1>
                        <p className="text-indigo-200 text-lg font-semibold uppercase tracking-wide">Your learning journey continues here.</p>
                    </div>
                    <button
                        onClick={() => navigate('/student/quizzes')}
                        className="elite-button !bg-white !text-indigo-900 !rounded-[1.5rem] !px-10 !py-6 !text-xs font-bold uppercase tracking-widest shadow-2xl"
                    >
                        <span>VIEW QUIZZES</span>
                        <i className="fas fa-arrow-right text-[10px] opacity-100"></i>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase leading-none">Your Learning Progress</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {stats.map((stat, i) => (
                                <div key={i} className={`rounded-[3rem] p-12 flex flex-col gap-10 relative overflow-hidden border border-white shadow-sm ${stat.bg}`}>
                                    <div className="w-20 h-20 rounded-[1.8rem] bg-white flex items-center justify-center text-3xl shadow-sm border border-slate-100" style={{ color: stat.color }}>
                                        <i className={`fas ${stat.icon} ${stat.color}`}></i>
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-bold tracking-[0.2em] text-slate-700 uppercase leading-none">{stat.label}</p>
                                        <p className="text-4xl md:text-5xl font-extrabold tracking-tight mt-4 text-slate-900 leading-none">{stat.value}</p>
                                    </div>
                                    <div className="absolute bottom-6 right-12 opacity-5 text-7xl">
                                        <i className={`fas ${stat.icon}`}></i>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-12">
                        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase leading-none">Quick Actions</h3>
                        <div className="bg-white rounded-[3.5rem] p-12 grid grid-cols-2 gap-8 border border-slate-100 shadow-sm">
                            <button
                                onClick={() => navigate('/student/profile')}
                                className="aspect-square flex flex-col items-center justify-center gap-6 bg-pastel-lavender rounded-[2.5rem] border-2 border-white shadow-sm transition-all"
                            >
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-900 shadow-sm border border-slate-50">
                                    <i className="fas fa-id-card text-2xl"></i>
                                </div>
                                <span className="text-[10px] font-black tracking-widest text-slate-900 uppercase italic">Identity</span>
                            </button>
                            <button
                                onClick={() => navigate('/student/quizzes')}
                                className="aspect-square flex flex-col items-center justify-center gap-6 bg-pastel-blue rounded-[2.5rem] border-2 border-white shadow-sm transition-all"
                            >
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-900 shadow-sm border border-slate-50">
                                    <i className="fas fa-microchip text-2xl"></i>
                                </div>
                                <span className="text-[10px] font-black tracking-widest text-slate-900 uppercase italic">Modules</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-12">
                    <div className="flex justify-between items-center text-slate-900">
                        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase leading-none">Recent Activity</h3>
                        <button
                            onClick={() => navigate('/student/report')}
                            className="bg-indigo-600/10 text-indigo-600 px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-indigo-600 hover:text-white transition-all italic"
                        >
                            SEE ALL
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {(() => {
                            const completedActivities = dashboardData?.recentActivity.filter(a => a.type === 'quiz_completed') || [];

                            if (completedActivities.length === 0) {
                                return (
                                    <div className="bg-white rounded-[4rem] p-24 text-center border border-slate-100 shadow-sm">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100">
                                            <i className="fas fa-satellite-dish text-slate-400"></i>
                                        </div>
                                        <p className="text-[10px] font-black tracking-[0.5em] text-slate-700 uppercase italic mb-2">No active diagnostic packets</p>
                                        <p className="text-xs font-bold text-slate-400 italic">SYSTEM IDLE</p>
                                    </div>
                                );
                            }

                            return completedActivities.map((activity: any) => (
                                <div key={activity.id} className="bg-white rounded-[3rem] p-10 flex items-center justify-between border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-10">
                                        <div className="w-20 h-20 bg-emerald-50 text-emerald-900 rounded-[1.5rem] flex items-center justify-center border border-emerald-100 shadow-sm">
                                            <i className="fas fa-check-double text-2xl"></i>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xl text-slate-900 uppercase tracking-tight leading-none mb-3">
                                                {activity.title}
                                            </h4>
                                            <p className="text-[10px] font-bold text-slate-500 tracking-[0.1em] uppercase leading-none">
                                                TIMESTAMP: {new Date(activity.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/quiz/${activity.quizId}/results`)}
                                        className="w-14 h-14 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-900 bg-white shadow-sm"
                                    >
                                        <i className="fas fa-chevron-right text-sm"></i>
                                    </button>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>

            {/* Float Action for Tablet/Mobile */}
            <div className="pt-12 lg:hidden">
                <button
                    onClick={() => navigate('/student/quizzes')}
                    className="elite-button w-full !rounded-[2rem] !py-8 bg-indigo-900 shadow-2xl"
                >
                    <i className="fas fa-bolt text-xs"></i>
                    <span className="text-sm font-black tracking-[0.3em] uppercase italic">VIEW QUIZZES</span>
                </button>
            </div>
        </StudentLayout>
    );
};

export default StudentDashboard;
