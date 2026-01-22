import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../../components/common/LoadingScreen';
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
                    <LoadingScreen color="bg-slate-900" />
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
                <div className="w-full bg-indigo-900 rounded-[1.5rem] md:rounded-[3rem] p-6 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-10 relative overflow-hidden shadow-xl">
                    <div className="absolute top-[-20%] right-[-10%] w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="relative z-10 space-y-4 text-center md:text-left w-full md:w-auto">
                        <h1 className="text-fluid-h2 font-extrabold tracking-tight text-white leading-tight uppercase break-normal">
                            Welcome back, <br />{user?.name?.split(' ')[0] || 'User'}!
                        </h1>
                        <p className="text-indigo-200 text-sm md:text-base font-semibold uppercase tracking-wide break-normal">Your learning journey continues here.</p>
                    </div>
                    <button
                        onClick={() => navigate('/student/quizzes')}
                        className="elite-button !bg-white !text-indigo-900 !rounded-[1rem] md:!rounded-[1.2rem] !px-8 !py-4 md:!py-5 !text-[10px] font-bold uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 shrink-0"
                    >
                        <span>VIEW QUIZZES</span>
                        <i className="fas fa-arrow-right text-[10px] opacity-100 ml-2"></i>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase leading-none">Your Learning Progress</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {stats.map((stat, i) => (
                                <div key={i} className={`rounded-[1.5rem] md:rounded-[3rem] p-6 md:p-12 flex flex-col gap-8 md:gap-10 relative overflow-hidden border border-white shadow-sm ${stat.bg}`}>
                                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-[1.25rem] md:rounded-[1.8rem] bg-white flex items-center justify-center text-xl md:text-3xl shadow-sm border border-slate-100 shrink-0" style={{ color: stat.color }}>
                                        <i className={`fas ${stat.icon} ${stat.color}`}></i>
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-slate-700 uppercase leading-none break-normal">{stat.label}</p>
                                        <p className="text-3xl md:text-5xl font-extrabold tracking-tight mt-3 md:mt-4 text-slate-900 leading-none tabular-nums break-normal shrink-0">{stat.value}</p>
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
                        <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 grid grid-cols-2 gap-4 md:gap-6 border border-slate-100 shadow-sm">
                            <button
                                onClick={() => navigate('/student/profile')}
                                className="flex flex-col items-center justify-center py-8 gap-4 bg-pastel-lavender rounded-[2rem] border border-white shadow-sm transition-all hover:bg-indigo-100 hover:scale-[1.02]"
                            >
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-900 shadow-sm border border-slate-50">
                                    <i className="fas fa-user-circle text-xl"></i>
                                </div>
                                <span className="text-[10px] font-black tracking-widest text-slate-900 uppercase">Profile</span>
                            </button>
                            <button
                                onClick={() => navigate('/student/quizzes')}
                                className="flex flex-col items-center justify-center py-8 gap-4 bg-pastel-blue rounded-[2rem] border border-white shadow-sm transition-all hover:bg-blue-100 hover:scale-[1.02]"
                            >
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-900 shadow-sm border border-slate-50">
                                    <i className="fas fa-layer-group text-xl"></i>
                                </div>
                                <span className="text-[10px] font-black tracking-widest text-slate-900 uppercase">Quizzes</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-12">
                    <div className="flex justify-between items-center text-slate-900">
                        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase leading-none">Recent Activity</h3>
                        <button
                            onClick={() => navigate('/student/report')}
                            className="bg-indigo-600/10 text-indigo-600 px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-indigo-600 hover:text-white transition-all"
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
                                        <p className="text-[10px] font-black tracking-[0.5em] text-slate-700 uppercase mb-2">No quiz is attended yet</p>
                                        <p className="text-xs font-bold text-slate-400">READY TO START</p>
                                    </div>
                                );
                            }

                            return completedActivities.map((activity: any) => (
                                <div key={activity.id} className="bg-white rounded-[1.5rem] md:rounded-[3rem] p-5 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-10 border border-slate-100 shadow-sm transition-all group hover:border-indigo-100">
                                    <div className="flex items-center gap-4 md:gap-10 w-full min-w-0">
                                        <div className="w-14 h-14 md:w-20 md:h-20 bg-emerald-50 text-emerald-900 rounded-[1rem] md:rounded-[1.5rem] flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
                                            <i className="fas fa-check-double text-lg md:text-2xl"></i>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-lg md:text-xl text-slate-900 uppercase tracking-tight leading-tight mb-2 break-normal">
                                                {activity.title}
                                            </h4>
                                            <p className="text-[9px] md:text-[10px] font-bold text-slate-500 tracking-[0.1em] uppercase leading-none break-normal">
                                                TIMESTAMP: {new Date(activity.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/quiz/${activity.quizId}/results`)}
                                        className="w-full md:w-14 h-14 rounded-[1rem] md:rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-900 bg-white shadow-sm hover:border-indigo-600 hover:text-indigo-600 transition-all shrink-0 p-4 md:p-0"
                                    >
                                        <span className="md:hidden text-[10px] font-black tracking-widest uppercase mr-3">View Result</span>
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
                    <span className="text-sm font-black tracking-[0.3em] uppercase">VIEW QUIZZES</span>
                </button>
            </div>
        </StudentLayout>
    );
};

export default StudentDashboard;
