import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import type { Quiz } from '../../types';

const QuizInterface: React.FC = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [showConfirmation, setShowConfirmation] = useState(false);
    const isSubmittingRef = React.useRef(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [showViolationModal, setShowViolationModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [questionTimings, setQuestionTimings] = useState<Record<string, number>>({});
    const [lastSwitchTime, setLastSwitchTime] = useState<number>(Date.now());
    const prevIndexRef = React.useRef(0);

    // Load initial warnings
    useEffect(() => {
        if (quizId) {
            apiService.getQuizProgress(quizId)
                .then(() => {
                    // warnings handled by handleDeviation
                })
                .catch(err => console.error('Failed to load progress:', err));
        }
    }, [quizId]);

    const handleDeviation = async () => {
        if (!quizId || isSubmittingRef.current) return;

        try {
            const data = await apiService.recordWarning(quizId);

            if (data.warnings >= 2) {
                // Strike 2: Auto-submit
                setShowViolationModal(true);
                // Submit in background, don't redirect yet
                handleSubmitQuiz(false);
            } else {
                // Strike 1: Warning
                setShowWarningModal(true);
            }
        } catch (err) {
            console.error('Failed to record warning:', err);
        }
    };

    // Proctoring: Request Full Screen on Mount
    useEffect(() => {
        const enterFullScreen = async () => {
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (err) {
                console.warn('Full screen request denied or failed:', err);
            }
        };
        enterFullScreen();
    }, []);

    // Proctoring: Auto-submit on tab switch
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && !isSubmittingRef.current && quiz) {
                handleDeviation();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [quiz, quizId]);

    // Proctoring: Auto-submit on Full Screen Exit (Esc key)
    useEffect(() => {
        const handleFullScreenChange = () => {
            if (!document.fullscreenElement && !isSubmittingRef.current && quiz) {
                if (!isSubmittingRef.current) {
                    handleDeviation();
                }
            }
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, [quiz, quizId]);

    useEffect(() => {
        if (!quiz) return;

        const now = Date.now();
        const timeSpent = Math.floor((now - lastSwitchTime) / 1000);

        const prevQuestion = quiz.questions[prevIndexRef.current];
        if (prevQuestion) {
            const qId = prevQuestion.id?.toString() || prevQuestion._id?.toString() || `q${prevIndexRef.current}`;
            console.log(`Time for question ${prevIndexRef.current + 1} (${qId}): ${timeSpent}s`);
            setQuestionTimings(prev => ({
                ...prev,
                [qId]: (prev[qId] || 0) + timeSpent
            }));
        }

        setLastSwitchTime(now);
        prevIndexRef.current = currentQuestionIndex;
    }, [currentQuestionIndex]);

    useEffect(() => {
        if (quizId) {
            loadQuiz(quizId);
        }
    }, [quizId]);

    const loadQuiz = async (id: string) => {
        try {
            const [quizData, quizzesList] = await Promise.all([
                apiService.getQuizQuestions(id),
                apiService.getStudentQuizzes()
            ]);

            const quizStatus = quizzesList.find(q => String(q.id) === String(id) || String(q._id) === String(id));

            if (quizStatus?.isCompleted) {
                alert('You have already completed this quiz.');
                navigate('/student/dashboard');
                return;
            }

            setQuiz(quizData);
            // Reset timing when quiz loads
            setLastSwitchTime(Date.now());
            setQuestionTimings({});
            console.log('Quiz loaded, timer started at:', new Date().toISOString());
        } catch (err) {
            console.error('Error loading quiz:', err);
            setError('Failed to load quiz. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (questionId: string, answer: string) => {
        setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleNext = () => {
        if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const confirmSubmit = () => {
        setShowConfirmation(true);
    };

    const handleSubmitQuiz = async (navigateAfter = true) => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setShowConfirmation(false);

        if (!quiz || !quizId) {
            isSubmittingRef.current = false;
            return;
        }

        try {
            setLoading(true);
            const answers = quiz.questions.map((q, index) => {
                const questionId = q.id?.toString() || q._id?.toString() || `q${index}`;
                return {
                    questionId: questionId,
                    answer: selectedAnswers[questionId] || ''
                };
            });

            const now = Date.now();
            const lastTimeSpent = Math.floor((now - lastSwitchTime) / 1000);
            const currentQuestion = quiz.questions[currentQuestionIndex];
            const currentQId = currentQuestion.id?.toString() || currentQuestion._id?.toString() || `q${currentQuestionIndex}`;

            const finalTimings = {
                ...questionTimings,
                [currentQId]: (questionTimings[currentQId] || 0) + lastTimeSpent
            };

            console.log('Final timings before submit:', finalTimings);
            console.log('Total time tracked:', Object.values(finalTimings).reduce((a, b) => a + b, 0), 'seconds');

            const validAnswers = answers.filter(a => a.answer);

            await apiService.submitQuiz({
                quizId: quizId,
                answers: validAnswers,
                questionTimings: finalTimings
            });

            if (navigateAfter) {
                setShowSuccessModal(true);
            }
        } catch (err: any) {
            console.error('Error submitting quiz:', err);
            setError(err?.response?.data?.message || 'Failed to submit quiz. Please try again.');
            setLoading(false);
            isSubmittingRef.current = false;
        }
    };

    const currentQuestion = quiz?.questions[currentQuestionIndex];
    const totalQuestions = quiz?.questions.length || 0;

    return (
        <StudentLayout hideNavbar={true}>
            <div className="min-h-screen bg-[#030508] text-white flex flex-col font-mono">
                {/* Clean Header - Match Image 0/1 */}
                <div className="h-20 border-b border-white/5 bg-white/2 backdrop-blur-xl flex items-center justify-between px-10 sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <span className="text-xl font-black text-white tracking-widest uppercase">{quiz?.title || 'ASSESSMENT'}</span>
                    </div>

                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">TIME REMAINING</span>
                            <div className="text-2xl font-black text-[#00E5FF] tabular-nums tracking-wider">
                                {quiz?.durationMinutes || '30'}:00
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area - Centered Card */}
                <div className="flex-1 flex items-center justify-center p-6 bg-grid-white/[0.02]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-8 text-[#00E5FF] text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Syncing Mission Data...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center space-y-8">
                            <i className="fas fa-exclamation-triangle text-5xl text-red-500 animate-pulse"></i>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">System Error Detected</h3>
                            <p className="text-gray-500 font-medium">{error}</p>
                            <button onClick={() => navigate('/student/quizzes')} className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10">Reboot Session</button>
                        </div>
                    ) : (
                        <div className="max-w-4xl w-full">
                            {/* Question Card - Match Image 0/1 */}
                            <div className="glass-card p-12 rounded-[3rem] border border-white/5 shadow-2xl space-y-10 relative overflow-hidden bg-white/5 transition-all">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-[#8E9AAF] uppercase tracking-[0.3em]">
                                        QUESTION {currentQuestionIndex + 1} / {totalQuestions}
                                    </p>
                                    <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
                                        {currentQuestion?.text}
                                    </h2>
                                </div>

                                {/* Options List */}
                                <div className="space-y-4">
                                    {(currentQuestion?.options || []).map((option, idx) => {
                                        const qId = currentQuestion?.id?.toString() || currentQuestion?._id?.toString() || `q${currentQuestionIndex}`;
                                        const isSelected = selectedAnswers[qId] === option;

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswerSelect(qId, option)}
                                                className={`w-full flex items-center p-6 rounded-2xl border transition-all duration-300 ${isSelected
                                                    ? 'bg-[#00E5FF11] border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.1)]'
                                                    : 'bg-white/2 border-white/5 hover:bg-white/5 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-[#00E5FF] bg-[#00E5FF]' : 'border-white/10 bg-white/5'
                                                    }`}>
                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#030508]"></div>}
                                                </div>
                                                <span className={`ml-6 text-lg font-medium transition-all ${isSelected ? 'text-[#00E5FF]' : 'text-gray-400'}`}>
                                                    {option}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Navigation Actions */}
                                <div className="flex items-center justify-between pt-10 border-t border-white/5">
                                    <button
                                        onClick={handlePrevious}
                                        disabled={currentQuestionIndex === 0}
                                        className="px-8 py-4 rounded-2xl bg-white/5 text-[#8E9AAF] border border-white/10 hover:bg-white/10 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed font-black text-xs uppercase tracking-widest flex items-center gap-3"
                                    >
                                        <i className="fas fa-arrow-left"></i>
                                        Previous
                                    </button>

                                    <div className="flex flex-col items-end gap-6">
                                        {selectedAnswers[currentQuestion?.id?.toString() || currentQuestion?._id?.toString() || `q${currentQuestionIndex}`] && (
                                            <button
                                                onClick={() => {
                                                    const qId = currentQuestion?.id?.toString() || currentQuestion?._id?.toString() || `q${currentQuestionIndex}`;
                                                    setSelectedAnswers(prev => {
                                                        const n = { ...prev };
                                                        delete n[qId];
                                                        return n;
                                                    });
                                                }}
                                                className="text-[10px] text-gray-500 font-black uppercase tracking-widest hover:text-[#00E5FF] transition-colors flex items-center gap-2"
                                            >
                                                <i className="fas fa-times-circle"></i>
                                                Clear Selection
                                            </button>
                                        )}

                                        <button
                                            onClick={handleNext}
                                            disabled={currentQuestionIndex === totalQuestions - 1}
                                            className="px-10 py-4 rounded-2xl bg-[#030508] text-white border border-white/10 hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed font-black text-xs uppercase tracking-widest flex items-center gap-3"
                                        >
                                            Next
                                            <i className="fas fa-arrow-right"></i>
                                        </button>
                                    </div>
                                </div>

                                {/* Submit Button - Highlighted at the bottom of the card */}
                                <div className="pt-6">
                                    <button
                                        onClick={confirmSubmit}
                                        className="w-full py-5 bg-[#0066FF] text-white rounded-3xl font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-[#0066FF44] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Submit Quiz
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modals */}
                {(showConfirmation || showWarningModal || showViolationModal || showSuccessModal) && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#030508]/80 backdrop-blur-md">
                        {showConfirmation && (
                            <div className="glass-card w-full max-w-md p-10 rounded-[3rem] border border-white/10 text-center animate-scale-up">
                                <div className="w-20 h-20 bg-[#00E5FF11] text-[#00E5FF] rounded-3xl flex items-center justify-center mx-auto mb-8 text-3xl border border-[#00E5FF33]">
                                    <i className="fas fa-upload"></i>
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">Final Submission?</h3>
                                <p className="text-gray-500 font-medium mb-10 text-[10px] uppercase tracking-widest leading-relaxed">
                                    {Object.keys(selectedAnswers).length} of {totalQuestions} objectives secured. <br />
                                    This action cannot be undone.
                                </p>
                                <div className="space-y-4">
                                    <button onClick={() => handleSubmitQuiz()} className="w-full py-5 bg-[#00E5FF] text-[#030508] rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-[#00E5FF22] hover:scale-105 active:scale-95 transition-all">EXECUTE UPLOAD</button>
                                    <button onClick={() => setShowConfirmation(false)} className="w-full py-5 text-gray-500 font-black uppercase tracking-[0.2em] hover:text-white transition-colors">ABORT</button>
                                </div>
                            </div>
                        )}

                        {showWarningModal && (
                            <div className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl text-center transform animate-scale-up">
                                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
                                    <i className="fas fa-exclamation-triangle"></i>
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Warning!</h3>
                                <p className="text-gray-600 font-medium mb-10 leading-relaxed">
                                    You have deviated from the quiz window. This is your <span className="text-red-500 font-bold">final warning</span>. <br />
                                    Next time, your test will be <span className="text-red-500 font-bold">auto-submitted</span>.
                                </p>
                                <button
                                    onClick={() => { setShowWarningModal(false); if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => { }); }}
                                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-red-200"
                                >
                                    OK, I Understand
                                </button>
                            </div>
                        )}

                        {showViolationModal && (
                            <div className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl text-center transform animate-scale-up border-2 border-red-500">
                                <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                                    <i className="fas fa-ban"></i>
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Quiz Terminated</h3>
                                <p className="text-gray-600 font-medium mb-10 leading-relaxed">
                                    Multiple violations detected. Your quiz has been <br />
                                    <span className="text-red-500 font-bold">automatically submitted</span>.
                                </p>
                                <button
                                    onClick={() => navigate('/student/dashboard')}
                                    className="w-full py-4 bg-[#1A1F26] hover:bg-[#2D343D] text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl"
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        )}

                        {showSuccessModal && (
                            <div className="glass-card w-full max-w-md p-10 rounded-[3rem] border border-[#00E5FF33] text-center animate-scale-up">
                                <div className="w-24 h-24 bg-[#00E5FF22] text-[#00E5FF] rounded-full flex items-center justify-center mx-auto mb-8 text-4xl border border-[#00E5FF44] shadow-[0_0_40px_rgba(0,229,255,0.2)]">
                                    <i className="fas fa-satellite-dish animate-bounce"></i>
                                </div>
                                <h3 className="text-2xl font-black text-[#00E5FF] mb-2 tracking-tighter uppercase">Transmission Success</h3>
                                <p className="text-gray-500 font-medium mb-10 text-[10px] uppercase tracking-widest leading-relaxed">
                                    All data packets secured. <br />
                                    Proceed to results and analysis.
                                </p>
                                <button onClick={() => navigate(`/quiz/${quizId}/results`)} className="w-full py-5 bg-[#00E5FF] text-[#030508] rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-[#00E5FF22] hover:scale-105 active:scale-95 transition-all">VIEW RESULTS</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default QuizInterface;
