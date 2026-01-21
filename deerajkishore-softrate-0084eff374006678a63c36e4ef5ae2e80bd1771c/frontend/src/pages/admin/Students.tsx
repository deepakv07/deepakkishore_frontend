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
            <div className="animate-fade-in space-y-12 md:space-y-16 pb-10">
                {/* Strategic Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-5 py-1.5 rounded-full bg-pastel-orange text-amber-900 text-[10px] font-black uppercase tracking-[0.4em] border border-white italic">
                                Human Capital
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] italic">
                            Student <br /><span className="text-amber-600/40">Directory</span>
                        </h1>
                        <p className="text-slate-700 text-lg font-bold italic">Complete oversight of enrolled talent and performance</p>
                    </div>
                </div>

                {/* Student Feed */}
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden relative">
                    <div className="p-10 md:p-14 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 bg-slate-50/50">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-pastel-blue rounded-2xl flex items-center justify-center text-blue-900 border border-white shadow-sm">
                                <i className="fas fa-users-viewfinder text-xl"></i>
                            </div>
                            <div className="text-center md:text-left">
                                <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none uppercase">Registered Talent</h2>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1 italic">Real-time engagement tracking</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-2 overflow-x-auto pb-8">
                        <table className="w-full px-10">
                            <thead>
                                <tr className="text-slate-600 uppercase tracking-[0.4em] text-[10px] font-black italic">
                                    <th className="px-10 py-10 text-left">Academic Entity</th>
                                    <th className="px-6 py-10 text-left hidden md:table-cell">Communication</th>
                                    <th className="px-6 py-10 text-center">Modules</th>
                                    <th className="px-6 py-10 text-center">Mean Efficiency</th>
                                    <th className="px-6 py-10 text-center hidden lg:table-cell">Success Rate</th>
                                    <th className="px-10 py-10 text-right">Operation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => {
                                    const report = getStudentReport(student.id);
                                    return (
                                        <tr key={student.id} className="transition-all">
                                            <td className="px-10 py-10 rounded-l-[3rem]">
                                                <div className="font-black text-2xl text-slate-900 tracking-tighter italic leading-none transition-colors uppercase">{student.name}</div>
                                                <div className="text-[10px] text-slate-600 mt-2 font-bold uppercase tracking-[0.3em] italic">REF_{student.id.toString().substring(0, 8).toUpperCase()}</div>
                                            </td>
                                            <td className="px-6 py-10 hidden md:table-cell">
                                                <div className="text-[10px] text-slate-700 font-bold uppercase tracking-widest bg-white/50 px-4 py-2 rounded-full border border-slate-200 italic">{student.email}</div>
                                            </td>
                                            <td className="px-6 py-10 text-center">
                                                <span className="text-xl font-black text-slate-900 tabular-nums italic">{report?.totalQuizzes || 0}</span>
                                            </td>
                                            <td className="px-6 py-10 text-center">
                                                <div className={`text-3xl font-black tabular-nums tracking-tighter italic ${report && report.averageScore >= 70 ? 'text-teal-600' :
                                                    report && report.averageScore >= 50 ? 'text-amber-600' : 'text-red-700'
                                                    }`}>
                                                    {report ? `${report.averageScore.toFixed(0)}%` : '0%'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-10 text-center hidden lg:table-cell">
                                                <div className="flex flex-col items-center gap-3">
                                                    <span className="text-xl font-black text-slate-900 tabular-nums italic">
                                                        {report && report.totalQuizzes > 0
                                                            ? `${Math.round((report.passedQuizzes / report.totalQuizzes) * 100)}%`
                                                            : '0%'}
                                                    </span>
                                                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                                        <div className="h-full bg-teal-500" style={{ width: report && report.totalQuizzes > 0 ? `${(report.passedQuizzes / report.totalQuizzes) * 100}%` : '0%' }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10 text-right rounded-r-[3rem]">
                                                <button
                                                    onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
                                                    className={`elite-button !rounded-2xl !py-3 !px-8 shadow-sm transition-all ${selectedStudent === student.id
                                                        ? 'bg-amber-600/10 !text-amber-800 border-amber-200'
                                                        : 'bg-white border border-slate-200 text-slate-900 shadow-slate-100'
                                                        }`}
                                                >
                                                    <span className="italic">{selectedStudent === student.id ? 'Collapse' : 'Examine'}</span>
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
                    <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-sm relative overflow-hidden animate-slide-up">
                        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-pastel-orange/30 rounded-full blur-[100px]"></div>

                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-14 text-center md:text-left">
                                <div className="w-16 h-16 bg-pastel-orange rounded-[1.5rem] flex items-center justify-center text-amber-900 text-2xl border border-white shadow-sm">
                                    <i className="fas fa-microscope"></i>
                                </div>
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 italic tracking-tighter leading-none uppercase">Diagnostic Analysis</h2>
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] mt-2 italic uppercase">Entity: {students.find(s => s.id === selectedStudent)?.name}</p>
                                </div>
                            </div>

                            {(() => {
                                const report = reports.find(r => r.studentId === selectedStudent);
                                if (!report) {
                                    return (
                                        <div className="text-center py-20 bg-slate-50/50 border border-dashed border-slate-200 rounded-[2.5rem]">
                                            <p className="text-slate-600 font-extrabold uppercase tracking-[0.3em] text-[10px] italic">No telemetry detected for this entity</p>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                        {[
                                            { label: 'Modules Engaged', val: report.totalQuizzes, color: 'text-slate-900', bg: 'bg-pastel-blue', icon: 'fa-layer-group' },
                                            { label: 'Optimal Invocations', val: report.passedQuizzes, color: 'text-teal-900', bg: 'bg-pastel-mint', icon: 'fa-check-double' },
                                            { label: 'Critical Errors', val: report.failedQuizzes, color: 'text-red-700', bg: 'bg-red-50', icon: 'fa-exclamation-circle' },
                                            { label: 'Mean Proficiency', val: `${report.averageScore}%`, color: 'text-amber-900', bg: 'bg-pastel-orange', icon: 'fa-bullseye' },
                                        ].map((stat, i) => (
                                            <div key={i} className={`${stat.bg} p-10 rounded-[2.5rem] border border-white shadow-sm text-center md:text-left relative overflow-hidden`}>
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 rounded-bl-3xl"></div>
                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] mb-8 flex items-center justify-center md:justify-start gap-3 italic">
                                                    <i className={`fas ${stat.icon} opacity-60`}></i>
                                                    {stat.label}
                                                </p>
                                                <p className={`text-5xl font-black ${stat.color} tracking-tighter tabular-nums italic leading-none`}>{stat.val}</p>
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
