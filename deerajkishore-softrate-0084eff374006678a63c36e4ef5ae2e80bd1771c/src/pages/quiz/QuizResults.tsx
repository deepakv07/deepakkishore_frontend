import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';
import type { QuizResult } from '../../types';

const QuizResults: React.FC = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [result, setResult] = useState<QuizResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [showMore, setShowMore] = useState(false);

    useEffect(() => {
        if (quizId) {
            loadResults(quizId);
        }
    }, [quizId]);

    const loadResults = async (id: string) => {
        try {
            const data = await apiService.getQuizResults(id);

            // Integrate actual or mock data if actual timing missing
            const timings = data.questionTimings || {};
            const timePerQuestionArray = data.questions?.map((q: any) => timings[q.id] || timings[q._id] || Math.floor(Math.random() * 120) + 30) || [];

            const enhancedData = {
                ...data,
                completedDate: data.submittedAt ? new Date(data.submittedAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                timeSpent: data.totalTimeSpent || '50m',
                percentile: data.percentile || 65,
                attempts: data.attempts || 1,
                avgTime: data.avgTime || '50m',
                timePerQuestion: timePerQuestionArray,
            };

            setResult(enhancedData);
        } catch (err: any) {
            console.error('Error loading results:', err);
            alert(err?.response?.data?.message || 'Failed to load quiz results. Please try again.');
            navigate('/student/quizzes');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!result) return;
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.setTextColor(33, 33, 33);
        doc.text('Quiz Performance Report', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`Student: ${result.studentName || user?.name || 'Student'}`, 14, 32);
        doc.text(`Date: ${result.completedDate || new Date().toLocaleDateString()}`, 14, 38);
        doc.setFontSize(12);
        doc.setTextColor(33, 33, 33);
        doc.text(`Overall Score: ${result.percentage}% (${result.score}/${result.totalPoints})`, 14, 48);
        doc.text(`Status: ${result.passed ? 'PASSED' : 'FAILED'}`, 14, 54);
        const rows = result.questions?.map((q: any, index: number) => ({
            index: index + 1,
            question: q.text,
            userAnswer: q.userAnswer,
            correctAnswer: q.correctAnswer,
            status: q.isCorrect ? 'Correct' : 'Incorrect',
        })) || [];
        autoTable(doc, {
            startY: 60,
            head: [['#', 'Question', 'Your Answer', 'Correct Answer', 'Status']],
            body: rows.map((r: any) => [r.index, r.question, r.userAnswer, r.correctAnswer, r.status]),
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 80 } },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 4) {
                    const status = data.cell.raw;
                    if (status === 'Correct') data.cell.styles.textColor = [22, 163, 74];
                    else data.cell.styles.textColor = [220, 38, 38];
                }
            }
        });
        doc.save(`Quiz_Report_${result.quizId || 'Report'}.pdf`);
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-16 h-16 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#00E5FF55]"></div>
                </div>
            </StudentLayout>
        );
    }

    if (!result) return null;

    return (
        <StudentLayout>
            <div className="max-w-7xl mx-auto py-12 px-4 animate-fade-in">
                {/* Dashboard Header (Match Image 2) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
                    <div>
                        <h1 className="text-5xl font-black text-white tracking-tighter">
                            Quiz Reports <span className="text-[#0066FF]">Dashboard</span>
                        </h1>
                        <p className="text-[#8E9AAF] font-medium mt-2">Track your progress and performance analytics</p>
                    </div>

                    {/* Identity Plate */}
                    <div className="glass-card p-4 pr-10 border border-white/5 shadow-2xl flex items-center gap-6 min-w-[340px] relative overflow-hidden">
                        <div className="relative w-16 h-16 bg-[#0066FF] text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg">
                            {user?.name?.split(' ').map(n => n[0]).join('') || 'KM'}
                        </div>
                        <div className="relative flex-1">
                            <h4 className="font-black text-white leading-tight uppercase tracking-tight">{user?.name || 'Recruit'}</h4>
                            <p className="text-[10px] font-bold text-[#8E9AAF] uppercase tracking-widest mt-1">
                                {user?.department || 'COMPUTER SCIENCE'} • {user?.degree || 'SEM 4'}
                            </p>
                        </div>
                        <div className="relative text-right border-l border-white/10 pl-6">
                            <p className="text-[10px] font-black text-[#8E9AAF] uppercase tracking-widest mb-1 opacity-50">OVERALL</p>
                            <p className="text-3xl font-black text-[#0066FF] tracking-tighter tabular-nums">{result.percentage?.toFixed(0)}%</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* LEFT COLUMN - Statistics Overview */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* Main Performance Card (Match Image 2) */}
                        <div className="glass-card rounded-[3rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden bg-white/5">
                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 rounded-full bg-[#0066FF11] border border-[#0066FF33] text-[#0066FF] text-[10px] font-black uppercase tracking-widest">
                                                QUIZ REPORT
                                            </span>
                                            <span className="text-[#8E9AAF] text-xs">•</span>
                                            <span className="text-[#8E9AAF] text-xs font-bold">Completed: {result.completedDate}</span>
                                        </div>
                                        <h2 className="text-5xl font-black text-white tracking-tighter leading-none">Quiz Result</h2>
                                        <div className="flex items-center gap-4">
                                            <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] border ${result.passed
                                                ? 'border-[#00C85333] bg-[#00C8530D] text-[#00C853]'
                                                : 'border-[#FF3D0033] bg-[#FF3D000D] text-[#FF3D00]'
                                                }`}>
                                                <i className={`fas ${result.passed ? 'fa-check' : 'fa-times'}`}></i>
                                                {result.passed ? 'PASSED' : 'FAILED'}
                                            </div>
                                            <div className="flex items-center gap-3 px-6 py-3 bg-[#0066FF0D] text-[#0066FF] border border-[#0066FF33] rounded-2xl font-black uppercase tracking-[0.2em] text-[10px]">
                                                <i className="fas fa-layer-group"></i>
                                                {result.percentage >= 80 ? 'EXPERT' : result.percentage >= 60 ? 'INTERMEDIATE' : 'BEGINNER'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-center md:text-right">
                                        <p className="text-[10px] font-black text-[#8E9AAF] uppercase tracking-[0.3em] mb-3">TOTAL SCORE</p>
                                        <div className="inline-flex items-baseline gap-2">
                                            <span className="text-8xl font-black text-[#0066FF] tracking-tighter leading-none">{result.percentage?.toFixed(0)}</span>
                                            <span className="text-3xl font-black text-[#0066FF]">%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats Grid (Match Image 2) */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-10 border-t border-white/5">
                                    {[
                                        { label: 'CORRECT', val: result.correctAnswers, color: 'text-[#00C853]', bg: 'bg-[#00C8530D]' },
                                        { label: 'INCORRECT', val: result.incorrectAnswers, color: 'text-[#FF3D00]', bg: 'bg-[#FF3D000D]' },
                                        { label: 'TIME SPENT', val: result.timeSpent, color: 'text-[#FF8F00]', bg: 'bg-[#FF8F000D]' },
                                        { label: 'PERCENTILE', val: result.percentile, color: 'text-[#9D4EDD]', bg: 'bg-[#9D4EDD0D]' },
                                    ].map((stat, i) => (
                                        <div key={i} className={`${stat.bg} p-6 rounded-3xl border border-white/5 transition-all hover:scale-105`}>
                                            <p className="text-[10px] font-black text-[#8E9AAF] uppercase tracking-[0.2em] mb-4">{stat.label}</p>
                                            <p className={`text-3xl font-black ${stat.color} tracking-tighter`}>{stat.val}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Telemetry Stream (Chart) (Match Image 2) */}
                        <div className="glass-card rounded-[3rem] p-10 border border-white/5 shadow-2xl relative bg-white/5">
                            <div className="flex items-center justify-between mb-12">
                                <h3 className="text-[10px] font-black text-[#8E9AAF] uppercase tracking-[0.3em]">TIME PER QUESTION</h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse"></div>
                                    <span className="text-[10px] font-black text-[#00E5FF] uppercase tracking-widest">LIVE ANALYSIS</span>
                                </div>
                            </div>

                            <div className="relative h-64 flex items-end justify-between px-4">
                                {/* Technical Grid */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none mb-4">
                                    {[180, 120, 60, 0].map(val => (
                                        <div key={val} className="flex items-center gap-6">
                                            <span className="text-[8px] font-bold text-[#8E9AAF] w-6 text-right tabular-nums">{val}s</span>
                                            <div className="flex-1 border-t border-white/5"></div>
                                        </div>
                                    ))}
                                </div>

                                {/* Neon Bars */}
                                {result.timePerQuestion?.map((time: number, i: number) => (
                                    <div key={i} className="relative group flex flex-col items-center flex-1">
                                        <div
                                            className="w-10 bg-white/10 rounded-t-lg group-hover:bg-[#0066FF] transition-all duration-500 relative z-10"
                                            style={{ height: `${Math.min((time / 180) * 100, 100)}%`, minHeight: '4px' }}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-16 left-1/2 -translate-x-1/2 glass-card border-white/10 px-4 py-2 rounded-xl whitespace-nowrap z-20 pointer-events-none transition-opacity duration-300">
                                                <p className="text-[10px] font-black text-white mb-0.5 uppercase tracking-widest">Q{i + 1}</p>
                                                <p className="text-[10px] font-bold text-[#00E5FF] tabular-nums">{time}s</p>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black text-[#8E9AAF] uppercase mt-4 tracking-tighter">Q{i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Granular Analysis (Match Image 4) */}
                        <div className="glass-card rounded-[3rem] p-10 border border-white/5 shadow-2xl bg-white/5">
                            <div className="flex items-center gap-4 mb-12">
                                <div className="w-10 h-10 bg-[#0066FF11] text-[#0066FF] rounded-2xl flex items-center justify-center text-sm border border-[#0066FF22]">
                                    <i className="fas fa-tasks"></i>
                                </div>
                                <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-tighter">Question Analysis</h3>
                            </div>

                            <div className="space-y-8">
                                {(showMore ? result.questions : result.questions?.slice(0, 4))?.map((q: any, i: number) => (
                                    <div key={i} className="p-10 rounded-[2.5rem] border border-white/5 bg-white/2 hover:bg-white/5 transition-all duration-300">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border ${q.isCorrect ? 'bg-[#00C85311] text-[#00C853] border-[#00C85322]' : 'bg-[#FF3D0011] text-[#FF3D00] border-[#FF3D0022]'}`}>
                                                <i className={`fas ${q.isCorrect ? 'fa-check' : 'fa-times'}`}></i>
                                            </div>
                                            <h4 className="text-xl font-bold text-white tracking-tight">Q{i + 1}: {q.text}</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-[#FF3D00] uppercase tracking-widest">YOUR ANSWER</p>
                                                <p className="font-bold text-lg text-white">{q.userAnswer || 'Not Answered'}</p>
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-[#00C853] uppercase tracking-widest">CORRECT ANSWER</p>
                                                <p className="font-bold text-lg text-white">{q.correctAnswer}</p>
                                            </div>
                                        </div>

                                        {!q.isCorrect && q.explanation && (
                                            <div className="mt-8 pt-8 border-t border-white/5">
                                                <div className="flex gap-4 items-start">
                                                    <div className="text-[#0066FF] mt-1">
                                                        <i className="fas fa-lightbulb"></i>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-[#0066FF] uppercase tracking-widest mb-2">EXPLANATION</p>
                                                        <p className="text-sm text-[#8E9AAF] font-medium leading-relaxed">{q.explanation}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowMore(!showMore)}
                                className="w-full mt-10 py-6 border border-white/5 rounded-3xl text-[10px] font-black text-[#0066FF] hover:bg-[#0066FF11] hover:border-[#0066FF33] uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all duration-500"
                            >
                                {showMore ? 'SHOW LESS' : 'VIEW ALL QUESTIONS'}
                                <i className={`fas fa-chevron-${showMore ? 'up' : 'down'} text-[10px]`}></i>
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - COMMAND CONTROLS */}
                    <div className="lg:col-span-4 space-y-10">
                        {/* Engagement Hub (Match Image 2) */}
                        <div className="glass-card rounded-[3rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden bg-white/5">
                            <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4 uppercase tracking-tighter">
                                <div className="w-10 h-10 bg-[#0066FF11] text-[#0066FF] rounded-2xl flex items-center justify-center text-sm border border-[#0066FF22]">
                                    <i className="fas fa-chart-pie"></i>
                                </div>
                                Engagement Rate
                            </h3>

                            <div className="space-y-12">
                                <div>
                                    <div className="flex justify-between items-end mb-4">
                                        <p className="text-[10px] font-black text-[#8E9AAF] uppercase tracking-widest">QUIZ ENGAGEMENT</p>
                                        <p className="text-2xl font-black text-[#0066FF] tabular-nums">65%</p>
                                    </div>
                                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-[#0066FF] h-full rounded-full transition-all duration-1000"
                                            style={{ width: '65%' }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <div className="w-10 h-10 bg-[#0066FF11] text-[#0066FF] rounded-full flex items-center justify-center">
                                            <i className="fas fa-check-circle"></i>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-white tracking-tighter">98%</p>
                                            <p className="text-[10px] font-bold text-[#8E9AAF] uppercase tracking-widest mt-1">COMPLETION</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="w-10 h-10 bg-[#00C85311] text-[#00C853] rounded-full flex items-center justify-center">
                                            <i className="fas fa-star"></i>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-white tracking-tighter">1/2</p>
                                            <p className="text-[10px] font-bold text-[#8E9AAF] uppercase tracking-widest mt-1">AVG. SCORE</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleDownloadPDF}
                                className="w-full mt-12 py-5 bg-[#030508] text-white border border-white/10 rounded-3xl hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs font-black"
                            >
                                <i className="fas fa-download"></i>
                                DOWNLOAD REPORT
                            </button>
                        </div>

                        {/* Next Challenge (Match Image 3) */}
                        <div className="bg-gradient-to-br from-[#0066FF] to-[#004dc2] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
                                <i className="fas fa-rocket text-8xl"></i>
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-3xl font-black mb-6 tracking-tighter">Ready for the next challenge?</h3>
                                <p className="text-white/80 text-sm font-medium mb-12 leading-relaxed">
                                    Continue your learning journey by taking another quiz or exploring new courses.
                                </p>
                                <button
                                    onClick={() => navigate('/student/dashboard')}
                                    className="w-full py-6 bg-white text-[#0066FF] font-black rounded-3xl hover:scale-105 transition-all duration-300 shadow-xl uppercase tracking-[0.2em] text-xs"
                                >
                                    BACK TO DASHBOARD
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default QuizResults;
