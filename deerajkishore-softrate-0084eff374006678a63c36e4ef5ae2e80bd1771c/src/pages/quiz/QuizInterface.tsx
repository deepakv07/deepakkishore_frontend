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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [warningCount, setWarningCount] = useState(0);

    // Time tracking state
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
    const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<Record<string, number>>({});

    // Track time when question changes
    useEffect(() => {
        setQuestionStartTime(Date.now());
    }, [currentQuestionIndex]);

    const updateTimeSpent = () => {
        if (!quiz) return;
        const now = Date.now();
        const timeSpent = (now - questionStartTime) / 1000; // in seconds

        const questionId = quiz.questions[currentQuestionIndex].id?.toString() ||
            quiz.questions[currentQuestionIndex]._id?.toString() ||
            `q${currentQuestionIndex}`;

        setTimeSpentPerQuestion(prev => ({
            ...prev,
            [questionId]: (prev[questionId] || 0) + timeSpent
        }));
    };

    // ... (rest of the file)

    <button
        onClick={() => handleSubmitQuiz(true)}
        className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-200"
    >
        Yes, Submit Everything
    </button>

    // Load initial warnings
    useEffect(() => {
        if (quizId) {
            apiService.getQuizProgress(quizId)
                .then(data => setWarningCount(data.warnings))
                .catch(err => console.error('Failed to load progress:', err));
        }
    }, [quizId]);

    const handleDeviation = async () => {
        if (!quizId || isSubmittingRef.current) return;

        try {
            const data = await apiService.recordWarning(quizId);
            setWarningCount(data.warnings);

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
                // We proceed anyway, but ideally we'd show a "Start" overlay
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
    }, [quiz, quizId]); // Re-bind when quiz is loaded

    // Proctoring: Auto-submit on Full Screen Exit (Esc key)
    useEffect(() => {
        const handleFullScreenChange = () => {
            if (!document.fullscreenElement && !isSubmittingRef.current && quiz) {
                // Check if it's already submitting to avoid duplicate alerts
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
        if (quizId) {
            loadQuiz(quizId);
        }
    }, [quizId]);

    const loadQuiz = async (id: string) => {
        try {
            // Fetch quiz data and user status
            const [quizData, quizzesList] = await Promise.all([
                apiService.getQuizQuestions(id),
                apiService.getStudentQuizzes()
            ]);

            // Check if already completed
            const quizStatus = quizzesList.find(q => String(q.id) === String(id) || String(q._id) === String(id));

            if (quizStatus?.isCompleted) {
                alert('You have already completed this quiz.');
                navigate('/student/dashboard');
                return;
            }

            setQuiz(quizData);
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
            updateTimeSpent();
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            updateTimeSpent();
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const confirmSubmit = () => {
        setShowConfirmation(true);
    };

    const handleSubmitQuiz = async (navigateAfter = true) => {
        // Prevent double submission
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        // Close confirmation if open
        setShowConfirmation(false);

        if (!quiz || !quizId) {
            isSubmittingRef.current = false;
            return;
        }

        try {
            setLoading(true);
            // Map answers properly - use the question ID from the quiz
            const answers = quiz.questions.map((q, index) => {
                const questionId = q.id?.toString() || q._id?.toString() || `q${index}`;
                const answerKey = q.id?.toString() || q._id?.toString() || `q${index}`;
                return {
                    questionId: questionId,
                    answer: selectedAnswers[answerKey] || '',
                    timeSpent: index === currentQuestionIndex
                        ? (timeSpentPerQuestion[questionId] || 0) + ((Date.now() - questionStartTime) / 1000)
                        : (timeSpentPerQuestion[questionId] || 0)
                };
            });

            console.log('📝 Submitting answers:', answers);

            // Filter out empty answers
            const validAnswers = answers.filter(a => a.answer);

            // Note: We allow submitting even if only 1 is answered, or we can check logic here.
            // But usually the user decides via confirmation.

            await apiService.submitQuiz({
                quizId: quizId,
                answers: validAnswers
            });

            if (navigateAfter) {
                // Show success modal instead of immediate redirect
                setShowSuccessModal(true);
            }
        } catch (err: any) {
            console.error('Error submitting quiz:', err);
            setError(err?.response?.data?.message || 'Failed to submit quiz. Please try again.');
            setLoading(false);
            isSubmittingRef.current = false;
        }
    };

    // Timer state
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [showTimeWarning, setShowTimeWarning] = useState(false);

    // Initialize timer
    useEffect(() => {
        if (quiz?.durationMinutes) {
            setTimeLeft(quiz.durationMinutes * 60);
        }
    }, [quiz]);

    // Timer countdown
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // 1-Minute Warning Popup Logic
    useEffect(() => {
        if (timeLeft === 60) {
            setShowTimeWarning(true);
            const hideTimer = setTimeout(() => {
                setShowTimeWarning(false);
            }, 3000);
            return () => clearTimeout(hideTimer);
        }
    }, [timeLeft]);

    // Auto-submit when time reaches 0
    useEffect(() => {
        if (timeLeft === 0 && !isSubmittingRef.current && !showSuccessModal && !showViolationModal) {
            // Auto-submit
            console.log('⏰ Time is up! Auto-submitting...');
            handleSubmitQuiz(false); // Submit without navigating yet
            setShowSuccessModal(true); // Show success/time-up modal
        }
    }, [timeLeft]);

    // Format time helper
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const currentQuestion = quiz?.questions[currentQuestionIndex];

    return (
        <StudentLayout hideNavbar={true}>
            {/* Sticky Timer Header */}
            {timeLeft !== null && (
                <div className={`fixed top-0 left-0 right-0 z-40 px-6 py-3 shadow-md transition-colors duration-300 flex justify-between items-center ${timeLeft < 60 ? 'bg-red-600 text-white' : 'bg-white text-gray-800'
                    }`}>
                    <div className="font-black text-lg tracking-tight">
                        {quiz?.title || 'Quiz in Progress'}
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-xs uppercase font-bold tracking-widest opacity-80">Time Remaining</div>
                        <div className={`text-2xl font-mono font-black ${timeLeft < 60 ? 'text-white animate-pulse' : 'text-blue-600'
                            }`}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>
            )}

            {/* 1-Minute Warning Popup (Non-intrusive) */}
            {showTimeWarning && (
                <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
                    <div className="bg-orange-500 text-white px-8 py-4 rounded-full shadow-2xl flex items-center space-x-4 border-4 border-white">
                        <div className="bg-white text-orange-500 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                            <i className="fas fa-exclamation"></i>
                        </div>
                        <span className="font-black text-lg tracking-wide">Hurry Up! Less than 1 minute remaining!</span>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto py-8 px-4 pt-24">
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="py-40 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm text-center">Preparing Your Quiz...</p>
                        </div>
                    ) : error ? (
                        <div className="py-40 flex flex-col items-center justify-center">
                            <p className="text-red-600 font-bold mb-4">{error}</p>
                            <button
                                onClick={() => navigate('/student/quizzes')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                            >
                                Back to Quizzes
                            </button>
                        </div>
                    ) : !quiz || !quiz.questions || quiz.questions.length === 0 ? (
                        <div className="py-40 flex flex-col items-center justify-center">
                            <p className="text-gray-400 font-bold mb-4">No questions available</p>
                            <button
                                onClick={() => navigate('/student/quizzes')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                            >
                                Back to Quizzes
                            </button>
                        </div>
                    ) : (
                        <div className="p-8 md:p-12">
                            {/* Question Card Content (matching Image 0) */}
                            <div className="space-y-8">
                                {/* Question Counter (Moved to top) */}
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-black text-gray-400 uppercase tracking-widest">
                                        Question {currentQuestionIndex + 1} <span className="text-gray-300">/</span> {quiz?.questions.length || 0}
                                    </span>
                                </div>

                                <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-snug">
                                    {currentQuestion?.text || 'Question'}
                                </h2>

                                {/* Options with Outlined Style */}
                                <div className="space-y-4">
                                    {(currentQuestion?.options || []).map((option, idx) => {
                                        const questionId = currentQuestion?.id?.toString() || `q${currentQuestionIndex}`;
                                        const isSelected = selectedAnswers[questionId] === option;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswerSelect(questionId, option)}
                                                className={`w-full p-5 text-left rounded-2xl border-2 transition-all flex items-center group font-bold ${isSelected
                                                    ? 'border-blue-600 bg-white'
                                                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 text-gray-700'
                                                    }`}
                                            >
                                                <div className={`w-6 h-6 rounded-full border-2 mr-6 flex items-center justify-center transition-all ${isSelected
                                                    ? 'border-blue-600 bg-blue-600'
                                                    : 'border-gray-200'
                                                    }`}>
                                                    {isSelected && (
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    )}
                                                </div>
                                                <span className={`text-lg ${isSelected ? 'text-blue-600' : ''}`}>
                                                    {option}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Mini Navigation (matching Image 0) */}
                                <div className="flex justify-between items-center py-6 border-t border-gray-100 mt-8">
                                    <button
                                        onClick={handlePrevious}
                                        disabled={currentQuestionIndex === 0}
                                        className="flex items-center px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-200"
                                    >
                                        <i className="fas fa-arrow-left mr-3"></i> Previous
                                    </button>

                                    <button
                                        onClick={handleNext}
                                        disabled={currentQuestionIndex === (quiz?.questions.length || 1) - 1}
                                        className="flex items-center px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-200"
                                    >
                                        Next <i className="fas fa-arrow-right ml-3"></i>
                                    </button>
                                </div>

                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={() => {
                                            const questionId = currentQuestion?.id?.toString() || `q${currentQuestionIndex}`;
                                            setSelectedAnswers(prev => {
                                                const newAnswers = { ...prev };
                                                delete newAnswers[questionId];
                                                return newAnswers;
                                            });
                                        }}
                                        className="text-gray-400 hover:text-red-500 text-sm font-bold transition flex items-center"
                                        disabled={!selectedAnswers[currentQuestion?.id?.toString() || `q${currentQuestionIndex}`]}
                                        style={{ visibility: selectedAnswers[currentQuestion?.id?.toString() || `q${currentQuestionIndex}`] ? 'visible' : 'hidden' }}
                                    >
                                        <i className="fas fa-times-circle mr-2"></i> Clear Selection
                                    </button>
                                </div>

                                {/* Main Action (matching Image 0) */}
                                <button
                                    onClick={confirmSubmit}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-6 rounded-2xl font-black text-xl shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8 ring-4 ring-blue-100"
                                    disabled={Object.keys(selectedAnswers).length === 0}
                                >
                                    Submit Quiz
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Confirmation Modal */}
                {showConfirmation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl transform transition-all scale-100 border border-gray-100">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg shadow-yellow-100">
                                    <i className="fas fa-question"></i>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Submit Assessment?</h3>
                                <p className="text-gray-500 font-medium">Are you sure you want to finish this quiz?</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                                    <div className="text-3xl font-black text-blue-600 mb-1">{Object.keys(selectedAnswers).length}</div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Answered</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                                    <div className="text-3xl font-black text-gray-400 mb-1">{(quiz?.questions.length || 0) - Object.keys(selectedAnswers).length}</div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Remaining</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleSubmitQuiz(true)}
                                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-200"
                                >
                                    Yes, Submit Everything
                                </button>
                                <button
                                    onClick={() => setShowConfirmation(false)}
                                    className="w-full py-4 bg-white text-gray-500 rounded-xl font-bold hover:bg-gray-50 transition border-2 border-gray-100"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Warning Modal (Strike 1) */}
                {showWarningModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-red-900/40 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl transform transition-all scale-100 border-4 border-red-100">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg shadow-red-100 animate-pulse">
                                    <i className="fas fa-exclamation-triangle"></i>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Warning!</h3>
                                <p className="text-gray-500 font-medium">
                                    You have deviated from the quiz window. This is your <span className="text-red-600 font-bold">final warning</span>.
                                    <br />
                                    Next time, your test will be <span className="font-bold text-gray-900">auto-submitted</span>.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setShowWarningModal(false);
                                    // Re-enter full screen if possible
                                    if (document.documentElement.requestFullscreen) {
                                        document.documentElement.requestFullscreen().catch(() => { });
                                    }
                                }}
                                className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-lg hover:bg-red-700 transition shadow-xl shadow-red-200"
                            >
                                OK, I Understand
                            </button>
                        </div>
                    </div>
                )}

                {/* Violation Modal (Strike 2 - Auto Submit) */}
                {showViolationModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-red-900/60 backdrop-blur-md animate-fadeIn">
                        <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl transform transition-all scale-100 border-4 border-red-500">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg shadow-red-200 animate-bounce">
                                    <i className="fas fa-ban"></i>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Quiz Terminated</h3>
                                <p className="text-gray-500 font-medium">
                                    Multiple violations detected. Your quiz has been <span className="text-red-600 font-bold">automatically submitted</span>.
                                </p>
                            </div>

                            <button
                                onClick={() => navigate('/student/dashboard')}
                                className="w-full py-4 bg-gray-900 text-white rounded-xl font-black text-lg hover:bg-gray-800 transition shadow-xl shadow-gray-200"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                )}
                {/* Success Modal (Normal Submission) */}
                {showSuccessModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-green-900/40 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl transform transition-all scale-100 border-4 border-green-100">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg shadow-green-100 animate-bounce">
                                    <i className="fas fa-check-circle"></i>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Submission Successful!</h3>
                                <p className="text-gray-500 font-medium">
                                    Your test has been submitted successfully.
                                    <br />
                                    You can now view your results in the dashboard.
                                </p>
                            </div>

                            <button
                                onClick={() => navigate('/student/dashboard')}
                                className="w-full py-4 bg-green-600 text-white rounded-xl font-black text-lg hover:bg-green-700 transition shadow-xl shadow-green-200"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default QuizInterface;
