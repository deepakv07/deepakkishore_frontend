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
    const [activeBar, setActiveBar] = useState<number | null>(null);

    useEffect(() => {
        if (quizId) {
            loadResults(quizId);
        }
    }, [quizId]);

    const loadResults = async (id: string) => {
        try {
            const data = await apiService.getQuizResults(id);

            // Integrate actual timing data from backend
            const timings = data.questionTimings || {};
            const timePerQuestionArray = data.questions?.map((q: any) => {
                const questionId = String(q.id || q._id);
                // Convert object to plain object if needed and ensure string comparison
                // If timings is a generic object, we try to access by string key
                let timingValue = 0;

                if (timings instanceof Map) {
                    // Try exact match or string match
                    timingValue = timings.get(questionId) || timings.get(Number(questionId)) || 0;
                } else {
                    // Try direct property or finding key that matches loosely
                    timingValue = timings[questionId] ||
                        Object.entries(timings).find(([k]) => String(k) === questionId)?.[1] ||
                        0;
                }

                return Number(timingValue) || 0;
            }) || [];

            // Calculate total time spent from questionTimings
            const totalSeconds = Object.values(timings).reduce((sum: number, time: any) => sum + (Number(time) || 0), 0);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            const formattedTime = minutes > 0
                ? `${minutes}m ${seconds}s`
                : `${seconds}s`;

            const enhancedData = {
                ...data,
                completedDate: data.submittedAt ? new Date(data.submittedAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                timeSpent: formattedTime,
                percentile: data.percentile || 65,
                attempts: data.attempts || 1,
                avgTime: data.avgTime || formattedTime,
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
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </StudentLayout>
        );
    }

    if (!result) return null;

    return (
        <StudentLayout>
            <div className="max-w-7xl mx-auto py-8 md:py-12 px-4 md:px-6" onClick={() => setActiveBar(null)}>
                {/* Dashboard Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 md:mb-16 gap-8">
                    <div className="w-full lg:w-auto text-left">
                        <h1 className="text-fluid-h1 font-extrabold text-[#141619] tracking-tight uppercase leading-tight mb-2">
                            Quiz <br /><span className="text-indigo-600">Results</span>
                        </h1>
                        <p className="text-slate-600 font-bold uppercase tracking-widest text-[9px] break-words">Summary of your performance</p>
                    </div>

                    {/* Identity Plate */}
                    <div className="bg-white p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6 w-full lg:w-auto relative overflow-hidden">
                        <div className="flex items-center gap-5 w-full md:w-auto">
                            <div className="relative w-14 h-14 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-md shrink-0">
                                {user?.name?.split(' ').map(n => n[0]).join('') || 'KM'}
                            </div>
                            <div className="relative flex-1 min-w-0">
                                <h4 className="font-bold text-[#141619] text-lg leading-tight uppercase tracking-tight truncate">{user?.name || 'Recruit'}</h4>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 truncate">
                                    {user?.department || 'COMPUTER SCIENCE'} • {user?.degree || 'SEM 4'}
                                </p>
                            </div>
                        </div>
                        <div className="relative text-center md:text-right border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto flex flex-row md:flex-col items-center justify-between md:justify-center gap-2">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">OVERALL</p>
                            <p className="text-2xl md:text-3xl font-extrabold text-indigo-600 tracking-tight tabular-nums leading-none shrink-0">{result.percentage?.toFixed(0)}%</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* LEFT COLUMN - Statistics Overview */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* Main Performance Card */}
                        <div className="bg-white rounded-[1.5rem] md:rounded-[4rem] p-5 md:p-12 border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-8 md:gap-10">
                                    <div className="space-y-6 md:space-y-8 min-w-0 w-full">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="px-3 md:px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] md:text-[10px] font-black uppercase tracking-tight md:tracking-widest shrink-0">
                                                VALIDATED REPORT
                                            </span>
                                            <span className="hidden md:inline text-slate-300 font-bold">•</span>
                                            <span className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-tight md:tracking-widest break-words flex-1 min-w-[100px]">Timestamp: {result.completedDate}</span>
                                        </div>
                                        <h2 className="text-fluid-h2 font-extrabold text-[#141619] tracking-tight leading-tight uppercase break-words">Performance Overview</h2>
                                        <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                            <div className={`flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] border shrink-0 ${result.passed
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                : 'border-rose-200 bg-rose-50 text-rose-800'
                                                }`}>
                                                <i className={`fas ${result.passed ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                                                {result.passed ? 'PASSED' : 'FAILED'}
                                            </div>
                                            <div className="flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] shrink-0">
                                                <i className="fas fa-layer-group"></i>
                                                LEVEL: {result.percentage >= 80 ? 'EXPERT' : result.percentage >= 60 ? 'MID-TIER' : 'BEGINNER'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-left md:text-right shrink-0 w-full md:w-auto mt-6 md:mt-0">
                                        <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 md:mb-4">ACCURACY INDEX</p>
                                        <div className="inline-flex items-baseline gap-1 md:gap-2">
                                            <span className="text-5xl md:text-7xl font-extrabold text-indigo-600 tracking-tighter leading-none tabular-nums">
                                                {result.percentage?.toFixed(0)}
                                            </span>
                                            <span className="text-xl md:text-3xl font-bold text-indigo-600">%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 pt-8 md:pt-12 border-t border-slate-100">
                                    {[
                                        { label: 'CORRECT', val: result.correctAnswers, color: 'text-emerald-900', bg: 'bg-pastel-mint' },
                                        { label: 'INCORRECT', val: result.incorrectAnswers, color: 'text-rose-900', bg: 'bg-pastel-orange' },
                                        { label: 'TIME SPENT', val: result.timeSpent, color: 'text-indigo-900', bg: 'bg-pastel-lavender' },
                                        { label: 'PERCENTILE', val: `${result.percentile}%`, color: 'text-blue-900', bg: 'bg-pastel-blue' },
                                    ].map((stat, i) => (
                                        <div key={i} className={`${stat.bg} p-4 md:p-6 rounded-[1.25rem] md:rounded-[2rem] border border-white shadow-sm transition-all`}>
                                            <p className="text-[8px] md:text-[10px] font-bold text-[#141619] uppercase tracking-tight md:tracking-widest mb-2 md:mb-4 opacity-70 break-words line-clamp-1">{stat.label}</p>
                                            <p className={`text-lg md:text-2xl font-bold ${stat.color} tracking-tight tabular-nums break-words`}>{stat.val}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Telemetry Stream (Chart) */}
                        <div className="bg-white rounded-[1.5rem] md:rounded-[4rem] p-5 md:p-12 border border-slate-100 shadow-sm relative">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-16 gap-4">
                                <h3 className="text-fluid-h4 font-black text-slate-500 uppercase tracking-widest leading-none">Time Per Question</h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-indigo-600 animate-pulse"></div>
                                    <span className="text-[9px] md:text-[10px] font-black text-indigo-600 uppercase tracking-widest">Live Analysis</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto pb-4 no-scrollbar">
                                <div className="relative h-64 md:h-72 flex items-end justify-between px-2 md:px-6 min-w-[500px] lg:min-w-0">
                                    {(() => {
                                        const maxTime = Math.max(...(result.timePerQuestion || [0]));
                                        const chartMax = Math.ceil(Math.max(maxTime + 5, 20) / 5) * 5;
                                        const steps = [chartMax, Math.round(chartMax * 0.66), Math.round(chartMax * 0.33), 0];

                                        return (
                                            <>
                                                {/* Technical Grid */}
                                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none mb-4">
                                                    {steps.map(val => (
                                                        <div key={val} className="flex items-center gap-8">
                                                            <span className="text-[9px] font-black text-slate-400 w-8 text-right tabular-nums">{val}s</span>
                                                            <div className="flex-1 border-t border-slate-100"></div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Bars */}
                                                {result.timePerQuestion?.map((time: number, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="relative group flex flex-col items-center flex-1 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveBar(activeBar === i ? null : i);
                                                        }}
                                                    >
                                                        <div
                                                            className={`w-8 md:w-12 rounded-t-xl relative z-10 border border-indigo-700/10 shadow-sm transition-all duration-300 ${activeBar === i ? 'bg-indigo-500 scale-x-110' : 'bg-indigo-600/90'}`}
                                                            style={{ height: `${Math.min((time / chartMax) * 100, 100)}%`, minHeight: '6px' }}
                                                        >
                                                            <div className={`absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-xl whitespace-nowrap z-20 pointer-events-none transition-all duration-300 shadow-xl border border-slate-800 ${activeBar === i ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95'}`}>
                                                                <p className="text-[8px] font-black mb-1 uppercase tracking-widest">Q{i + 1}</p>
                                                                <p className="text-base font-black tabular-nums">{time}s</p>
                                                            </div>
                                                        </div>
                                                        <span className={`text-[9px] md:text-[10px] font-black uppercase mt-4 md:mt-6 tracking-tight transition-all duration-300 ${activeBar === i ? 'text-indigo-600 scale-110' : 'text-slate-900 opacity-60'}`}>Q{i + 1}</span>
                                                    </div>
                                                ))}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Granular Analysis */}
                        <div className="bg-white rounded-[1.5rem] md:rounded-[4rem] p-5 md:p-12 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4 md:gap-6 mb-10 md:mb-16">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-pastel-blue text-blue-900 rounded-[1rem] md:rounded-[1.5rem] flex items-center justify-center text-lg md:text-xl border border-white shadow-sm shrink-0">
                                    <i className="fas fa-tasks"></i>
                                </div>
                                <h3 className="text-fluid-h3 font-black text-[#141619] tracking-tighter uppercase leading-none break-words">Question Analysis</h3>
                            </div>

                            <div className="space-y-6 md:space-y-10">
                                {(showMore ? result.questions : result.questions?.slice(0, 4))?.map((q: any, i: number) => (
                                    <div key={i} className="p-5 md:p-12 rounded-[1.25rem] md:rounded-[3.5rem] border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-start gap-4 md:gap-6 mb-6 md:mb-10">
                                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-[0.75rem] md:rounded-2xl flex items-center justify-center text-xs md:text-sm border-2 shrink-0 ${q.isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                                <i className={`fas ${q.isCorrect ? 'fa-check' : 'fa-times'}`}></i>
                                            </div>
                                            <h4 className="text-fluid-h4 font-black text-[#141619] tracking-tight uppercase leading-tight break-words flex-1">Q{i + 1}: {q.text}</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                                            <div className="space-y-2 md:space-y-4">
                                                <p className="text-[9px] md:text-[10px] font-black text-rose-800 uppercase tracking-widest leading-none">YOUR ANSWER</p>
                                                <p className="font-black text-fluid-h4 text-[#141619] uppercase break-words">{q.userAnswer || 'NO DATA'}</p>
                                            </div>
                                            <div className="space-y-2 md:space-y-4">
                                                <p className="text-[9px] md:text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none">CORRECT ANSWER</p>
                                                <p className="font-black text-fluid-h4 text-[#141619] uppercase break-words">{q.correctAnswer}</p>
                                            </div>
                                        </div>

                                        {!q.isCorrect && q.explanation && (
                                            <div className="mt-10 pt-10 border-t border-slate-200">
                                                <div className="flex gap-6 items-start">
                                                    <div className="text-indigo-600 text-xl mt-1">
                                                        <i className="fas fa-lightbulb"></i>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-3 italic">EXPLANATION</p>
                                                        <p className="text-base text-slate-700 font-bold italic leading-relaxed">{q.explanation}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowMore(!showMore)}
                                className="w-full mt-12 py-8 border-2 border-slate-100 rounded-[2.5rem] text-[10px] font-black text-slate-600 bg-white shadow-sm uppercase tracking-[0.5em] flex items-center justify-center gap-6 italic"
                            >
                                {showMore ? 'SHOW LESS' : 'SHOW ALL QUESTIONS'}
                                <i className={`fas fa-chevron-${showMore ? 'up' : 'down'} text-[10px]`}></i>
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - COMMAND CONTROLS */}
                    <div className="lg:col-span-4 space-y-12">
                        {/* Download Report Button */}
                        <div className="lg:col-span-4">
                            <button
                                onClick={handleDownloadPDF}
                                className="w-full min-h-[200px] md:min-h-[400px] bg-white rounded-[1.5rem] md:rounded-[4rem] p-6 md:p-12 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center gap-6 md:gap-10"
                            >
                                <div className="w-16 h-16 md:w-28 md:h-28 bg-indigo-600 rounded-[1rem] md:rounded-[2.5rem] flex items-center justify-center text-white text-2xl md:text-4xl shadow-xl border border-white z-10 shrink-0">
                                    <i className="fas fa-file-download"></i>
                                </div>

                                <div className="text-center z-10 space-y-4">
                                    <h3 className="text-2xl font-extrabold text-[#141619] tracking-tight uppercase leading-none">Download Report</h3>
                                    <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Get detailed performance analysis</p>
                                </div>
                            </button>
                        </div>

                        {/* Next Challenge */}
                        <div className="bg-slate-900 rounded-[1.5rem] md:rounded-[4rem] p-6 md:p-12 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 md:p-12 opacity-5 rotate-12">
                                <i className="fas fa-rocket text-[6rem] md:text-[12rem]"></i>
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-fluid-h3 font-black mb-4 md:mb-8 tracking-tighter italic uppercase leading-tight break-words">Ready for the <br />next challenge?</h3>
                                <p className="text-slate-400 text-xs md:text-sm font-bold italic mb-8 md:mb-16 leading-relaxed break-words">
                                    Continue your learning journey by taking another quiz or exploring new courses.
                                </p>
                                <button
                                    onClick={() => navigate('/student/dashboard')}
                                    className="elite-button !w-full !py-5 md:!py-8 !text-[10px] md:!text-sm !rounded-[1rem] md:!rounded-[2.5rem] bg-indigo-600 italic uppercase tracking-[0.2em]"
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
