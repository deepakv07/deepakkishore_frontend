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
            <div className="animate-fade-in space-y-8 md:space-y-12">
                {/* Strategic Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 text-center md:text-left">
                    <div className="w-full md:w-auto">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                            <span className="px-3 py-1 rounded-full bg-[#FFD70011] border border-[#B8860B33] dark:border-[#FFD70033] text-[#B8860B] dark:text-[#FFD700] text-[10px] font-black uppercase tracking-[0.3em]">
                                ADMIN DASHBOARD
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">
                            Dashboard <span className="text-[#B8860B] dark:text-[#FFD700]">Overview</span>
                        </h1>
                        <p className="text-gray-600 dark:text-gray-500 mt-2 md:mt-4 text-xs md:text-sm font-bold uppercase tracking-widest">Welcome back, Administrator</p>
                    </div>

                    <div className="flex items-center justify-center w-full md:w-auto gap-4">
                        <Link
                            to="/create-quiz"
                            className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-gray-900 text-white dark:bg-white dark:text-[#030508] font-black rounded-xl md:rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 flex items-center justify-center shadow-2xl shadow-black/5 dark:shadow-white/5 uppercase tracking-[0.2em] text-[10px]"
                        >
                            <i className="fas fa-plus mr-3 text-xs"></i> Create Quiz
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {stats.map((stat) => (
                        <div key={stat.label} className="glass-card p-6 md:p-8 border border-border-color shadow-2xl relative overflow-hidden group hover:border-[#FFD70033] transition-all duration-500">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 dark:bg-white/2 rounded-bl-full -mr-16 -mt-16 group-hover:bg-[#FFD70008] transition-colors duration-500"></div>

                            <div className="relative z-10 text-center md:text-left">
                                <div className="w-12 h-12 bg-black/5 dark:bg-white/5 text-gray-400 rounded-xl flex items-center justify-center mb-4 md:mb-6 text-lg border border-border-color group-hover:bg-[#FFD70011] group-hover:text-[#FFD700] group-hover:border-[#FFD70022] mx-auto md:mx-0 transition-all duration-500 shadow-lg">
                                    <i className={stat.icon}></i>
                                </div>
                                <p className="text-[10px] font-black text-gray-600 dark:text-gray-500 mb-2 uppercase tracking-[0.2em]">{stat.label}</p>
                                <p className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter tabular-nums">{stat.value}</p>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-gray-700 to-gray-500 w-2/3 group-hover:from-[#FFD700] group-hover:to-[#FFD70088] transition-all duration-700"></div>
                                    </div>
                                    <span className="text-[8px] font-black text-gray-600 group-hover:text-[#FFD700] transition-colors uppercase tracking-widest">Active</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Quizzes Feed */}
                <div className="glass-card rounded-[2.5rem] border border-border-color shadow-2xl relative overflow-hidden">
                    <div className="p-10 border-b border-border-color flex flex-col md:flex-row justify-between items-center gap-6 bg-black/5 dark:bg-white/1">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#FFD70011] text-[#FFD700] rounded-2xl flex items-center justify-center border border-[#FFD70022]">
                                <i className="fas fa-list"></i>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Recent Quizzes</h2>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Manage your submitted quizzes</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="px-5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border-color text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 dark:hover:text-white hover:border-black/20 dark:hover:border-white/20 transition-all">Filter</button>
                            <button className="px-5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border-color text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 dark:hover:text-white hover:border-black/20 dark:hover:border-white/20 transition-all">Export</button>
                        </div>
                    </div>

                    <div className="p-2">
                        {quizzesLoading ? (
                            <div className="flex items-center justify-center py-24">
                                <div className="w-12 h-12 border-4 border-[#FFD70033] border-t-[#FFD700] rounded-full animate-spin shadow-[0_0_20px_rgba(255,215,0,0.1)]"></div>
                            </div>
                        ) : quizzes.length === 0 ? (
                            <div className="text-center py-24 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFD70005] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-black/5 dark:bg-white/2 rounded-full flex items-center justify-center mb-6 border border-border-color text-gray-600 group-hover:text-[#FFD700] group-hover:border-[#FFD70022] transition-all duration-700">
                                        <i className="fas fa-clipboard-list text-3xl"></i>
                                    </div>
                                    <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-xs">No active quizzes found</p>
                                    <Link
                                        to="/admin/courses/create"
                                        className="mt-8 px-10 py-4 bg-[#FFD70011] text-[#FFD700] font-black rounded-2xl hover:bg-[#FFD70022] border border-[#FFD70033] transition-all uppercase tracking-[0.2em] text-[10px] shadow-2xl"
                                    >
                                        Create First Quiz
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-separate border-spacing-y-2 px-8">
                                    <thead>
                                        <tr className="text-[#FFD700] opacity-50 uppercase tracking-[0.3em] text-[10px] font-black">
                                            <th className="px-6 py-6 text-left font-black">QUIZ TITLE</th>
                                            <th className="px-6 py-6 text-left font-black">COURSE</th>
                                            <th className="px-6 py-6 text-center font-black">QUESTIONS</th>
                                            <th className="px-6 py-6 text-center font-black">SUBMISSIONS</th>
                                            <th className="px-6 py-6 text-center font-black">AVG SCORE</th>
                                            <th className="px-6 py-6 text-right font-black">CREATED</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-0">
                                        {quizzes.slice(0, 10).map((quiz) => (
                                            <tr key={quiz.id} className="group hover:bg-[#FFD70008] transition-all duration-300">
                                                <td className="px-6 py-8 rounded-l-[1.5rem] border-y border-l border-border-color group-hover:border-[#FFD70011]">
                                                    <div className="font-black text-gray-900 dark:text-white text-base tracking-tight uppercase group-hover:text-[#FFD700] transition-colors">{quiz.title}</div>
                                                    {quiz.description && (
                                                        <div className="text-[10px] text-gray-600 mt-2 truncate max-w-xs font-bold uppercase tracking-widest group-hover:text-gray-500">
                                                            ID: {quiz.id.toString().substring(0, 8).toUpperCase()} • {quiz.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-8 border-y border-border-color group-hover:border-[#FFD70011]">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] bg-black/5 dark:bg-white/2 px-3 py-1.5 rounded-lg border border-border-color group-hover:border-[#FFD70011] group-hover:text-gray-300">
                                                        {quiz.courseTitle || 'UNASSIGNED'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-8 text-center border-y border-border-color group-hover:border-[#FFD70011]">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">{quiz.totalQuestions}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-8 text-center border-y border-border-color group-hover:border-[#FFD70011]">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41] shadow-[0_0_8px_#00FF41]"></div>
                                                        <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">{quiz.totalSubmissions || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-8 text-center border-y border-border-color group-hover:border-[#FFD70011]">
                                                    <div className="inline-flex items-end gap-1">
                                                        <span className={`text-xl font-black tabular-nums tracking-tighter ${quiz.averageScore >= 70 ? 'text-[#00FF41]' : quiz.averageScore >= 50 ? 'text-[#FFD700]' : 'text-[#FF3D00]'}`}>
                                                            {quiz.averageScore ? `${quiz.averageScore.toFixed(0)}` : '0'}
                                                        </span>
                                                        <span className="text-[10px] font-black text-gray-600 mb-1">%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-8 text-right rounded-r-[1.5rem] border-y border-r border-border-color group-hover:border-[#FFD70011]">
                                                    <span className="text-[10px] font-black text-gray-600 group-hover:text-gray-400 uppercase tracking-widest tabular-nums">
                                                        {new Date(quiz.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {quizzes.length > 10 && (
                                    <div className="mt-10 mb-8 text-center">
                                        <Link
                                            to="/admin/courses"
                                            className="px-10 py-5 bg-white/2 border border-white/5 rounded-2xl text-[10px] font-black text-[#FFD700] hover:bg-[#FFD7000D] hover:border-[#FFD70033] uppercase tracking-[0.4em] transition-all duration-300 shadow-2xl"
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
