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
                        <h1 className="text-4xl font-black tracking-tighter mt-1">New <span className="neon-text-cyan">Assignments</span></h1>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-2">
                            Quizzes waiting for your attention
                        </p>
                    </div>
                </div>

                {quizzes.length === 0 ? (
                    <div className="glass-card p-20 text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-bell-slash text-[#8E9AAF] text-2xl"></i>
                        </div>
                        <p className="text-[#8E9AAF] font-bold tracking-widest uppercase text-xs">No new notifications</p>
                        <p className="text-white/40 text-[10px] mt-2 italic px-10">You're all caught up! No pending quizzes assigned.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {quizzes.map((quiz) => (
                            <div key={quiz.id} className="glass-card p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-[#00E5FF55] transition-all duration-300">
                                {/* Icon / Status */}
                                <div className="w-16 h-16 rounded-2xl bg-[#00E5FF11] flex items-center justify-center text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.1)] group-hover:scale-110 transition-transform duration-300 shrink-0">
                                    <i className="fas fa-bolt text-2xl animate-pulse"></i>
                                </div>

                                {/* Content */}
                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                                        <h3 className="text-xl font-black tracking-tight text-white">{quiz.title}</h3>
                                        <span className="px-2 py-0.5 rounded bg-[#00E5FF] text-black text-[9px] font-black uppercase tracking-widest">NEW</span>
                                    </div>
                                    <p className="text-xs font-bold text-[#8E9AAF] tracking-widest uppercase">{quiz.courseTitle || 'General Quiz'}</p>

                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
                                        <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                            <i className="far fa-clock"></i>
                                            <span>{quiz.durationMinutes} Mins</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                            <i className="fas fa-list-ol"></i>
                                            <span>{quiz.totalQuestions} Questions</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                            <i className="fas fa-calendar-alt"></i>
                                            <span>Assigned: {quiz.startDate ? new Date(quiz.startDate).toLocaleDateString() : 'Recently'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <button
                                    onClick={() => navigate(`/quiz/${quiz.id}/details`)}
                                    className="px-8 py-3 rounded-xl bg-[#00E5FF11] border border-[#00E5FF33] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-black font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_15px_rgba(0,229,255,0.05)] hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] whitespace-nowrap"
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
