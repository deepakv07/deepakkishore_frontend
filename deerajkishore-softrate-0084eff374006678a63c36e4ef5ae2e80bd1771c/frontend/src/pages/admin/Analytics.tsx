import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import LoadingScreen from '../../components/common/LoadingScreen';
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
                <div className="py-20 flex flex-col items-center justify-center">
                    <LoadingScreen color="bg-slate-900" />
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
            <div className="animate-fade-in space-y-12 md:space-y-16 pb-10">
                {/* Strategic Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-5 py-1.5 rounded-full bg-pastel-orange text-amber-900 text-[10px] font-black uppercase tracking-[0.4em] border border-white">
                                Platform Analytics
                            </span>
                        </div>
                        <h1 className="text-fluid-h2 font-black text-slate-900 tracking-tighter leading-none uppercase">
                            Platform <br /><span className="text-amber-600/40">Analytics</span>
                        </h1>
                        <p className="text-slate-700 text-lg font-bold uppercase">Visualizing platform performance and engagement</p>
                    </div>

                    <div className="w-full md:w-auto">
                        <button className="elite-button !rounded-2xl !py-4 shadow-xl shadow-slate-200">
                            <i className="fas fa-calendar-day text-xs"></i>
                            <span className="italic uppercase">All Time</span>
                        </button>
                    </div>
                </div>

                {/* KPI Distribution Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { label: 'Total Students', val: overview.totalStudents.toLocaleString(), color: 'text-blue-900', bg: 'bg-pastel-blue', icon: 'fa-users' },
                        { label: 'Active Quizzes', val: overview.totalQuizzes, color: 'text-indigo-900', bg: 'bg-pastel-lavender', icon: 'fa-layer-group' },
                        { label: 'Total Submissions', val: overview.totalSubmissions.toLocaleString(), color: 'text-amber-900', bg: 'bg-pastel-orange', icon: 'fa-file-signature' },
                        { label: 'Average Score', val: `${overview.averageScore}%`, color: 'text-teal-900', bg: 'bg-pastel-mint', icon: 'fa-chart-pie' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-slate-50 shadow-sm relative overflow-hidden transition-all hover:scale-[1.02]">
                            <div className={`absolute top-0 right-0 w-16 md:w-24 h-16 md:h-24 ${stat.bg} rounded-bl-[3rem] md:rounded-bl-[4rem]`}></div>
                            <div className="relative z-10 space-y-6 md:space-y-8">
                                <div className={`w-10 h-10 md:w-14 md:h-14 ${stat.bg} ${stat.color} rounded-[1rem] md:rounded-2xl flex items-center justify-center text-lg md:text-xl shadow-sm border border-white`}>
                                    <i className={`fas ${stat.icon}`}></i>
                                </div>
                                <div>
                                    <p className="text-[9px] md:text-[10px] font-black text-slate-800 mb-1 md:mb-2 uppercase tracking-[0.3em] leading-none">{stat.label}</p>
                                    <p className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none tabular-nums uppercase">{stat.val}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Secondary Metrics Cluster */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { label: 'Overall Success Rate', val: `${overview.passRate}%`, color: 'text-teal-900', bg: 'bg-pastel-mint', detail: `${overview.passedSubmissions} Validated`, icon: 'fa-bolt' },
                        { label: 'Passed Submissions', val: overview.passedSubmissions, color: 'text-blue-900', bg: 'bg-pastel-blue', detail: 'Above proficiency threshold', icon: 'fa-check-circle' },
                        { label: 'Failed Submissions', val: overview.failedSubmissions, color: 'text-red-700', bg: 'bg-red-50', detail: 'Requires intervention', icon: 'fa-exclamation-triangle' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm transition-all">
                            <div className="flex items-start gap-8">
                                <div className={`w-16 h-16 ${stat.bg} ${stat.color} rounded-[1.5rem] flex items-center justify-center text-2xl border border-white shadow-sm`}>
                                    <i className={`fas ${stat.icon}`}></i>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em]">{stat.label}</p>
                                    <p className={`text-3xl font-black ${stat.color} tracking-tighter leading-none tabular-nums`}>{stat.val}</p>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{stat.detail}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quiz Analytics Feed */}
                {quizPerformance && quizPerformance.length > 0 && (
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-10 md:p-14 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-pastel-orange rounded-2xl flex items-center justify-center text-amber-900 border border-white shadow-sm">
                                    <i className="fas fa-poll text-xl"></i>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">Quiz Performance</h2>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1 uppercase">Detailed breakdown by quiz</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-2 overflow-x-auto pb-8">
                            <table className="w-full px-10">
                                <thead>
                                    <tr className="text-slate-500 uppercase tracking-[0.4em] text-[9px] md:text-[10px] font-black border-b border-slate-50">
                                        <th className="px-6 md:px-10 py-8 text-left">Quiz Info</th>
                                        <th className="px-4 py-8 text-center">Performance Stats</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quizPerformance.map((quiz: any) => (
                                        <tr key={quiz.quizId} className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                                            <td className="px-6 md:px-10 py-8 align-middle">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="font-black text-xl md:text-2xl text-slate-900 tracking-tighter transition-colors uppercase line-clamp-1">{quiz.quizTitle}</div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">ID_{quiz.quizId.toString().substring(0, 8).toUpperCase()}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-8 align-middle">
                                                <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
                                                    <div className="flex flex-col items-center gap-1 text-center">
                                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">ATTEMPTS</p>
                                                        <p className="text-sm md:text-xl font-black text-slate-900 tabular-nums leading-none">{quiz.totalAttempts}</p>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1 text-center">
                                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">AVG SCORE</p>
                                                        <p className="text-sm md:text-xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">{quiz.averageScore}%</p>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1 text-center">
                                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">PASS RATE</p>
                                                        <p className="text-sm md:text-xl font-black text-teal-600 tabular-nums tracking-tighter leading-none">{quiz.passRate}%</p>
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
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-10 md:p-14 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-pastel-blue rounded-2xl flex items-center justify-center text-blue-900 border border-white shadow-sm">
                                    <i className="fas fa-university text-xl"></i>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">Course Performance</h2>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1 uppercase">Overall Performance by Course</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-2 overflow-x-auto pb-8">
                            <table className="w-full px-10">
                                <thead>
                                    <tr className="text-slate-600 uppercase tracking-[0.4em] text-[10px] font-black">
                                        <th className="px-10 py-10 text-left">Course Title</th>
                                        <th className="px-6 py-10 text-center">Quizzes</th>
                                        <th className="px-6 py-10 text-center">Attempts</th>
                                        <th className="px-10 py-10 text-right">Average Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coursePerformance.map((course: any) => (
                                        <tr key={course.courseId} className="transition-all">
                                            <td className="px-10 py-10 rounded-l-[3rem] align-middle">
                                                <div className="font-black text-2xl text-slate-900 tracking-tighter leading-none transition-colors uppercase">{course.courseTitle}</div>
                                            </td>
                                            <td className="px-6 py-10 text-center align-middle">
                                                <span className="text-xl font-black text-slate-900 tabular-nums leading-none">{course.totalQuizzes}</span>
                                            </td>
                                            <td className="px-6 py-10 text-center align-middle">
                                                <span className="text-xl font-black text-slate-700 tabular-nums leading-none">{course.totalAttempts}</span>
                                            </td>
                                            <td className="px-10 py-10 text-right rounded-r-[3rem] align-middle">
                                                <div className="inline-flex items-center gap-3">
                                                    <span className="text-4xl font-black text-amber-600 tracking-tighter tabular-nums leading-none">{course.averageScore}%</span>
                                                    <div className="w-2 h-2 rounded-full bg-amber-600"></div>
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
