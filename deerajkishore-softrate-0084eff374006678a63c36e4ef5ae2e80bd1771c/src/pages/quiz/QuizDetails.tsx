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
                            <div className="absolute inset-0 border-4 border-[#00E5FF22] rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-4 border-2 border-[#9D4EDD] border-b-transparent rounded-full animate-spin-slow"></div>
                        </div>
                        <p className="mt-8 text-[#00E5FF] font-black uppercase tracking-[0.3em] text-sm animate-pulse">Initializing Assessment...</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Header & Stats (Match Image 3) */}
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-black text-white tracking-tight">Assessment Details</h2>
                            <div className="text-6xl font-black text-white tracking-tighter">
                                {quiz?.questions?.length || 0}
                            </div>
                            <p className="text-[#8E9AAF] font-bold text-sm">
                                {quiz?.title || 'Details'}
                            </p>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12 pb-12">
                                {[
                                    { label: 'QUESTIONS', val: quiz?.questions?.length?.toString() || '0', color: 'text-[#0066FF]' },
                                    { label: 'DURATION', val: quiz?.durationMinutes?.toString() || '30', color: 'text-[#00C853]' },
                                    { label: 'TOTAL POINTS', val: quiz?.questions?.reduce((sum, q) => sum + (q.points || 0), 0).toString() || '0', color: 'text-[#9D4EDD]' },
                                    { label: 'TYPE', val: quiz?.questions?.every(q => q.type === 'mcq') ? 'MCQ' : 'MIXED', color: 'text-[#FF3D00]' },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center transform transition-transform hover:scale-105">
                                        <div className={`text-3xl font-black ${stat.color} mb-1`}>
                                            {stat.val}
                                        </div>
                                        <div className="text-[#8E9AAF] font-black text-[10px] uppercase tracking-widest">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Breakdown (Match Image 4) */}
                        <div className="space-y-8">
                            <h2 className="text-center text-sm font-black text-white tracking-[0.2em] uppercase">STRUCTURE BREAKDOWN</h2>

                            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 space-y-4">
                                {[
                                    {
                                        title: 'Multiple Choice',
                                        desc: 'Standard MCQ questions',
                                        val: quiz?.questions?.filter(q => q.type === 'mcq').length.toString() || '0',
                                        icon: 'fa-list-ul',
                                        color: 'text-[#0066FF]',
                                        bg: 'bg-[#E3EBFF]',
                                        unit: 'MARKS/QTY'
                                    },
                                    {
                                        title: 'Points Per Question',
                                        desc: 'Average points',
                                        val: quiz?.questions?.length ? (quiz.questions.reduce((sum, q) => sum + (q.points || 0), 0) / quiz.questions.length).toFixed(0) : '0',
                                        icon: 'fa-brain',
                                        color: 'text-[#00C853]',
                                        bg: 'bg-[#E8F5E9]',
                                        unit: 'MARKS/QTY'
                                    },
                                    {
                                        title: 'Total Duration',
                                        desc: 'In minutes',
                                        val: quiz?.durationMinutes?.toString() || '30',
                                        icon: 'fa-clock',
                                        color: 'text-[#9D4EDD]',
                                        bg: 'bg-[#F3E5F5]',
                                        unit: 'MINS'
                                    },
                                    {
                                        title: 'Total Possible Score',
                                        desc: 'Sum of all sections',
                                        val: quiz?.questions?.reduce((sum, q) => sum + (q.points || 0), 0).toString() || '0',
                                        icon: 'fa-trophy',
                                        color: 'text-[#0066FF]',
                                        bg: 'bg-[#E3EBFF]',
                                        unit: 'MARKS/QTY',
                                        isHighlighted: true
                                    },
                                ].map((item, i) => (
                                    <div key={i} className={`flex items-center justify-between p-6 rounded-3xl transition-all duration-300 ${item.isHighlighted ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                                        <div className="flex items-center space-x-6">
                                            <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center text-xl`}>
                                                <i className={`fas ${item.icon}`}></i>
                                            </div>
                                            <div>
                                                <h3 className="font-black text-[#030508] text-base">{item.title}</h3>
                                                <p className="text-xs text-[#8E9AAF] font-medium">{item.desc}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-black text-[#030508]">{item.val}</div>
                                            <div className="text-[8px] font-black text-[#8E9AAF] tracking-widest uppercase">{item.unit}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Directives Section (Restored from previous) */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#FF3D0033]"></div>
                                <h2 className="text-sm font-black text-[#FF3D00] tracking-[0.3em] uppercase">Directives</h2>
                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#FF3D0033]"></div>
                            </div>

                            <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 space-y-8">
                                {[
                                    { title: 'Anti-Cheat Protcols', text: 'Screen tracking is active. Leaving the browser window will trigger a terminal warning.', icon: 'fa-shield-alt', color: 'text-[#FF3D00]' },
                                    { title: 'Data Persistence', text: "Progress is saved per objective. Do not refresh current session.", icon: 'fa-database', color: 'text-[#00E5FF]' },
                                    { title: 'Execution Window', text: 'The timer is absolute. System will auto-terminate upon expiration.', icon: 'fa-hourglass-start', color: 'text-[#9D4EDD]' },
                                ].map((rule, i) => (
                                    <div key={i} className="flex gap-6">
                                        <div className={`${rule.color} text-xl pt-1`}>
                                            <i className={`fas ${rule.icon}`}></i>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-white mb-1 text-sm">{rule.title}</h3>
                                            <p className="text-xs text-gray-400 font-medium leading-relaxed">{rule.text}</p>
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-4 border-t border-white/5">
                                    <label className="flex items-start space-x-4 cursor-pointer group">
                                        <div className="relative mt-1">
                                            <input
                                                type="checkbox"
                                                className="peer hidden"
                                                checked={agreed}
                                                onChange={() => setAgreed(!agreed)}
                                            />
                                            <div className="w-5 h-5 border-2 border-white/10 rounded-md peer-checked:bg-[#00E5FF] peer-checked:border-[#00E5FF] transition-all flex items-center justify-center">
                                                <i className="fas fa-check text-[#030508] text-[8px] opacity-0 peer-checked:opacity-100"></i>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed group-hover:text-gray-400 transition-colors">
                                            I acknowledge the mission directives and agree to proceed under elite protocols.
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-12">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-full md:w-auto px-12 py-5 text-gray-500 font-black tracking-[0.2em] uppercase rounded-2xl border border-white/5 hover:bg-white/5 hover:text-white transition-all duration-300"
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
                                className={`w-full md:w-auto px-16 py-5 rounded-2xl font-black tracking-[0.2em] uppercase shadow-2xl transition-all duration-500 flex items-center justify-center group ${quiz?.isCompleted
                                    ? 'bg-[#00E5FF] text-[#030508] shadow-[#00E5FF44] hover:scale-105'
                                    : agreed && !loading
                                        ? 'bg-[#00E5FF] text-[#030508] shadow-[#00E5FF44] hover:scale-105 hover:shadow-[#00E5FF66] active:scale-95'
                                        : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                                    }`}
                            >
                                {quiz?.isCompleted ? (
                                    <>
                                        <i className="fas fa-check-double mr-3"></i> Mission Complete
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-bolt mr-3 group-hover:animate-pulse"></i> {loading ? 'Syncing...' : 'Initiate Sequence'}
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
