import React, { useEffect, useState } from 'react';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import { useNavigate } from 'react-router-dom';

const StudentQuizzes: React.FC = () => {
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
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

    const filteredQuizzes = quizzes.filter((quiz) => {
        if (filter === 'completed') return quiz.isCompleted;
        if (filter === 'pending') return !quiz.isCompleted;
        return true;
    });

    return (
        <StudentLayout>
            <div className="space-y-10 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter mt-1">Available <span className="neon-text-cyan">Quizzes</span></h1>
                    </div>

                    <div className="glass-card p-1 flex gap-2 w-full md:w-auto">
                        {['all', 'pending', 'completed'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${filter === f ? 'bg-[#00E5FF] text-black shadow-[0_0_15px_#00E5FF55]' : 'text-[#8E9AAF] hover:text-white hover:bg-white/5'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {quizzes.length === 0 ? (
                    <div className="glass-card p-20 text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-satellite-dish text-[#8E9AAF] text-2xl"></i>
                        </div>
                        <p className="text-[#8E9AAF] font-bold tracking-widest uppercase text-xs">No active transmissions found</p>
                        <p className="text-white/40 text-[10px] mt-2 italic px-10">Check back later for new mission assignments in this sector.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {filteredQuizzes.map((quiz) => {
                            const isExpired = !quiz.isCompleted && quiz.isExpired;
                            const isFaded = quiz.isCompleted || isExpired;
                            return (
                                <div key={quiz.id} className={`glass-card group flex flex-col relative overflow-hidden transition-all duration-500 ${isFaded ? 'opacity-60 grayscale-[0.4] hover:grayscale-0 hover:opacity-100' : ''}`}>
                                    {/* Top Banner Area */}
                                    <div className={`h-32 w-full ${isExpired ? 'bg-[#FFEDED]' : 'bg-[#E3EBFF]'}`}></div>

                                    <div className="p-8 flex flex-col h-full">
                                        {/* Header Info */}
                                        <div className="mb-6">
                                            <h3 className="text-2xl font-black tracking-tighter mb-1">{quiz.title}</h3>
                                            <p className="text-xs font-bold text-[#8E9AAF] tracking-widest uppercase">{quiz.courseTitle || 'Course Quiz'}</p>
                                        </div>

                                        {/* Timestamps */}
                                        <div className="space-y-1.5 mb-8">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-[#8E9AAF]">
                                                <span className="opacity-70">Starts:</span>
                                                <span className="text-black/80 font-bold">{quiz.startDate ? new Date(quiz.startDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-[#8E9AAF]">
                                                <span className="opacity-70">Ends:</span>
                                                <span className="text-black/80 font-bold">{quiz.endDate ? new Date(quiz.endDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                                            </div>
                                        </div>

                                        {/* Metrics Row */}
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="text-sm font-black text-[#0066FF] tracking-tight uppercase">
                                                {quiz.isCompleted ? `Score: ${quiz.score || 0}%` : 'Not Attempted'}
                                            </p>
                                            <p className="text-[10px] font-black tracking-widest uppercase text-[#8E9AAF]/60">
                                                {quiz.totalQuestions || 0} QUESTIONS
                                            </p>
                                        </div>

                                        {/* Duration row */}
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-2 text-[#8E9AAF]">
                                                <i className="far fa-clock text-xs"></i>
                                                <span className="text-[10px] font-black tracking-widest uppercase">{quiz.durationMinutes || 30} mins</span>
                                            </div>
                                            {quiz.isCompleted && quiz.score < 50 && (
                                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">X Failed</span>
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        <div className="mt-auto flex justify-center">
                                            <button
                                                disabled={isExpired}
                                                onClick={() => navigate(quiz.isCompleted ? `/quiz/${quiz.id}/results` : `/quiz/${quiz.id}/details`)}
                                                className={`px-12 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 border-2 ${quiz.isCompleted
                                                    ? 'border-[#00C853] text-[#00C853] hover:bg-[#00C853] hover:text-white'
                                                    : isExpired
                                                        ? 'border-[#E0E0E0] text-[#BDBDBD] bg-white'
                                                        : 'border-[#00E5FF] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-white shadow-[0_5px_15px_rgba(0,229,255,0.1)]'
                                                    }`}
                                            >
                                                {quiz.isCompleted ? 'View Results' : isExpired ? 'Expired' : 'ATTEMPT QUIZ'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentQuizzes;
