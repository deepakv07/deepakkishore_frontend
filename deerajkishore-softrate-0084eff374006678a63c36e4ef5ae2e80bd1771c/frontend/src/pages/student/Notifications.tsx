import React, { useEffect, useState } from 'react';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import { useNavigate } from 'react-router-dom';

const StudentNotifications: React.FC = () => {
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadQuizzes();
    }, []);

    const loadQuizzes = async () => {
        try {
            const response = await apiService.getStudentQuizzes();
            const quizzesArray = Array.isArray(response) ? response : [];
            // Filter to only show quizzes that are NOT completed (Pending)
            const pendingQuizzes = quizzesArray.filter((q: any) => !q.isCompleted);
            setQuizzes(pendingQuizzes);
        } catch (err: any) {
            console.error('Error loading quizzes:', err);
            setQuizzes([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center py-40">
                    <div className="w-16 h-16 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#00E5FF55]"></div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="space-y-10 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mt-1 italic text-slate-900 leading-none">New <br /><span className="text-indigo-600">Assignments</span></h1>
                        <p className="text-sm text-slate-700 font-bold uppercase tracking-widest mt-4 italic">
                            Quizzes waiting for your attention
                        </p>
                    </div>
                </div>

                {quizzes.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                            <i className="fas fa-bell-slash text-slate-400 text-2xl"></i>
                        </div>
                        <p className="text-slate-900 font-black tracking-[0.2em] uppercase text-xs italic">No new notifications</p>
                        <p className="text-slate-600 text-xs mt-4 italic px-10 font-bold">You're all caught up! No pending quizzes assigned.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {quizzes.map((quiz) => (
                            <div key={quiz.id} className="bg-white rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-pastel-blue opacity-30 rounded-bl-[4rem]"></div>

                                {/* Icon / Status */}
                                <div className="w-20 h-20 rounded-[1.8rem] bg-pastel-blue flex items-center justify-center text-blue-900 border border-white shadow-sm shrink-0">
                                    <i className="fas fa-bolt text-2xl"></i>
                                </div>

                                {/* Content */}
                                <div className="flex-1 text-center md:text-left relative z-10">
                                    <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-2">
                                        <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic leading-none">{quiz.title}</h3>
                                        <span className="px-5 py-1.5 rounded-full bg-pastel-orange text-amber-900 text-[10px] font-black uppercase tracking-widest border border-white italic">NEW</span>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-600 tracking-[0.3em] uppercase italic">{quiz.courseTitle || 'General Quiz'}</p>

                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-6">
                                        <div className="flex items-center gap-3 text-slate-800 text-[10px] font-black uppercase tracking-widest italic">
                                            <i className="far fa-clock text-blue-600"></i>
                                            <span>{quiz.durationMinutes} Mins</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-800 text-[10px] font-black uppercase tracking-widest italic">
                                            <i className="fas fa-list-ol text-blue-600"></i>
                                            <span>{quiz.totalQuestions} Questions</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-800 text-[10px] font-black uppercase tracking-widest italic">
                                            <i className="fas fa-calendar-alt text-blue-600"></i>
                                            <span>{quiz.startDate ? new Date(quiz.startDate).toLocaleDateString() : 'Recently'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <button
                                    onClick={() => navigate(`/quiz/${quiz.id}/details`)}
                                    className="elite-button !rounded-2xl !py-6 !px-12 bg-indigo-600 shadow-xl shadow-indigo-100 whitespace-nowrap italic"
                                >
                                    Start Now
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentNotifications;
