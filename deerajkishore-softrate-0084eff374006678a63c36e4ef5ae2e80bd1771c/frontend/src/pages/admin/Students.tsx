import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiService from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    const handleDownloadReport = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        const report = getStudentReport(studentId);
        if (!student || !report) return;

        const doc = new jsPDF();

        // Add header
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59);
        doc.text('Student Performance Report', 14, 25);

        // Add details
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Student Name: ${student.name}`, 14, 40);
        doc.text(`Email: ${student.email}`, 14, 47);
        doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 54);

        // Add summary table
        autoTable(doc, {
            startY: 65,
            head: [['Performance Index', 'Statistical Value']],
            body: [
                ['Total Quizzes Taken', report.totalQuizzes.toString()],
                ['Quizzes Passed', report.passedQuizzes.toString()],
                ['Quizzes Failed', report.failedQuizzes.toString()],
                ['Overall Average Score', `${report.averageScore.toFixed(2)}%`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 11, cellPadding: 6 },
            columnStyles: { 0: { fontStyle: 'bold' } }
        });

        // Add some nice footer
        const finalY = (doc as any).lastAutoTable.finalY || 100;
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text('SkillBuilder Platform Intelligence Report', 14, finalY + 20);

        doc.save(`Student_Report_${student.name.replace(/\s+/g, '_')}.pdf`);
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
                            <span className="px-5 py-1.5 rounded-full bg-pastel-orange text-amber-900 text-[10px] font-black uppercase tracking-[0.4em] border border-white">
                                Student Management
                            </span>
                        </div>
                        <h1 className="text-fluid-h2 font-black text-slate-900 tracking-tighter leading-none uppercase">
                            Student <br /><span className="text-amber-600/40">Management</span>
                        </h1>
                        <p className="text-slate-700 text-lg font-bold">View all students and their performance reports</p>
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
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">Registered Students</h2>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1">Monitor student activity and results</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-2 overflow-x-auto pb-8">
                        <table className="w-full px-10">
                            <thead>
                                <tr className="text-slate-500 uppercase tracking-[0.4em] text-[9px] md:text-[10px] font-black border-b border-slate-50">
                                    <th className="px-6 md:px-10 py-8 text-left">Student Info</th>
                                    <th className="px-4 py-8 text-center">Performance</th>
                                    <th className="px-6 md:px-10 py-8 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => {
                                    const report = getStudentReport(student.id);
                                    return (
                                        <tr key={student.id} className="group border-b border-slate-50/50 last:border-0 hover:bg-slate-50/30 transition-colors">
                                            <td className="px-6 md:px-10 py-8">
                                                <div className="flex flex-col gap-2">
                                                    <div className="font-black text-xl md:text-2xl text-slate-900 tracking-tighter leading-none transition-colors uppercase line-clamp-1">{student.name}</div>
                                                    <div className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-[150px] md:max-w-none">{student.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-8">
                                                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-10">
                                                    <div className="text-center">
                                                        <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">QUIZZES</p>
                                                        <p className="text-sm md:text-xl font-black text-slate-900 tabular-nums leading-none">{report?.totalQuizzes || 0}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">AVG SCORE</p>
                                                        <p className={`text-sm md:text-xl font-black tabular-nums tracking-tighter leading-none ${report && report.averageScore >= 70 ? 'text-teal-600' :
                                                            report && report.averageScore >= 50 ? 'text-amber-600' : 'text-red-700'
                                                            }`}>
                                                            {report ? `${report.averageScore.toFixed(0)}%` : '0%'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 md:px-10 py-8 text-right">
                                                <button
                                                    onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
                                                    className={`w-10 h-10 md:w-auto md:px-6 md:py-3 rounded-xl md:rounded-2xl flex items-center justify-center border transition-all ${selectedStudent === student.id
                                                        ? 'bg-amber-600 text-white border-amber-600'
                                                        : 'bg-white border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200'
                                                        }`}
                                                >
                                                    <i className={`fas ${selectedStudent === student.id ? 'fa-eye-slash' : 'fa-eye'} text-xs md:mr-2`}></i>
                                                    <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Report</span>
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
                            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 mb-14 text-center md:text-left">
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                                    <div className="w-16 h-16 bg-pastel-orange rounded-[1.5rem] flex items-center justify-center text-amber-900 text-2xl border border-white shadow-sm">
                                        <i className="fas fa-microscope"></i>
                                    </div>
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none uppercase">Student Performance Report</h2>
                                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] mt-2 uppercase">Viewing: {students.find(s => s.id === selectedStudent)?.name}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDownloadReport(selectedStudent)}
                                    className="elite-button !rounded-2xl !py-4 !px-8 bg-amber-600 shadow-xl shadow-amber-200/50 flex items-center gap-3 transition-all hover:scale-105"
                                >
                                    <i className="fas fa-file-pdf text-sm"></i>
                                    <span className="text-[11px] font-black uppercase tracking-widest">Download Report</span>
                                </button>
                            </div>

                            {(() => {
                                const report = reports.find(r => r.studentId === selectedStudent);
                                if (!report) {
                                    return (
                                        <div className="text-center py-20 bg-slate-50/50 border border-dashed border-slate-200 rounded-[2.5rem]">
                                            <p className="text-slate-600 font-extrabold uppercase tracking-[0.3em] text-[10px]">No data available for this student</p>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                        {[
                                            { label: 'Quizzes Taken', val: report.totalQuizzes, color: 'text-slate-900', bg: 'bg-pastel-blue', icon: 'fa-layer-group' },
                                            { label: 'Passed Quizzes', val: report.passedQuizzes, color: 'text-teal-900', bg: 'bg-pastel-mint', icon: 'fa-check-double' },
                                            { label: 'Failed Quizzes', val: report.failedQuizzes, color: 'text-red-700', bg: 'bg-red-50', icon: 'fa-exclamation-circle' },
                                            { label: 'Average Score', val: `${report.averageScore}%`, color: 'text-amber-900', bg: 'bg-pastel-orange', icon: 'fa-bullseye' },
                                        ].map((stat, i) => (
                                            <div key={i} className={`${stat.bg} p-10 rounded-[2.5rem] border border-white shadow-sm text-center md:text-left relative overflow-hidden`}>
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 rounded-bl-3xl"></div>
                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] mb-8 flex items-center justify-center md:justify-start gap-3">
                                                    <i className={`fas ${stat.icon} opacity-60`}></i>
                                                    {stat.label}
                                                </p>
                                                <p className={`text-5xl font-black ${stat.color} tracking-tighter tabular-nums leading-none`}>{stat.val}</p>
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
