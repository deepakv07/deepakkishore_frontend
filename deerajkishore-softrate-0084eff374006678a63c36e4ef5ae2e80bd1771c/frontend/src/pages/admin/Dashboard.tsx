import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiService from '../../services/api';
import { Link } from 'react-router-dom';
import LoadingScreen from '../../components/common/LoadingScreen';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [quizzesLoading, setQuizzesLoading] = useState(true);

    useEffect(() => {
        loadStats();
        loadQuizzes();
    }, []);

    const loadStats = async () => {
        try {
            const data = await apiService.getAdminDashboardStats();
            // Map API data to UI stats format
            setStats([
                { label: 'Total Students', value: data.totalStudents.toLocaleString(), icon: 'fas fa-users', color: 'blue' },
                { label: 'Active Quizzes', value: data.activeQuizzes.toString(), icon: 'fas fa-layer-group', color: 'indigo' },
                { label: 'Average Score', value: `${data.avgQuizScore}%`, icon: 'fas fa-star', color: 'yellow' },
                { label: 'Enrollments', value: data.totalEnrollments.toLocaleString(), icon: 'fas fa-graduation-cap', color: 'green' },
            ]);
        } catch (err) {
            console.error('Error fetching admin analytics:', err);
            // Fallback to mock data
            setStats([
                { label: 'Total Students', value: '0', icon: 'fas fa-users', color: 'blue' },
                { label: 'Active Quizzes', value: '0', icon: 'fas fa-layer-group', color: 'indigo' },
                { label: 'Average Score', value: '0%', icon: 'fas fa-star', color: 'yellow' },
                { label: 'Enrollments', value: '0', icon: 'fas fa-graduation-cap', color: 'green' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadQuizzes = async () => {
        try {
            const data = await apiService.getAdminQuizzes();
            setQuizzes(data);
        } catch (err) {
            console.error('Error fetching quizzes:', err);
            setQuizzes([]);
        } finally {
            setQuizzesLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center py-20">
                    <LoadingScreen color="bg-slate-900" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="animate-fade-in space-y-10 md:space-y-14 pb-10">
                {/* Strategic Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-4 py-1.5 rounded-full bg-pastel-orange text-amber-900 text-[10px] font-bold uppercase tracking-widest border border-white">
                                Admin Dashboard
                            </span>
                        </div>
                        <h1 className="text-fluid-h2 font-extrabold text-slate-900 tracking-tight leading-none uppercase break-normal">
                            Dashboard <br /><span className="text-amber-600/40">Overview</span>
                        </h1>
                        <p className="text-slate-700 text-base font-semibold">Welcome back, Administrator</p>
                    </div>

                    <div className="w-full md:w-auto">
                        <Link
                            to="/admin/courses/create"
                            className="elite-button !rounded-[1.5rem] !py-4 !px-8 shadow-2xl shadow-amber-200/50 bg-amber-600"
                        >
                            <span className="font-bold">+ Create Quiz</span>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, i) => {
                        const colors = [
                            { bg: 'bg-pastel-blue', text: 'text-blue-900' },
                            { bg: 'bg-pastel-lavender', text: 'text-indigo-900' },
                            { bg: 'bg-pastel-orange', text: 'text-amber-900' },
                            { bg: 'bg-pastel-mint', text: 'text-teal-900' },
                        ];
                        const theme = colors[i % colors.length];

                        return (
                            <div key={stat.label} className={`${theme.bg} rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden shadow-sm border border-white transition-all hover:scale-[1.02]`}>
                                <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

                                <div className="relative z-10 space-y-6 md:space-y-8">
                                    <div className={`w-12 h-12 md:w-14 md:h-14 bg-white rounded-[1rem] md:rounded-2xl flex items-center justify-center text-lg md:text-xl shadow-sm ${theme.text}`}>
                                        <i className={stat.icon}></i>
                                    </div>
                                    <div>
                                        <p className="text-[9px] md:text-[10px] font-bold text-slate-800 mb-1 md:mb-2 uppercase tracking-widest leading-none break-normal">{stat.label}</p>
                                        <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none tabular-nums uppercase break-normal">{stat.value}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Recent Quizzes Feed */}
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="p-10 md:p-14 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-50/50">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-pastel-orange rounded-2xl flex items-center justify-center text-amber-900 border border-white shadow-sm">
                                <i className="fas fa-layer-group text-xl"></i>
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-none uppercase">Recent Quizzes</h2>
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Recently created quizzes and assignments</p>
                            </div>
                        </div>

                    </div>

                    <div className="p-2">
                        {quizzesLoading ? (
                            <div className="flex items-center justify-center py-32">
                                <LoadingScreen color="bg-slate-900" />
                            </div>
                        ) : quizzes.length === 0 ? (
                            <div className="text-center py-32 relative group">
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-24 h-24 bg-pastel-orange/40 rounded-full flex items-center justify-center mb-8 border border-white text-amber-800">
                                        <i className="fas fa-ghost text-4xl"></i>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase break-normal">No Quizzes Created Yet</p>
                                    <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mt-2 text-center break-normal">Create your first quiz to get started</p>
                                    <Link
                                        to="/admin/courses/create"
                                        className="mt-10 elite-button !rounded-full !py-4 !px-12 bg-amber-600 shadow-xl shadow-amber-200/50"
                                    >
                                        Create Quiz Module
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto pb-8">
                                <table className="w-full px-10">
                                    <thead>
                                        <tr className="text-slate-500 uppercase tracking-[0.4em] text-[9px] md:text-[10px] font-black border-b border-slate-50">
                                            <th className="px-6 md:px-10 py-8 text-left">Quiz Info</th>
                                            <th className="px-4 py-8 text-center">Stats</th>

                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-0">
                                        {quizzes.slice(0, 10).map((quiz) => (
                                            <tr key={quiz.id} className="group border-b border-slate-50/50 last:border-0 hover:bg-slate-50/30 transition-colors">
                                                <td className="px-6 md:px-10 py-8 align-middle">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="font-black text-xl md:text-2xl text-slate-900 tracking-tighter uppercase group-hover:text-amber-600 transition-colors line-clamp-1 break-normal">{quiz.title}</div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[8px] font-black text-amber-700 uppercase tracking-widest bg-pastel-orange/50 px-3 py-1 rounded-md leading-none">
                                                                {quiz.courseTitle || 'GENERAL'}
                                                            </span>
                                                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                                                {new Date(quiz.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-8 align-middle">
                                                    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
                                                        <div className="flex flex-col items-center gap-1 text-center">
                                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">QUE</p>
                                                            <p className="text-sm md:text-lg font-black text-slate-900 leading-none">{quiz.totalQuestions}</p>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1 text-center">
                                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">ATT</p>
                                                            <p className="text-sm md:text-lg font-black text-slate-900 leading-none">{quiz.totalSubmissions || 0}</p>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1 text-center">
                                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">AVG</p>
                                                            <p className={`text-sm md:text-lg font-black leading-none ${quiz.averageScore >= 70 ? 'text-teal-600' : quiz.averageScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                                {quiz.averageScore ? `${quiz.averageScore.toFixed(0)}%` : '0%'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {quizzes.length > 10 && (
                                    <div className="mt-14 mb-10 text-center">
                                        <Link
                                            to="/admin/courses"
                                            className="px-14 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-[10px] font-black text-slate-700 hover:text-amber-900 hover:bg-pastel-orange/40 uppercase tracking-[0.4em] transition-all"
                                        >
                                            View All Quizzes ({quizzes.length})
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
