import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiService from '../../services/api';
import { Link } from 'react-router-dom';

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
                { label: 'Active Courses', value: data.activeCourses.toString(), icon: 'fas fa-book', color: 'indigo' },
                { label: 'Average Score', value: `${data.avgQuizScore}%`, icon: 'fas fa-star', color: 'yellow' },
                { label: 'Enrollments', value: data.totalEnrollments.toLocaleString(), icon: 'fas fa-graduation-cap', color: 'green' },
            ]);
        } catch (err) {
            console.error('Error fetching admin analytics:', err);
            // Fallback to mock data
            setStats([
                { label: 'Total Students', value: '1,248', icon: 'fas fa-users', color: 'blue' },
                { label: 'Active Courses', value: '24', icon: 'fas fa-book', color: 'indigo' },
                { label: 'Average Score', value: '78%', icon: 'fas fa-star', color: 'yellow' },
                { label: 'Enrollments', value: '3,500', icon: 'fas fa-graduation-cap', color: 'green' },
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
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
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
                                Central Intelligence
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            Management <br /><span className="text-amber-600/40">Dashboard</span>
                        </h1>
                        <p className="text-slate-700 text-base font-semibold">Strategic oversight of all platform activity</p>
                    </div>

                    <div className="w-full md:w-auto">
                        <Link
                            to="/admin/courses/create"
                            className="elite-button !rounded-[1.5rem] !py-4 !px-8 shadow-2xl shadow-amber-200/50 bg-amber-600"
                        >
                            <i className="fas fa-plus-circle text-xs"></i>
                            <span className="font-bold">Construct Quiz</span>
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
                            <div key={stat.label} className={`${theme.bg} rounded-[2.5rem] p-10 relative overflow-hidden shadow-sm border border-white`}>
                                <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

                                <div className="relative z-10 space-y-8">
                                    <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm ${theme.text}`}>
                                        <i className={stat.icon}></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-800 mb-2 uppercase tracking-widest">{stat.label}</p>
                                        <p className="text-3xl font-bold text-slate-900 tracking-tight leading-none tabular-nums">{stat.value}</p>
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
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-none uppercase">Assessment Records</h2>
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Live platform activity monitoring</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] shadow-sm italic">Filter</button>
                            <button className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] shadow-sm italic">Export</button>
                        </div>
                    </div>

                    <div className="p-2">
                        {quizzesLoading ? (
                            <div className="flex items-center justify-center py-32">
                                <div className="w-16 h-16 border-4 border-pastel-orange border-t-amber-500 rounded-full animate-spin"></div>
                            </div>
                        ) : quizzes.length === 0 ? (
                            <div className="text-center py-32 relative group">
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-24 h-24 bg-pastel-orange/40 rounded-full flex items-center justify-center mb-8 border border-white text-amber-800">
                                        <i className="fas fa-ghost text-4xl"></i>
                                    </div>
                                    <p className="text-2xl font-black italic text-slate-900 tracking-tighter uppercase">No assessments deployed</p>
                                    <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mt-2 italic text-center">Initiate a new module to begin tracking</p>
                                    <Link
                                        to="/admin/courses/create"
                                        className="mt-10 elite-button !rounded-full !py-4 !px-12 bg-amber-600 shadow-xl shadow-amber-200/50 italic"
                                    >
                                        Create Quiz Module
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto pb-8">
                                <table className="w-full px-10">
                                    <thead>
                                        <tr className="text-slate-600 uppercase tracking-[0.4em] text-[10px] font-black italic">
                                            <th className="px-10 py-10 text-left">Entity Title</th>
                                            <th className="px-6 py-10 text-left">Sector</th>
                                            <th className="px-6 py-10 text-center">Modules</th>
                                            <th className="px-6 py-10 text-center">Responses</th>
                                            <th className="px-6 py-10 text-center">Efficiency</th>
                                            <th className="px-6 py-10 text-right">Registered</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-0">
                                        {quizzes.slice(0, 10).map((quiz) => (
                                            <tr key={quiz.id} className="transition-all">
                                                <td className="px-10 py-10 rounded-l-[2rem]">
                                                    <div className="font-black text-2xl text-slate-900 tracking-tighter italic leading-none uppercase group-hover:text-amber-600 transition-colors">{quiz.title}</div>
                                                    <div className="text-[10px] text-slate-600 mt-2 font-bold uppercase tracking-[0.3em] italic">
                                                        REF_{quiz.id.toString().substring(0, 6).toUpperCase()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-10">
                                                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-[0.2em] bg-pastel-orange px-5 py-2.5 rounded-full border border-white italic">
                                                        {quiz.courseTitle || 'GENERAL'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-10 text-center">
                                                    <span className="text-xl font-black text-slate-900 tabular-nums italic">{quiz.totalQuestions}</span>
                                                </td>
                                                <td className="px-6 py-10 text-center">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_10px_#4ade80]"></div>
                                                        <span className="text-xl font-black text-slate-900 tabular-nums italic">{quiz.totalSubmissions || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-10 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-3xl font-black italic tracking-tighter tabular-nums ${quiz.averageScore >= 70 ? 'text-teal-600' : quiz.averageScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                            {quiz.averageScore ? `${quiz.averageScore.toFixed(0)}%` : '0%'}
                                                        </span>
                                                        <div className="w-12 h-1 bg-slate-100 mt-1 rounded-full overflow-hidden">
                                                            <div className={`h-full ${quiz.averageScore >= 70 ? 'bg-teal-500' : 'bg-amber-600'}`} style={{ width: `${quiz.averageScore || 0}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-10 text-right rounded-r-[2rem]">
                                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest tabular-nums italic">
                                                        {new Date(quiz.createdAt).toLocaleDateString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {quizzes.length > 10 && (
                                    <div className="mt-14 mb-10 text-center">
                                        <Link
                                            to="/admin/courses"
                                            className="px-14 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-[10px] font-black text-slate-700 hover:text-amber-900 hover:bg-pastel-orange/40 uppercase tracking-[0.4em] transition-all italic"
                                        >
                                            Access Full Archive ({quizzes.length})
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
