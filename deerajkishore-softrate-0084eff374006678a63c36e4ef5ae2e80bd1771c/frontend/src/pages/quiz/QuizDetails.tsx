import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import type { Quiz } from '../../types';

const QuizDetails: React.FC = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [_error, setError] = useState('');
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        if (quizId) {
            loadQuizDetails(quizId);
        }
    }, [quizId]);

    const loadQuizDetails = async (id: string) => {
        try {
            const [detailsData, quizzesList] = await Promise.all([
                apiService.getQuizQuestions(id),
                apiService.getStudentQuizzes()
            ]);

            const quizStatus = quizzesList.find(q => String(q.id) === String(id) || String(q._id) === String(id));

            setQuiz({
                ...detailsData,
                isCompleted: quizStatus?.isCompleted,
                score: quizStatus?.score,
                passed: quizStatus?.passed
            });
        } catch (err) {
            console.error('Error loading quiz details:', err);
            setError('Failed to load quiz details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <StudentLayout>
            <div className="max-w-5xl mx-auto py-12 px-4 animate-fade-in">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <div className="relative w-24 h-24">
                            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="mt-8 text-slate-900 font-black uppercase tracking-[0.3em] text-sm animate-pulse">Initializing Assessment...</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Header & Stats */}
                        <div className="text-center space-y-2">
                            <h2 className="text-fluid-h4 font-black text-slate-500 tracking-widest uppercase break-words">Assessment Details</h2>
                            <div className="text-6xl md:text-8xl font-black text-indigo-600 tracking-tighter tabular-nums leading-none break-words">
                                {quiz?.questions?.length || 0}
                            </div>
                            <p className="text-slate-900 font-extrabold text-fluid-h3 uppercase tracking-tight mt-4 break-words">
                                {quiz?.title || 'Details'}
                            </p>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-12 md:mt-16 pb-8 md:pb-12">
                                {[
                                    { label: 'QUESTIONS', val: quiz?.questions?.length?.toString() || '0', color: 'text-blue-900', bg: 'bg-pastel-blue' },
                                    { label: 'DURATION', val: quiz?.durationMinutes?.toString() || '30', color: 'text-teal-900', bg: 'bg-pastel-mint' },
                                    { label: 'TOTAL POINTS', val: quiz?.questions?.reduce((sum, q) => sum + (q.points || 0), 0).toString() || '0', color: 'text-indigo-900', bg: 'bg-pastel-lavender' },
                                    { label: 'TYPE', val: quiz?.questions?.every(q => q.type === 'mcq') ? 'MCQ' : 'MIXED', color: 'text-amber-900', bg: 'bg-pastel-orange' },
                                ].map((stat, i) => (
                                    <div key={i} className={`${stat.bg} rounded-[1.25rem] md:rounded-[2rem] p-6 md:p-10 shadow-sm border border-white flex flex-col items-center justify-center`}>
                                        <div className={`text-2xl md:text-4xl font-black ${stat.color} mb-1 tabular-nums break-words`}>
                                            {stat.val}
                                        </div>
                                        <div className="text-slate-800 font-black text-[9px] md:text-[10px] uppercase tracking-widest break-words">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-8">
                            <h2 className="text-center text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase">Structure Breakdown</h2>

                            <div className="bg-white rounded-[1.5rem] md:rounded-[3rem] p-4 md:p-6 shadow-sm border border-slate-100 space-y-3 md:space-y-4">
                                {[
                                    {
                                        title: 'Multiple Choice',
                                        desc: 'Standard MCQ questions',
                                        val: quiz?.questions?.filter(q => q.type === 'mcq').length.toString() || '0',
                                        icon: 'fa-list-ul',
                                        color: 'text-blue-900',
                                        bg: 'bg-pastel-blue',
                                        unit: 'QTY'
                                    },
                                    {
                                        title: 'Points Per Question',
                                        desc: 'Average points per entity',
                                        val: quiz?.questions?.length ? (quiz.questions.reduce((sum, q) => sum + (q.points || 0), 0) / quiz.questions.length).toFixed(0) : '0',
                                        icon: 'fa-brain',
                                        color: 'text-teal-900',
                                        bg: 'bg-pastel-mint',
                                        unit: 'AVG MARKS'
                                    },
                                    {
                                        title: 'Total Duration',
                                        desc: 'Absolute time limit',
                                        val: (quiz?.scheduledAt && quiz?.expiresAt
                                            ? Math.round((new Date(quiz.expiresAt).getTime() - new Date(quiz.scheduledAt).getTime()) / 60000)
                                            : quiz?.durationMinutes || 30).toString(),
                                        icon: 'fa-clock',
                                        color: 'text-indigo-900',
                                        bg: 'bg-pastel-lavender',
                                        unit: 'MINUTES'
                                    },
                                    {
                                        title: 'Total Possible Score',
                                        desc: 'Maximum attainable points',
                                        val: quiz?.questions?.reduce((sum, q) => sum + (q.points || 0), 0).toString() || '0',
                                        icon: 'fa-trophy',
                                        color: 'text-amber-900',
                                        bg: 'bg-pastel-orange',
                                        unit: 'TOTAL MARKS',
                                        isHighlighted: true
                                    },
                                ].map((item, i) => (
                                    <div key={i} className={`flex items-center justify-between p-5 md:p-8 rounded-[1.25rem] md:rounded-[2.5rem] ${item.isHighlighted ? 'bg-amber-50/30 border border-amber-100' : 'bg-slate-50/50 border border-slate-50'}`}>
                                        <div className="flex items-center gap-4 md:space-x-6 min-w-0">
                                            <div className={`w-12 h-12 md:w-14 md:h-14 ${item.bg} ${item.color} rounded-xl md:rounded-2xl flex items-center justify-center md:text-xl border border-white shadow-sm shrink-0`}>
                                                <i className={`fas ${item.icon}`}></i>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-black text-slate-900 text-sm md:text-base uppercase break-words">{item.title}</h3>
                                                <p className="text-[10px] md:text-xs text-slate-600 font-bold break-words">{item.desc}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-xl md:text-3xl font-black text-slate-900 tabular-nums break-words">{item.val}</div>
                                            <div className="text-[8px] font-black text-slate-500 tracking-widest uppercase break-words">{item.unit}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Directives Section */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-6">
                                <div className="h-px flex-1 bg-slate-200"></div>
                                <h2 className="text-xs font-black text-slate-900 tracking-[0.4em] uppercase">Assessment Directives</h2>
                                <div className="h-px flex-1 bg-slate-200"></div>
                            </div>

                            <div className="bg-white rounded-[1.5rem] md:rounded-[3rem] p-6 md:p-10 border border-slate-100 shadow-sm space-y-8 md:space-y-10">
                                {[
                                    { title: 'Anti-Cheat Protocols', text: 'Screen tracking is active. Unauthorized window shifts will be logged.', icon: 'fa-shield-alt', color: 'text-red-700' },
                                    { title: 'Data Persistence', text: "Progress is recorded dynamically. Do not refresh or close the browser.", icon: 'fa-database', color: 'text-blue-700' },
                                    { title: 'Execution Window', text: 'Timer is absolute. System termination occurs upon expiration.', icon: 'fa-hourglass-start', color: 'text-indigo-700' },
                                ].map((rule, i) => (
                                    <div key={i} className="flex gap-4 md:gap-6">
                                        <div className={`${rule.color} md:text-2xl pt-1 shrink-0`}>
                                            <i className={`fas ${rule.icon}`}></i>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 mb-1 text-sm md:text-base uppercase leading-none break-words">{rule.title}</h3>
                                            <p className="text-xs md:text-sm text-slate-700 font-bold leading-relaxed break-words">{rule.text}</p>
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-8 border-t border-slate-100">
                                    <label className="flex items-start space-x-6 cursor-pointer group">
                                        <div className="relative mt-1">
                                            <input
                                                type="checkbox"
                                                className="peer hidden"
                                                checked={agreed}
                                                onChange={() => setAgreed(!agreed)}
                                            />
                                            <div className="w-6 h-6 border-2 border-slate-200 rounded-lg peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center shadow-sm">
                                                <i className="fas fa-check text-white text-[10px] opacity-0 peer-checked:opacity-100"></i>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-800 font-black uppercase tracking-widest leading-relaxed">
                                            I acknowledge the mission directives and agree to proceed under these standardized protocols.
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 pt-12">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-full md:w-auto px-10 md:px-12 py-5 md:py-6 text-slate-700 font-black tracking-widest md:tracking-[0.3em] uppercase rounded-[1rem] md:rounded-2xl border border-slate-200 bg-white shadow-sm"
                            >
                                <i className="fas fa-arrow-left mr-3"></i> Abort
                            </button>
                            <button
                                onClick={() => {
                                    if (quiz?.isCompleted) {
                                        navigate('/student/quizzes');
                                        return;
                                    }
                                    if (agreed && quizId) {
                                        navigate(`/quiz/${quizId}`);
                                    }
                                }}
                                disabled={(!agreed && !quiz?.isCompleted) || loading}
                                className={`w-full md:w-auto px-12 md:px-20 py-5 md:py-6 rounded-[1rem] md:rounded-2xl font-black tracking-widest md:tracking-[0.3em] uppercase shadow-lg transition-all flex items-center justify-center ${quiz?.isCompleted
                                    ? 'bg-indigo-600 text-white shadow-indigo-100'
                                    : agreed && !loading
                                        ? 'bg-indigo-600 text-white shadow-indigo-200 active:scale-95'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                    }`}
                            >
                                {quiz?.isCompleted ? (
                                    <>
                                        <i className="fas fa-check-double mr-3"></i> Mission Complete
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-bolt mr-3"></i> {loading ? 'Syncing...' : 'Initiate Sequence'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default QuizDetails;
