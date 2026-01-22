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
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [showOneMinuteWarning, setShowOneMinuteWarning] = useState(false);

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

    // Timer Logic
    useEffect(() => {
        if (!quiz || loading || timeLeft === null) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null) return null;
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitQuiz(true);
                    return 0;
                }
                if (prev === 61) {
                    setShowOneMinuteWarning(true);
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [quiz, loading]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

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

            // Calculate duration: if both scheduledAt and expiresAt exist, use as duration
            // Otherwise use durationMinutes field
            const duration = quizData.scheduledAt && quizData.expiresAt
                ? Math.round((new Date(quizData.expiresAt).getTime() - new Date(quizData.scheduledAt).getTime()) / 60000)
                : quizData.durationMinutes || 30;

            setTimeLeft(duration * 60);
            console.log('Quiz loaded, timer started at:', new Date().toISOString(), `Duration: ${duration} mins`);
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
            <div className="min-h-screen bg-[var(--bg-main)] text-slate-900 flex flex-col font-sans">
                {/* Modern Header */}
                <div className="h-20 md:h-24 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-12 sticky top-0 z-40">
                    <div className="flex items-center gap-4 md:gap-6 min-w-0">
                        <button
                            onClick={() => navigate('/student/quizzes')}
                            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 shrink-0"
                        >
                            <i className="fas fa-chevron-left text-xs"></i>
                        </button>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest md:tracking-[0.2em] leading-none">Assessment Session</span>
                            <span className="text-[10px] md:text-xs font-bold text-slate-900 uppercase tracking-widest mt-1 truncate">{quiz?.title || 'Loading...'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    className="text-slate-100"
                                />
                                <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    strokeDasharray={175}
                                    strokeDashoffset={175 - (175 * (timeLeft || 0)) / ((quiz?.durationMinutes || 30) * 60)}
                                    className="text-indigo-600 transition-all duration-1000"
                                />
                            </svg>
                            <span className="absolute text-[8px] md:text-[10px] font-bold text-slate-900 tabular-nums">
                                {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col items-center py-12 px-6 overflow-y-auto">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-8 text-slate-900 font-black uppercase tracking-[0.3em] text-xs">Syncing Entities...</p>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mb-8 text-3xl border border-red-100">
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase">Sync Failure</h3>
                            <p className="text-slate-700 max-w-sm mb-10 font-bold">{error}</p>
                            <button onClick={() => navigate('/student/quizzes')} className="elite-button !px-12 bg-slate-900 text-white uppercase">Return to Lobby</button>
                        </div>
                    ) : (
                        <div className="max-w-3xl w-full space-y-10">
                            {/* Question Progress Tracker */}
                            <div className="space-y-6">
                                <div className="flex items-end justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Question</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-extrabold text-slate-900 leading-none">{currentQuestionIndex + 1}</span>
                                            <span className="text-xl font-bold text-slate-300">/{totalQuestions}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Completion Status</span>
                                        <p className="text-base font-bold text-indigo-600 mt-1 leading-none">{Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%</p>
                                    </div>
                                </div>
                                <div className="h-3 w-full bg-white rounded-full overflow-hidden p-1 border border-slate-100 shadow-sm">
                                    <div
                                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                        style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Question Section */}
                            <div className="bg-white p-8 md:p-14 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden flex items-center justify-center min-h-[150px]">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-pastel-lavender opacity-30 rounded-bl-[4rem]"></div>
                                <h2 className="text-xl md:text-3xl font-bold text-slate-900 leading-snug text-center relative z-10 uppercase break-words px-2">
                                    {currentQuestion?.text}
                                </h2>
                            </div>

                            {/* Options List or Descriptive Input */}
                            <div className="grid grid-cols-1 gap-5">
                                {currentQuestion?.options && currentQuestion.options.length > 0 ? (
                                    (currentQuestion.options).map((option, idx) => {
                                        const qId = currentQuestion?.id?.toString() || currentQuestion?._id?.toString() || `q${currentQuestionIndex}`;
                                        const isSelected = selectedAnswers[qId] === option;
                                        const letter = String.fromCharCode(65 + idx); // A, B, C, D

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswerSelect(qId, option)}
                                                className={`w-full flex items-center p-3 md:p-6 rounded-[1rem] md:rounded-[1.5rem] border-2 transition-all duration-200 group relative ${isSelected
                                                    ? 'bg-pastel-blue/40 border-indigo-600 shadow-sm'
                                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center font-bold text-[10px] md:text-xs border-2 shrink-0 ${isSelected
                                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                                    : 'bg-slate-50 border-slate-100 text-slate-900'
                                                    }`}>
                                                    {letter}
                                                </div>
                                                <span className={`ml-3 md:ml-6 text-sm md:text-base font-bold uppercase transition-all text-left flex-1 break-words line-clamp-3 md:line-clamp-none ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                                    {option}
                                                </span>
                                                {isSelected && (
                                                    <div className="ml-3 text-indigo-600 shrink-0">
                                                        <i className="fas fa-check-circle text-base md:text-lg"></i>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="space-y-4">
                                        <textarea
                                            value={selectedAnswers[currentQuestion?.id?.toString() || currentQuestion?._id?.toString() || `q${currentQuestionIndex}`] || ''}
                                            onChange={(e) => handleAnswerSelect(currentQuestion?.id?.toString() || currentQuestion?._id?.toString() || `q${currentQuestionIndex}`, e.target.value)}
                                            placeholder="Type your descriptive answer here..."
                                            className="w-full h-80 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-slate-100 bg-white focus:border-indigo-600 focus:ring-0 transition-all font-semibold text-base text-slate-800 resize-none outline-none shadow-sm"
                                        />
                                        <div className="flex justify-between items-center px-4 md:px-8">
                                            <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none break-words">Char Count: {(selectedAnswers[currentQuestion?.id?.toString() || currentQuestion?._id?.toString() || `q${currentQuestionIndex}`] || '').length}</span>
                                            <span className="text-[9px] md:text-[10px] font-black text-indigo-600/40 uppercase tracking-widest animate-pulse leading-none">Auto-saving...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Area */}
                            <div className="pt-12 flex flex-col items-center gap-6">
                                <button
                                    onClick={currentQuestionIndex === totalQuestions - 1 ? confirmSubmit : handleNext}
                                    className="elite-button !w-full !py-5 !text-lg !rounded-[1.5rem] bg-indigo-600 shadow-xl shadow-indigo-100 uppercase"
                                >
                                    {currentQuestionIndex === totalQuestions - 1 ? 'Submit Quiz' : 'Next Question'}
                                </button>

                                {currentQuestionIndex > 0 && (
                                    <button
                                        onClick={handlePrevious}
                                        className="text-[10px] font-bold text-slate-700 tracking-[0.2em] uppercase underline underline-offset-4"
                                    >
                                        Previous Question
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Refined Modals */}
                {(showConfirmation || showWarningModal || showViolationModal || showSuccessModal) && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 transition-all">
                        {showConfirmation && (
                            <div className="bg-white w-full max-w-sm md:max-w-md p-8 md:p-14 rounded-[1.5rem] md:rounded-[3.5rem] shadow-2xl text-center border border-slate-100 relative overflow-hidden">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-pastel-blue text-blue-900 rounded-xl md:rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8 text-2xl md:text-3xl border border-white shadow-sm shrink-0">
                                    <i className="fas fa-cloud-upload-alt"></i>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 uppercase leading-none break-words">Confirm Submission</h3>
                                <p className="text-slate-700 mb-8 md:mb-12 font-bold text-xs md:text-sm break-words">
                                    You have completed {Object.keys(selectedAnswers).length} out of {totalQuestions} entities. All data will be finalized.
                                </p>
                                <div className="space-y-4">
                                    <button onClick={() => handleSubmitQuiz()} className="elite-button !w-full !py-4 md:!py-5 bg-indigo-600">SUBMIT</button>
                                    <button onClick={() => setShowConfirmation(false)} className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest md:tracking-[0.3em] leading-none">CANCEL</button>
                                </div>
                            </div>
                        )}

                        {showWarningModal && (
                            <div className="bg-white rounded-[1.5rem] md:rounded-[3.5rem] p-8 md:p-14 max-w-sm md:max-w-md w-full shadow-2xl text-center border border-slate-100 relative overflow-hidden">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-pastel-orange text-amber-900 rounded-xl md:rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8 text-2xl md:text-3xl border border-white shadow-sm shrink-0">
                                    <i className="fas fa-exclamation-circle"></i>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 uppercase leading-none break-words">Protocol Violation</h3>
                                <p className="text-slate-700 mb-8 md:mb-10 font-bold text-xs md:text-sm leading-relaxed break-words">
                                    Unauthorized shift detected. Maintain focus on the assessment window to avoid <span className="text-red-600 font-black">SYSTEM TERMINATION</span>.
                                </p>
                                <button
                                    onClick={() => { setShowWarningModal(false); if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => { }); }}
                                    className="elite-button !w-full !py-4 md:!py-5 bg-slate-900"
                                >
                                    RESTORE SESSION
                                </button>
                            </div>
                        )}

                        {showViolationModal && (
                            <div className="bg-white rounded-[1.5rem] md:rounded-[3.5rem] p-8 md:p-14 max-w-sm md:max-w-md w-full shadow-2xl text-center border border-slate-100 relative overflow-hidden">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 text-red-600 rounded-xl md:rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8 text-2xl md:text-3xl border border-red-100">
                                    <i className="fas fa-user-shield"></i>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 uppercase leading-none break-words">AUTO-TERMINATED</h3>
                                <p className="text-slate-700 mb-8 md:mb-10 font-bold text-xs md:text-sm leading-relaxed break-words">
                                    Multiple proctoring deviations logged. Session has been force-closed and data committed for review.
                                </p>
                                <button
                                    onClick={() => navigate('/student/dashboard')}
                                    className="elite-button !w-full !py-4 md:!py-5 bg-slate-900"
                                >
                                    DISMISS TERMINATION
                                </button>
                            </div>
                        )}

                        {showSuccessModal && (
                            <div className="bg-white w-full max-w-sm md:max-w-md p-8 md:p-14 rounded-[1.5rem] md:rounded-[3.5rem] shadow-2xl text-center border border-slate-100 relative overflow-hidden">
                                <div className="w-16 h-16 md:w-24 md:h-24 bg-pastel-mint text-teal-900 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 text-3xl md:text-4xl border border-white shadow-sm shrink-0">
                                    <i className="fas fa-check-circle"></i>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 uppercase leading-none break-words">Transmission Success</h3>
                                <p className="text-slate-700 mb-8 md:mb-12 font-bold text-xs md:text-sm break-words">
                                    Your quiz has been submitted successfully.
                                </p>
                                <button onClick={() => navigate(`/quiz/${quizId}/results`)} className="elite-button !w-full !py-5 md:!py-6 bg-teal-600 shadow-xl shadow-teal-100">VIEW RESULTS</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Time Warning Modal */}
                {showOneMinuteWarning && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 transition-all">
                        <div className="bg-white w-full max-w-sm p-10 rounded-[3rem] shadow-2xl text-center border border-slate-100">
                            <div className="w-16 h-16 bg-pastel-orange text-amber-900 rounded-[1.2rem] flex items-center justify-center mx-auto mb-6 text-2xl border border-white shadow-sm">
                                <i className="fas fa-hourglass-half"></i>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase leading-none">Critical Threshold</h3>
                            <p className="text-slate-700 mb-8 font-bold text-sm">
                                Internal timer entering final minute. Expedite your selections.
                            </p>
                            <button
                                onClick={() => setShowOneMinuteWarning(false)}
                                className="elite-button !w-full bg-amber-600"
                            >
                                ACKNOWLEDGED
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default QuizInterface;
