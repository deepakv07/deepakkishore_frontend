import React, { useEffect, useState } from 'react';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import { useNavigate } from 'react-router-dom';

const StudentQuizzes: React.FC = () => {
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadQuizzes();
    }, []);

    const loadQuizzes = async () => {
        try {
            const response = await apiService.getStudentQuizzes();
            const quizzesArray = Array.isArray(response) ? response : [];
            setQuizzes(quizzesArray);
        } catch (err: any) {
            console.error('Error loading quizzes:', err);
            if (err.response?.data?.message?.includes('Cast to ObjectId') || err.message?.includes('Cast to ObjectId')) {
                setError('The quiz you are trying to access has been deleted by the admin.');
            } else {
                setQuizzes([]);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center py-40">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </StudentLayout>
        );
    }

    const filteredQuizzes = quizzes.filter((quiz) => {
        if (filter === 'completed') return quiz.isCompleted;
        if (filter === 'pending') return !quiz.isCompleted;
        return true;
    });

    return (
        <StudentLayout>
            <div className="space-y-12 pb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                    <div>
                        <h1 className="text-fluid-h2 font-extrabold tracking-tight text-slate-900 leading-none uppercase">
                            Available <br /><span className="text-slate-400">Quizzes</span>
                        </h1>
                    </div>

                    <div className="bg-white p-2 rounded-[2rem] flex gap-3 border border-slate-100 shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar">
                        {['all', 'pending', 'completed'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-8 py-3 rounded-[1.2rem] text-[10px] font-bold tracking-[0.1em] uppercase transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {quizzes.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-24 text-center border border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-[1.8rem] flex items-center justify-center mx-auto mb-10 border border-slate-100">
                            <i className="fas fa-box-open text-slate-300 text-2xl"></i>
                        </div>
                        <p className="text-slate-900 font-extrabold text-2xl mb-4 uppercase tracking-tight">No Quizzes Available</p>
                        <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest">Check back in a bit for new quizzes.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {filteredQuizzes.map((quiz, idx) => {
                            const isExpired = !quiz.isCompleted && quiz.isExpired;
                            const isFaded = quiz.isCompleted || isExpired;

                            const banners = ['bg-indigo-900', 'bg-slate-800', 'bg-indigo-700', 'bg-slate-900', 'bg-indigo-800'];
                            const bannerColor = banners[idx % banners.length];

                            return (
                                <div key={quiz.id} className={`flex flex-col h-full relative overflow-hidden bg-white rounded-[3.5rem] border border-slate-100 shadow-sm ${isFaded ? 'opacity-95' : ''}`}>
                                    {/* Top Banner Area */}
                                    <div className={`h-24 w-full relative overflow-hidden ${isExpired ? 'bg-rose-900' : bannerColor}`}>
                                        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                                        {quiz.isCompleted && (
                                            <div className="absolute top-6 right-6 bg-emerald-500 text-white px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/20 flex items-center gap-2">
                                                <i className="fas fa-check-circle"></i>
                                                VERIFIED
                                            </div>
                                        )}
                                        {isExpired && (
                                            <div className="absolute top-6 right-6 bg-white text-rose-900 px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border border-rose-200">
                                                DISCONTINUED
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-8 md:p-12 flex flex-col flex-1">
                                        <div className="mb-6 md:mb-8 min-h-[4rem]">
                                            <p className="text-[9px] md:text-[10px] font-bold text-indigo-600 tracking-[0.2em] uppercase mb-2 leading-none truncate">{quiz.courseTitle || 'CO_MODULE'}</p>
                                            <h3 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 line-clamp-2 leading-tight md:leading-snug uppercase">{quiz.title}</h3>
                                        </div>

                                        <div className="bg-slate-50 p-4 md:p-6 rounded-[1.2rem] md:rounded-[1.5rem] border border-slate-100 mb-6 md:mb-8 flex justify-between">
                                            <div className="text-center flex-1">
                                                <p className="text-[8px] font-black text-slate-400 tracking-[0.2rem] uppercase mb-1">START TIME</p>
                                                <p className="text-xs font-black text-emerald-600">N/A</p>
                                            </div>
                                            <div className="w-px bg-slate-200"></div>
                                            <div className="text-center flex-1">
                                                <p className="text-[8px] font-black text-slate-400 tracking-[0.2rem] uppercase mb-1">END TIME</p>
                                                <p className="text-xs font-black text-emerald-600">N/A</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-12">
                                            <div className="bg-white/50 p-5 rounded-2xl border border-slate-100">
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">SCORE: {quiz.percentage || 0}%</p>
                                                <p className="text-xs font-black text-indigo-600 uppercase">{quiz.durationMinutes || 30} MINS</p>
                                            </div>
                                            <div className="bg-white/50 p-5 rounded-2xl border border-slate-100 text-right">
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{quiz.totalQuestions || 0} QUESTIONS</p>
                                                <p className="text-xs font-black text-rose-600 uppercase">X FAILED</p>
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <button
                                                disabled={isExpired}
                                                onClick={() => navigate(quiz.isCompleted ? `/quiz/${quiz.id}/results` : `/quiz/${quiz.id}/details`)}
                                                className={`elite-button !w-full !py-5 !text-[10px] !rounded-[1.2rem] font-bold uppercase tracking-widest ${quiz.isCompleted
                                                    ? 'bg-slate-900 !text-white'
                                                    : isExpired
                                                        ? 'opacity-20 grayscale pointer-events-none'
                                                        : 'bg-indigo-600 shadow-xl'
                                                    }`}
                                            >
                                                <span>{quiz.isCompleted ? 'VIEW RESULTS' : isExpired ? 'Locked' : 'START QUIZ'}</span>
                                                <i className={`fas ${quiz.isCompleted ? 'fa-chart-bar' : 'fa-arrow-right'} text-[10px] opacity-100 ml-2`}></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Error Logic Popup */}
                {error && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-sm">
                        <div className="bg-white max-w-sm w-full p-12 rounded-[4rem] border border-white shadow-2xl relative overflow-hidden">
                            <div className="text-center">
                                <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-rose-100 shadow-sm">
                                    <i className="fas fa-shield-halved text-4xl text-rose-600"></i>
                                </div>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 uppercase leading-none">Security Flag</h3>
                                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-12 leading-relaxed">
                                    {error}
                                </p>
                                <button
                                    onClick={() => setError(null)}
                                    className="elite-button !w-full !py-6 !rounded-[2rem] bg-indigo-600 uppercase tracking-widest"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout >
    );
};

export default StudentQuizzes;
