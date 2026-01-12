import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import type { QuizResult } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';

const QuizResults: React.FC = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [result, setResult] = useState<any>(null);
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

            // Add mock data for the dashboard refinement
            const enhancedData = {
                ...data,
                completedDate: data.submittedAt ? new Date(data.submittedAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }) : '12 Apr 2023',
                timeSpent: '50m', // Mocked - we can calculate this from total time if needed or BE returns it
                percentile: 65,   // Mocked
                attempts: 1,      // Mocked
                avgTime: '50m',   // Mocked
                // used existing data.timePerQuestion or fallback to 0s if missing
                timePerQuestion: data.timePerQuestion || new Array(data.questions?.length || 10).fill(0),
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
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </StudentLayout>
        );
    }

    if (!result) return null;

    return (
        <StudentLayout>
            <div className="max-w-7xl mx-auto py-8 px-4">
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center">
                            Quiz Reports <span className="text-blue-600 ml-2">Dashboard</span>
                        </h1>
                        <p className="text-gray-500 font-medium mt-1">Track your progress and performance analytics</p>
                    </div>

                    {/* User Summary Card */}
                    <div className="bg-white rounded-3xl p-4 pr-8 border border-gray-100 shadow-xl shadow-gray-100/50 flex items-center gap-6 min-w-[320px]">
                        <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-blue-200">
                            {user?.name?.split(' ').map(n => n[0]).join('') || 'JS'}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-gray-900 leading-tight">{user?.name || 'John Smith'}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {user?.department || 'Computer Science'} • {user?.degree || 'SEM 4'}
                            </p>
                        </div>
                        <div className="text-right border-l border-gray-100 pl-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Overall</p>
                            <p className="text-2xl font-black text-blue-600 leading-none">{result.percentage?.toFixed(0)}%</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* LEFT COLUMN - Statistics Overview */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* Main Report Card */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl shadow-gray-100/50 relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-3 py-1.5 rounded-xl">Quiz Report</span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-xs font-bold text-gray-400">Completed: {result.completedDate}</span>
                                </div>

                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                                    <div>
                                        <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-6">{result.courseTitle || 'Quiz Result'}</h2>
                                        <div className="flex items-center gap-4">
                                            <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-sm border-2 ${result.passed ? 'border-green-100 bg-green-50/50 text-green-600' : 'border-red-100 bg-red-50/50 text-red-600'
                                                }`}>
                                                <i className={`fas ${result.passed ? 'fa-check' : 'fa-times'}`}></i>
                                                {result.passed ? 'Passed' : 'Failed'}
                                            </div>
                                            <div className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black uppercase tracking-widest text-sm border-2 border-blue-100">
                                                <i className="fas fa-layer-group"></i>
                                                {result.percentage >= 80 ? 'Advanced Level' : result.percentage >= 60 ? 'Intermediate' : 'Beginner'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-center md:text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total Score</p>
                                        <p className="text-7xl font-black text-blue-600 leading-none">{result.percentage?.toFixed(0)}<span className="text-3xl">%</span></p>
                                        {result.percentage >= 90 && (
                                            <p className="text-emerald-500 font-black text-xs uppercase tracking-widest mt-3 flex items-center justify-center md:justify-end">
                                                <i className="fas fa-arrow-up mr-2"></i> Top 10%
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-10 border-t border-gray-50">
                                    {[
                                        { label: 'Correct', val: result.correctAnswers, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                                        { label: 'Incorrect', val: result.incorrectAnswers, color: 'text-red-500', bg: 'bg-red-50/50' },
                                        { label: 'Time Spent', val: result.timeSpent, color: 'text-orange-500', bg: 'bg-orange-50/50' },
                                        { label: 'Percentile', val: result.percentile, color: 'text-emerald-500', bg: 'bg-emerald-50/50' },
                                    ].map((stat, i) => (
                                        <div key={i} className={`${stat.bg} p-6 rounded-3xl border border-transparent hover:border-white hover:shadow-lg transition-all`}>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{stat.label}</p>
                                            <p className={`text-3xl font-black ${stat.color}`}>{stat.val}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Chart Section */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl shadow-gray-100/50">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-10">Time Per Question</h3>
                            <div className="relative h-64 flex items-end justify-between px-4">
                                {/* Grid lines */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-gray-100">
                                    {[180, 160, 140, 120, 100, 80, 60, 40, 20, 0].map(val => (
                                        <div key={val} className="flex items-center gap-4">
                                            <span className="text-[8px] font-bold text-gray-300 w-6 text-right">{val}</span>
                                            <div className="flex-1 border-t border-gray-50"></div>
                                        </div>
                                    ))}
                                </div>

                                {/* Bars */}
                                {result.timePerQuestion.map((time: number, i: number) => (
                                    <div key={i} className="relative group flex flex-col items-center flex-1">
                                        <div
                                            className="w-10 bg-blue-400/80 rounded-t-xl group-hover:bg-blue-600 transition-all cursor-pointer relative z-10"
                                            style={{ height: `${(time / 180) * 100}%`, minHeight: '4px' }}
                                        >
                                            <div className="hidden group-hover:block absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-4 py-2 rounded-xl whitespace-nowrap z-20 shadow-xl">
                                                <p className="font-black mb-0.5">Q{i + 1}</p>
                                                <p className="text-gray-400">Time: {time} seconds</p>
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900"></div>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase mt-4">Q{i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Question Analysis Section */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl shadow-gray-100/50">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xs">
                                    <i className="fas fa-tasks"></i>
                                </div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Question Analysis</h3>
                            </div>

                            <div className="space-y-6">
                                {(showMore ? result.questions : result.questions.slice(0, 4)).map((q: any, i: number) => (
                                    <div key={i} className={`p-8 rounded-[2rem] border-2 transition-all ${q.isCorrect ? 'border-green-50 bg-green-50/20' : 'border-red-50 bg-red-50/20'
                                        }`}>
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-1 ${q.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                <i className={`fas ${q.isCorrect ? 'fa-check' : 'fa-times'}`}></i>
                                            </div>
                                            <h4 className="text-lg font-bold text-gray-800 leading-relaxed">
                                                Q{i + 1}: {q.text}
                                            </h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">Your Answer</p>
                                                <p className={`font-bold ${q.isCorrect ? 'text-gray-800' : 'text-gray-900 underline decoration-red-200'}`}>
                                                    {q.userAnswer}
                                                </p>
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">Correct Answer</p>
                                                <p className="font-bold text-gray-800">
                                                    {q.correctAnswer}
                                                </p>
                                            </div>
                                        </div>

                                        {!q.isCorrect && (
                                            <div className="mt-6 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center">
                                                    <i className="fas fa-lightbulb mr-2"></i> Explanation
                                                </p>
                                                <p className="text-sm text-blue-700 font-medium leading-relaxed">
                                                    {q.explanation || 'Review the core concepts related to this topic to understand why the correct answer is ' + q.correctAnswer + '.'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowMore(!showMore)}
                                className="w-full mt-10 py-5 text-sm font-black text-blue-600 hover:text-blue-700 uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all"
                            >
                                {showMore ? 'Show Less' : 'Show All Questions'}
                                <i className={`fas fa-chevron-${showMore ? 'up' : 'down'} text-xs`}></i>
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - SIDEBAR */}
                    <div className="lg:col-span-4 space-y-10">
                        {/* Engagement Rate Card */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl shadow-gray-100/50 relative overflow-hidden">
                            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xs">
                                    <i className="fas fa-chart-pie"></i>
                                </div>
                                Engagement Rate
                            </h3>

                            <div className="space-y-10">
                                <div>
                                    <div className="flex justify-between items-end mb-4">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Quiz Engagement</p>
                                        <p className="text-xl font-black text-indigo-600">65%</p>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full w-[65%] rounded-full shadow-lg shadow-blue-100"></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    {[
                                        { label: 'Completion', val: '98%', icon: 'fa-check-circle', color: 'text-blue-600' },
                                        { label: 'Avg. Score', val: `${result.correctAnswers}/${result.totalPoints / 10}`, icon: 'fa-star', color: 'text-emerald-500' },
                                        { label: 'Attempts', val: result.attempts, icon: 'fa-history', color: 'text-orange-500' },
                                        { label: 'Avg. Time', val: result.avgTime, icon: 'fa-clock', color: 'text-red-400' },
                                    ].map((item, i) => (
                                        <div key={i} className="space-y-4">
                                            <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center text-sm">
                                                <i className={`fas ${item.icon} ${item.color}`}></i>
                                            </div>
                                            <div>
                                                <p className="text-3xl font-black text-gray-900">{item.val}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{item.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleDownloadPDF}
                                className="w-full mt-10 py-5 bg-gray-900 text-white font-black rounded-[1.5rem] hover:bg-gray-800 transition-all flex items-center justify-center gap-4 shadow-xl shadow-gray-200 uppercase tracking-widest text-xs"
                            >
                                <i className="fas fa-download"></i>
                                Download Report
                            </button>
                        </div>

                        {/* Additional Info / CTA */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                <i className="fas fa-rocket text-9xl"></i>
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-2xl font-black mb-4">Ready for the next challenge?</h3>
                                <p className="text-blue-100 text-sm font-medium mb-10 leading-relaxed opacity-80">
                                    Continue your learning journey by taking another quiz or exploring new courses.
                                </p>
                                <button
                                    onClick={() => navigate('/student/dashboard')}
                                    className="w-full py-5 bg-white text-blue-600 font-black rounded-2xl hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/20 uppercase tracking-widest text-xs"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Footer */}
                <div className="mt-20 pt-10 border-t border-gray-100 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                        Quiz Report Dashboard • Student ID: {user?.id?.substring(0, 10).toUpperCase() || 'STU12345'} • Last updated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] font-medium text-gray-300">
                        All reports are generated automatically and can be downloaded for future reference.
                    </p>
                </div>
            </div>
        </StudentLayout>
    );
};

export default QuizResults;
