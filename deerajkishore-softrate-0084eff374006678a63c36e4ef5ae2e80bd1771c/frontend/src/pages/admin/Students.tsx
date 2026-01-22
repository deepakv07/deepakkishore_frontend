import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import LoadingScreen from '../../components/common/LoadingScreen';
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

    const handleDownloadReport = async (studentId: string) => {
        try {
            const student = students.find(s => s.id === studentId);
            if (!student) return;

            // Fetch detailed report
            const detailedReport = await apiService.getStudentLatestDetailedReport(studentId);

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;

            // --- Header ---
            doc.setFillColor(30, 41, 59); // Slate-800
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.text('Student Performance Report', 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(200, 200, 200);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

            // --- Student Info ---
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(14);
            doc.text(`Student: ${student.name}`, 14, 55);
            doc.setFontSize(11);
            doc.setTextColor(100, 100, 100);
            doc.text(`${student.email}`, 14, 62);

            // --- Executive Summary ---
            let currentY = 75;

            doc.setFontSize(14);
            doc.setTextColor(30, 41, 59);
            doc.text('Executive Summary (Latest Quiz)', 14, currentY);
            currentY += 10;

            autoTable(doc, {
                startY: currentY,
                head: [['Metric', 'Value']],
                body: [
                    ['Score', `${(detailedReport.quiz_summary?.average_score * 100).toFixed(1)}%`],
                    ['Duration', `${detailedReport.quiz_summary?.total_duration}s`],
                    ['Total Questions', detailedReport.quiz_summary?.total_questions?.toString() || 'N/A'],
                    ['Questions Attempted', detailedReport.quiz_summary?.questions_attempted?.toString() || 'N/A'],
                    ['Job Readiness', detailedReport.quick_summary_view?.job_readiness ? `${detailedReport.quick_summary_view.job_readiness.score} (${detailedReport.quick_summary_view.job_readiness.level})` : (detailedReport.job_readiness ? `${detailedReport.job_readiness.readiness_score}/100` : 'N/A')],
                    ['Estimated Role', detailedReport.quick_summary_view?.market_value?.estimated_role || detailedReport.lpa_estimation?.role || 'N/A'],
                    ['Expected LPA', detailedReport.quick_summary_view?.market_value?.expected_lpa || detailedReport.lpa_estimation?.estimated_lpa || 'N/A']
                ],
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] }, // Indigo
                styles: { fontSize: 10 },
                margin: { left: 14, right: 100 } // Keep it narrow
            });

            currentY = (doc as any).lastAutoTable.finalY + 20;

            // --- Strengths & Weaknesses ---
            const strengths = detailedReport.topic_analysis?.strengths || [];
            const weaknesses = detailedReport.topic_analysis?.weaknesses || [];

            doc.setFontSize(14);
            doc.setTextColor(22, 163, 74); // Green
            doc.text('Key Strengths', 14, currentY);

            doc.setTextColor(220, 38, 38); // Red
            doc.text('Areas for Improvement', pageWidth / 2 + 10, currentY);

            currentY += 10;
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);

            // Render lists
            const maxItems = Math.max(strengths.length, weaknesses.length, 1);
            for (let i = 0; i < maxItems; i++) {
                if (strengths[i]) doc.text(`• ${strengths[i]}`, 14, currentY + (i * 6));
                if (weaknesses[i]) doc.text(`• ${weaknesses[i]}`, pageWidth / 2 + 10, currentY + (i * 6));
            }

            currentY += (maxItems * 6) + 20;

            // --- Market Value Analysis ---
            // --- Market Value Analysis ---
            if (detailedReport.market_value || detailedReport.lpa_estimation) {
                // Helpers
                const formatRange = (val: string | undefined) => {
                    if (!val) return 'N/A';
                    return val.replace(/([\d\.]+)/g, (match) => {
                        const num = parseFloat(match);
                        return isNaN(num) ? match : num.toFixed(2);
                    });
                };

                doc.setFontSize(14);
                doc.setTextColor(30, 41, 59);
                doc.text('Market Value Analysis', 14, currentY);
                currentY += 10;

                const market = detailedReport.market_value || detailedReport.lpa_estimation || {};
                const role = market.estimated_role || market.role || 'N/A';
                const range = market.salary_range || market.range || 'N/A';

                autoTable(doc, {
                    startY: currentY,
                    head: [['Role Estimation', 'Expected Salary Range']],
                    body: [
                        [
                            role,
                            formatRange(range)
                        ]
                    ],
                    theme: 'striped',
                    headStyles: { fillColor: [234, 179, 8] }, // Yellow/Gold
                    styles: { fontSize: 10, cellPadding: 5 }
                });

                currentY = (doc as any).lastAutoTable.finalY + 20;
            }

            // --- Strategic Interpretation ---
            if (detailedReport.interpretation) {
                doc.setFontSize(14);
                doc.setTextColor(30, 41, 59);
                doc.text('Strategic Roadmap', 14, currentY);
                currentY += 10;

                doc.setFontSize(11);
                doc.setTextColor(50, 50, 50);
                doc.text(`Advisor Message: "${detailedReport.interpretation.message}"`, 14, currentY);
                currentY += 10;

                doc.text(`Recommended Timeline: ${detailedReport.interpretation.timeline}`, 14, currentY);
                currentY += 10;

                if (detailedReport.interpretation.actions && detailedReport.interpretation.actions.length > 0) {
                    doc.text('Recommended Actions:', 14, currentY);
                    currentY += 7;
                    detailedReport.interpretation.actions.forEach((action: string) => {
                        doc.text(`• ${action}`, 20, currentY);
                        currentY += 6;
                    });
                }

                currentY += 10;
            }

            // --- Detailed Question Analysis ---
            doc.setFontSize(14);
            doc.setTextColor(30, 41, 59);
            doc.text('Detailed Question Analysis', 14, currentY);
            currentY += 10;

            const questions = detailedReport.questions_attempted || detailedReport.questions || [];

            const tableRows = questions.map((q: any, i: number) => {
                return [
                    (i + 1).toString(),
                    q.question || q.question_text || q.text || 'Question text missing',
                    q.user_answer || q.userAnswer || '-',
                    q.correct_answer || q.correctAnswer || '-',
                    q.explanation || 'No explanation available.'
                ];
            });

            autoTable(doc, {
                startY: currentY,
                head: [['#', 'Question', 'Your Answer', 'Correct', 'AI Feedback']],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
                columnStyles: {
                    0: { cellWidth: 14, halign: 'center' }, // # Increased from 8 to 14
                    1: { cellWidth: 50 }, // Question
                    2: { cellWidth: 35 }, // Your Answer
                    3: { cellWidth: 35 }, // Correct Answer
                    4: { cellWidth: 'auto' } // AI Feedback
                },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 4) {
                        const text = data.cell.raw as string;
                        if (text && text.includes("No explanation available")) {
                            data.cell.styles.textColor = [150, 150, 150];
                            data.cell.styles.fontStyle = 'italic';
                        } else {
                            data.cell.styles.textColor = [20, 83, 45];
                        }
                    }
                }
            });

            // Save
            doc.save(`Detailed_Report_${student.name.replace(/\s+/g, '_')}.pdf`);

        } catch (error) {
            console.error("Failed to generate report", error);
            alert("Could not generate detailed report. Please try again.");
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
                                            <td className="px-6 md:px-10 py-8 align-middle">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="font-black text-xl md:text-2xl text-slate-900 tracking-tighter transition-colors uppercase line-clamp-1">{student.name}</div>
                                                    <div className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-[150px] md:max-w-none">{student.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-8 align-middle">
                                                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-10">
                                                    <div className="flex flex-col items-center gap-1.5 text-center">
                                                        <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">QUIZZES</p>
                                                        <p className="text-sm md:text-xl font-black text-slate-900 tabular-nums leading-none">{report?.totalQuizzes || 0}</p>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1.5 text-center">
                                                        <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">AVG SCORE</p>
                                                        <p className={`text-sm md:text-xl font-black tabular-nums tracking-tighter leading-none ${report && report.averageScore >= 70 ? 'text-teal-600' :
                                                            report && report.averageScore >= 50 ? 'text-amber-600' : 'text-red-700'
                                                            }`}>
                                                            {report ? `${report.averageScore.toFixed(0)}%` : '0%'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 md:px-10 py-8 text-right align-middle">
                                                <div className="flex justify-end">
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
                                                </div>
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
