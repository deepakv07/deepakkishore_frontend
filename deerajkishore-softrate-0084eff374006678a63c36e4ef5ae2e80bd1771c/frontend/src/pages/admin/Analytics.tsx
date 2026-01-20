import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiService from '../../services/api';

const AdminAnalytics: React.FC = () => {
    const [overallReport, setOverallReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOverallReport();
    }, []);

    const loadOverallReport = async () => {
        try {
            const data = await apiService.getOverallReport();
            setOverallReport(data);
        } catch (err) {
            console.error('Error fetching overall report:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="py-20 flex justify-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </AdminLayout>
        );
    }

    if (!overallReport) {
        return (
            <AdminLayout>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <p className="text-gray-500">No data available</p>
                </div>
            </AdminLayout>
        );
    }

    const { overview, quizPerformance, coursePerformance } = overallReport;

    return (
        <AdminLayout>
            <div className="animate-fade-in space-y-12">
                {/* Strategic Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1 rounded-full bg-[#FFD70011] border border-[#FFD70033] text-[#FFD700] text-[10px] font-black uppercase tracking-[0.3em]">
                                PLATFORM ANALYTICS
                            </span>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter leading-none">
                            Platform <span className="text-[#FFD700]">Analytics</span>
                        </h1>
                        <p className="text-gray-500 mt-4 text-sm font-bold uppercase tracking-widest uppercase">Visualizing platform performance and engagement</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                            <i className="fas fa-calendar-alt text-[#FFD700]"></i> All Time
                        </button>
                    </div>
                </div>

                {/* KPI Distribution Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { label: 'Total Students', val: overview.totalStudents.toLocaleString(), color: 'text-[#00E5FF]', bg: 'bg-[#00E5FF08]', icon: 'fa-users' },
                        { label: 'Active Quizzes', val: overview.totalQuizzes, color: 'text-[#9D4EDD]', bg: 'bg-[#9D4EDD08]', icon: 'fa-clipboard-list' },
                        { label: 'Total Submissions', val: overview.totalSubmissions.toLocaleString(), color: 'text-[#FFD700]', bg: 'bg-[#FFD70008]', icon: 'fa-file-alt' },
                        { label: 'Average Score', val: `${overview.averageScore}%`, color: 'text-[#00FF41]', bg: 'bg-[#00FF4108]', icon: 'fa-chart-pie' },
                    ].map((stat, i) => (
                        <div key={i} className={`glass-card p-10 border border-white/5 shadow-2xl relative overflow-hidden group hover:border-[#FFD70033] transition-all duration-500`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/2 rounded-bl-full -mr-16 -mt-16 group-hover:bg-[#FFD70008] transition-colors duration-500"></div>
                            <p className="text-[10px] font-black text-gray-500 mb-6 uppercase tracking-[0.2em] flex items-center justify-between">
                                {stat.label}
                                <i className={`fas ${stat.icon} opacity-30 text-lg`}></i>
                            </p>
                            <p className={`text-4xl font-black ${stat.color} tracking-tighter tabular-nums`}>{stat.val}</p>
                        </div>
                    ))}
                </div>

                {/* Secondary Metrics Cluster */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {[
                        { label: 'Overall Success Rate', val: `${overview.passRate}%`, color: 'text-[#00FF41]', detail: `${overview.passedSubmissions} Pass / ${overview.totalSubmissions} Total`, icon: 'fa-check-circle' },
                        { label: 'Passed Submissions', val: overview.passedSubmissions, color: 'text-[#00FF41]', detail: 'Total successful attempts', icon: 'fa-check-double' },
                        { label: 'Failed Submissions', val: overview.failedSubmissions, color: 'text-[#FF3D00]', detail: 'Attempts below pass mark', icon: 'fa-times-circle' },
                    ].map((stat, i) => (
                        <div key={i} className="glass-card p-8 border border-white/5 shadow-2xl relative group">
                            <div className="flex items-start gap-6">
                                <div className={`w-14 h-14 bg-white/2 rounded-2xl flex items-center justify-center text-xl border border-white/5 group-hover:bg-[#FFD70011] group-hover:text-[#FFD700] group-hover:border-[#FFD70022] transition-all duration-500`}>
                                    <i className={`fas ${stat.icon}`}></i>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em]">{stat.label}</p>
                                    <p className={`text-3xl font-black ${stat.color} tracking-tighter mb-2`}>{stat.val}</p>
                                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{stat.detail}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quiz Analytics Feed */}
                {quizPerformance && quizPerformance.length > 0 && (
                    <div className="glass-card rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
                        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/1">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#FFD70011] text-[#FFD700] rounded-2xl flex items-center justify-center border border-[#FFD70022]">
                                    <i className="fas fa-list-ol"></i>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Quiz Performance</h2>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Detailed breakdown by quiz</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-2 overflow-x-auto">
                            <table className="w-full border-separate border-spacing-y-2 px-8">
                                <thead>
                                    <tr className="text-[#FFD700] opacity-50 uppercase tracking-[0.3em] text-[10px] font-black">
                                        <th className="px-6 py-6 text-left font-black">QUIZ TITLE</th>
                                        <th className="px-6 py-6 text-center font-black">ATTEMPTS</th>
                                        <th className="px-6 py-6 text-center font-black">AVERAGE SCORE</th>
                                        <th className="px-6 py-6 text-right font-black">PASS RATE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quizPerformance.map((quiz: any) => (
                                        <tr key={quiz.quizId} className="group hover:bg-[#FFD70008] transition-all duration-300">
                                            <td className="px-6 py-8 rounded-l-[1.5rem] border-y border-l border-white/5 group-hover:border-[#FFD70011]">
                                                <div className="font-black text-white text-base tracking-tight uppercase group-hover:text-[#FFD700] transition-colors">{quiz.quizTitle}</div>
                                                <div className="text-[10px] text-gray-600 mt-2 font-bold uppercase tracking-widest">ID: {quiz.quizId.toString().substring(0, 8).toUpperCase()}</div>
                                            </td>
                                            <td className="px-6 py-8 text-center border-y border-white/5 group-hover:border-[#FFD70011]">
                                                <span className="text-sm font-black text-white tabular-nums">{quiz.totalAttempts}</span>
                                            </td>
                                            <td className="px-6 py-8 text-center border-y border-white/5 group-hover:border-[#FFD70011]">
                                                <div className="inline-flex items-end gap-1">
                                                    <span className="text-xl font-black text-white tracking-tighter tabular-nums">{quiz.averageScore}</span>
                                                    <span className="text-[10px] font-black text-gray-600 mb-1">%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-right rounded-r-[1.5rem] border-y border-r border-white/5 group-hover:border-[#FFD70011]">
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="text-lg font-black text-[#00FF41] tabular-nums tracking-tighter">{quiz.passRate}%</span>
                                                    <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#00FF41]" style={{ width: `${quiz.passRate}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Course Performance Cluster */}
                {coursePerformance && coursePerformance.length > 0 && (
                    <div className="glass-card rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
                        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/1">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#FFD70011] text-[#FFD700] rounded-2xl flex items-center justify-center border border-[#FFD70022]">
                                    <i className="fas fa-book"></i>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Course Analytics</h2>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Performance by subject area</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-2 overflow-x-auto">
                            <table className="w-full border-separate border-spacing-y-2 px-8">
                                <thead>
                                    <tr className="text-[#FFD700] opacity-50 uppercase tracking-[0.3em] text-[10px] font-black">
                                        <th className="px-6 py-6 text-left font-black">COURSE NAME</th>
                                        <th className="px-6 py-6 text-center font-black">QUIZZES</th>
                                        <th className="px-6 py-6 text-center font-black">TOTAL ATTEMPTS</th>
                                        <th className="px-6 py-6 text-right font-black">AVERAGE SCORE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coursePerformance.map((course: any) => (
                                        <tr key={course.courseId} className="group hover:bg-[#FFD70008] transition-all duration-300">
                                            <td className="px-6 py-8 rounded-l-[1.5rem] border-y border-l border-white/5 group-hover:border-[#FFD70011]">
                                                <div className="font-black text-white text-base tracking-tight uppercase group-hover:text-[#FFD700] transition-colors">{course.courseTitle}</div>
                                            </td>
                                            <td className="px-6 py-8 text-center border-y border-white/5 group-hover:border-[#FFD70011]">
                                                <span className="text-sm font-black text-white tabular-nums">{course.totalQuizzes}</span>
                                            </td>
                                            <td className="px-6 py-8 text-center border-y border-white/5 group-hover:border-[#FFD70011]">
                                                <span className="text-sm font-black text-gray-400 tabular-nums">{course.totalAttempts}</span>
                                            </td>
                                            <td className="px-6 py-8 text-right rounded-r-[1.5rem] border-y border-r border-white/5 group-hover:border-[#FFD70011]">
                                                <div className="inline-flex items-end gap-1">
                                                    <span className="text-2xl font-black text-[#FFD700] tracking-tighter tabular-nums">{course.averageScore}</span>
                                                    <span className="text-[10px] font-black text-gray-600 mb-1">%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminAnalytics;
