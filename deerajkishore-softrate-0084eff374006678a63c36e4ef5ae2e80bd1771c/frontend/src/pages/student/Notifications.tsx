import React, { useEffect, useState } from 'react';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../../components/common/LoadingScreen';

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
                <div className="flex items-center justify-center min-h-[60vh]">
                    <LoadingScreen color="bg-slate-900" />
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="space-y-10 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-4">
                        <h1 className="text-fluid-h1 font-black tracking-tighter text-slate-900 leading-tight md:leading-none uppercase break-normal">New <br /><span className="text-indigo-600">Assignments</span></h1>
                        <p className="text-[10px] md:text-sm text-slate-700 font-bold uppercase tracking-widest break-normal">
                            Quizzes waiting for your attention
                        </p>
                    </div>
                </div>

                {quizzes.length === 0 ? (
                    <div className="bg-white rounded-[1.5rem] md:rounded-[3rem] p-12 md:p-20 text-center border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 border border-slate-100">
                            <i className="fas fa-bell-slash text-slate-400 text-xl md:text-2xl"></i>
                        </div>
                        <p className="text-slate-900 font-black tracking-widest md:tracking-[0.2em] uppercase text-xs break-words">No new notifications</p>
                        <p className="text-slate-600 text-[10px] md:text-xs mt-4 px-4 md:px-10 font-bold break-words">You're all caught up! No pending quizzes assigned.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {quizzes.map((quiz) => (
                            <div key={quiz.id} className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10 border border-slate-100 shadow-sm relative overflow-hidden transition-all hover:border-indigo-100 group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-pastel-blue opacity-30 rounded-bl-[4rem] group-hover:scale-110 transition-transform"></div>

                                {/* Icon / Status */}
                                <div className="w-14 h-14 md:w-20 md:h-20 rounded-[1rem] md:rounded-[1.8rem] bg-pastel-blue flex items-center justify-center text-blue-900 border border-white shadow-sm shrink-0">
                                    <i className="fas fa-bolt text-lg md:text-2xl"></i>
                                </div>

                                {/* Content */}
                                <div className="flex-1 text-left relative z-10 w-full min-w-0">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-3 mb-2 md:mb-1">
                                        <h3 className="text-fluid-h4 font-black tracking-tight text-slate-900 uppercase leading-none break-normal">{quiz.title}</h3>
                                        <span className="px-4 py-1 rounded-full bg-pastel-orange text-amber-900 text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-white w-fit shrink-0">NEW</span>
                                    </div>
                                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 tracking-[0.2em] md:tracking-[0.3em] uppercase break-words">{quiz.courseTitle || 'General Quiz'}</p>

                                    <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-6">
                                        <div className="flex items-center gap-2 text-slate-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                                            <i className="far fa-clock text-blue-600"></i>
                                            <span>{quiz.durationMinutes} Mins</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                                            <i className="fas fa-list-ol text-blue-600"></i>
                                            <span>{quiz.totalQuestions} Que</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                                            <i className="fas fa-calendar-alt text-blue-600"></i>
                                            <span>{quiz.startDate ? new Date(quiz.startDate).toLocaleDateString() : 'Recently'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <button
                                    onClick={() => navigate(`/quiz/${quiz.id}/details`)}
                                    className="elite-button !w-full md:!w-auto !rounded-[1rem] md:!rounded-2xl !py-4 md:!py-6 !px-8 md:!px-12 bg-indigo-600 shadow-xl shadow-indigo-100 whitespace-nowrap transition-all active:scale-95 shrink-0"
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
