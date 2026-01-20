import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiService from '../../services/api';

const AdminStudents: React.FC = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [studentsData, reportsData] = await Promise.all([
                apiService.getStudents(),
                apiService.getAllStudentReports()
            ]);
            setStudents(studentsData);
            setReports(reportsData);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStudentReport = (studentId: string) => {
        return reports.find(r => r.studentId === studentId);
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

    return (
        <AdminLayout>
            <div className="animate-fade-in space-y-12">
                {/* Strategic Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1 rounded-full bg-[#FFD70011] border border-[#FFD70033] text-[#FFD700] text-[10px] font-black uppercase tracking-[0.3em]">
                                STUDENT MANAGEMENT
                            </span>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter leading-none">
                            Student Management <span className="text-[#FFD700]">& Reports</span>
                        </h1>
                        <p className="text-gray-500 mt-4 text-sm font-bold uppercase tracking-widest uppercase">View all students and their performance reports</p>
                    </div>
                </div>

                {/* Student Feed */}
                <div className="glass-card rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
                    <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/1">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#FFD70011] text-[#FFD700] rounded-2xl flex items-center justify-center border border-[#FFD70022]">
                                <i className="fas fa-users"></i>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Registered Students</h2>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Monitor student activity and results</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-2 overflow-x-auto">
                        <table className="w-full border-separate border-spacing-y-2 px-8">
                            <thead>
                                <tr className="text-[#FFD700] opacity-50 uppercase tracking-[0.3em] text-[10px] font-black">
                                    <th className="px-6 py-6 text-left font-black">STUDENT</th>
                                    <th className="px-6 py-6 text-left font-black">EMAIL</th>
                                    <th className="px-6 py-6 text-center font-black">QUIZZES TAKEN</th>
                                    <th className="px-6 py-6 text-center font-black">AVERAGE SCORE</th>
                                    <th className="px-6 py-6 text-center font-black">PASS RATE</th>
                                    <th className="px-6 py-6 text-right font-black">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => {
                                    const report = getStudentReport(student.id);
                                    return (
                                        <tr key={student.id} className="group hover:bg-[#FFD70008] transition-all duration-300">
                                            <td className="px-6 py-8 rounded-l-[1.5rem] border-y border-l border-white/5 group-hover:border-[#FFD70011]">
                                                <div className="font-black text-white text-base tracking-tight uppercase group-hover:text-[#FFD700] transition-colors">{student.name}</div>
                                                <div className="text-[10px] text-gray-600 mt-2 font-bold uppercase tracking-widest">{student.id.toString().substring(0, 8).toUpperCase()}</div>
                                            </td>
                                            <td className="px-6 py-8 border-y border-white/5 group-hover:border-[#FFD70011]">
                                                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest truncate max-w-[150px]">{student.email}</div>
                                            </td>
                                            <td className="px-6 py-8 text-center border-y border-white/5 group-hover:border-[#FFD70011]">
                                                <span className="text-sm font-black text-white tabular-nums">{report?.totalQuizzes || 0}</span>
                                            </td>
                                            <td className="px-6 py-8 text-center border-y border-white/5 group-hover:border-[#FFD70011]">
                                                <div className={`text-xl font-black tabular-nums tracking-tighter ${report && report.averageScore >= 70 ? 'text-[#00FF41]' :
                                                    report && report.averageScore >= 50 ? 'text-[#FFD700]' : 'text-[#FF3D00]'
                                                    }`}>
                                                    {report ? `${report.averageScore.toFixed(0)}%` : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-center border-y border-white/5 group-hover:border-[#FFD70011]">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-sm font-black text-white tabular-nums">
                                                        {report && report.totalQuizzes > 0
                                                            ? `${Math.round((report.passedQuizzes / report.totalQuizzes) * 100)}%`
                                                            : '0%'}
                                                    </span>
                                                    <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-[#FFD700] to-[#00FF41]" style={{ width: report && report.totalQuizzes > 0 ? `${(report.passedQuizzes / report.totalQuizzes) * 100}%` : '0%' }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-right rounded-r-[1.5rem] border-y border-r border-white/5 group-hover:border-[#FFD70011]">
                                                <button
                                                    onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
                                                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${selectedStudent === student.id
                                                        ? 'bg-[#FFD70011] text-[#FFD700] border-[#FFD70033]'
                                                        : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                                                        }`}
                                                >
                                                    {selectedStudent === student.id ? 'Close' : 'View Report'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {selectedStudent && (
                    <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden animate-slide-up">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD70005] rounded-full blur-[100px] -mr-32 -mt-32"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-6 mb-12">
                                <div className="w-16 h-16 bg-[#FFD70011] text-[#FFD700] rounded-[1.5rem] flex items-center justify-center text-2xl border border-[#FFD70022] shadow-[0_0_20px_rgba(255,215,0,0.1)]">
                                    <i className="fas fa-chart-line"></i>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Student Performance Report</h2>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Student: {students.find(s => s.id === selectedStudent)?.name}</p>
                                </div>
                            </div>

                            {(() => {
                                const report = reports.find(r => r.studentId === selectedStudent);
                                if (!report) {
                                    return (
                                        <div className="text-center py-12 p-10 bg-white/2 border border-dashed border-white/5 rounded-3xl">
                                            <p className="text-gray-500 font-black uppercase tracking-[0.2em] text-xs">No data points detected for this student</p>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                        {[
                                            { label: 'Total Quizzes', val: report.totalQuizzes, color: 'text-white', bg: 'bg-white/2', icon: 'fa-layer-group' },
                                            { label: 'Quizzes Passed', val: report.passedQuizzes, color: 'text-[#00FF41]', bg: 'bg-[#00FF410D]', icon: 'fa-check-circle' },
                                            { label: 'Quizzes Failed', val: report.failedQuizzes, color: 'text-[#FF3D00]', bg: 'bg-[#FF3D000D]', icon: 'fa-times-circle' },
                                            { label: 'Average Score', val: `${report.averageScore}%`, color: 'text-[#FFD700]', bg: 'bg-[#FFD7000D]', icon: 'fa-percentage' },
                                        ].map((stat, i) => (
                                            <div key={i} className={`${stat.bg} p-10 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all duration-500`}>
                                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                                    <i className={`fas ${stat.icon} opacity-30`}></i>
                                                    {stat.label}
                                                </p>
                                                <p className={`text-4xl font-black ${stat.color} tracking-tighter tabular-nums`}>{stat.val}</p>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminStudents;
