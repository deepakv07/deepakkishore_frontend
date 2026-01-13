import React, { useState, useEffect, useRef } from 'react';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Quiz } from '../../types';

const QuizInterface: React.FC = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Core State
    const [quiz, setQuiz] = useState<Quiz | null>(null); // Stores quiz metadata (title etc)
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false); // New state for AI thinking
    const [error, setError] = useState('');

    // Interactive Session State
    const [aiSessionId, setAiSessionId] = useState<string | null>(null);
    const [currentQuestionData, setCurrentQuestionData] = useState<any>(null); // The current question object from AI
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState<string>('');
    const [feedback, setFeedback] = useState<any>(null); // Feedback from previous answer

    // Time tracking
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

    // Proctoring & Modals
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [showViolationModal, setShowViolationModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // AI Session Initialization
    useEffect(() => {
        if (location.state?.aiSession) {
            const session = location.state.aiSession;
            console.log("Initializing AI Interactive Session", session);

            setAiSessionId(session.session_id);
            setTotalQuestions(session.total_questions || 10);
            setCurrentQuestionIndex(session.current_index || 0);

            // Set Initial Question
            if (session.next_question) {
                setCurrentQuestionData(normalizeQuestion(session.next_question));
            }

            // Set Quiz Metadata
            setQuiz({
                id: session.quiz_id,
                title: session.quiz_title || "AI Assessment",
                description: "AI Generated Interactive Assessment",
                durationMinutes: 30,
                questions: [], // We don't have all questions yet
                isCompleted: false,
                courseId: 0
            } as Quiz);

            setLoading(false);
            setQuestionStartTime(Date.now());
        } else if (quizId) {
            // Fallback for non-AI / legacy (Redirect or Error for now to force AI flow)
            setError("Interactive AI Quiz session not found. Please start from the dashboard.");
            setLoading(false);
        }
    }, [quizId, location.state]);

    // Helper to normalize question structure from AI
    const normalizeQuestion = (q: any) => ({
        id: q.id || q._id || q.question_id,
        text: q.question_text || q.text,
        options: q.options || [],
        type: q.options && q.options.length > 0 ? 'mcq' : 'descriptive',
        points: 10,
        ...q
    });

    const handleAnswerChange = (val: string) => {
        setCurrentAnswer(val);
    };

    const handleSubmitAnswer = async () => {
        if (!aiSessionId || !currentQuestionData || !currentAnswer) return;

        try {
            setAnalyzing(true);
            const timeTaken = (Date.now() - questionStartTime) / 1000;

            const payload = {
                session_id: aiSessionId,
                question_id: currentQuestionData.id,
                user_answer: currentAnswer,
                time_taken: timeTaken
            };

            const response = await apiService.submitAIAnswer(payload);
            console.log("AI Response:", response);

            if (response.completed) {
                setShowSuccessModal(true);
                // navigate('/student/dashboard'); // Done via modal
            } else {
                // Next Question
                setFeedback(response.feedback);
                setCurrentQuestionData(normalizeQuestion(response.next_question));
                setCurrentQuestionIndex(response.current_index);
                setCurrentAnswer(''); // Reset answer
                setQuestionStartTime(Date.now());

                // Optional: Show feedback toast or transient state
            }

        } catch (err: any) {
            console.error("Error submitting answer:", err);
            setError(err.message || "Failed to submit answer.");
        } finally {
            setAnalyzing(false);
        }
    };

    // --- RENDER ---

    return (
        <StudentLayout hideNavbar={true}>
            <div className="max-w-4xl mx-auto py-8 px-4 pt-24">
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden min-h-[600px] relative">

                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Initializing Assessment...</p>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-8 text-center">
                            <div className="text-red-500 text-5xl mb-4"><i className="fas fa-exclamation-circle"></i></div>
                            <p className="text-gray-800 font-bold text-xl mb-4">{error}</p>
                            <button onClick={() => navigate('/student/dashboard')} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold">Return to Dashboard</button>
                        </div>
                    ) : analyzing ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-20">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <i className="fas fa-brain text-blue-600 text-3xl"></i>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">AI is analyzing...</h3>
                            <p className="text-gray-500 font-medium">Evaluating your response and selecting the next question.</p>
                        </div>
                    ) : (
                        <div className="p-8 md:p-12 flex flex-col h-full">

                            {/* Header */}
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h1 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-1">{quiz?.title}</h1>
                                    <div className="text-3xl font-black text-gray-900">Question {currentQuestionIndex + 1}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Progress</div>
                                    <div className="text-xl font-black text-gray-900">{currentQuestionIndex + 1} / {totalQuestions}</div>
                                </div>
                            </div>

                            {/* Question Text */}
                            <div className="mb-8 flex-grow">
                                <h2 className="text-2xl font-bold text-gray-800 leading-snug">
                                    {currentQuestionData?.text}
                                </h2>
                            </div>

                            {/* Answer Input */}
                            <div className="mb-8 space-y-4">
                                {currentQuestionData?.type === 'mcq' ? (
                                    <div className="grid gap-4">
                                        {currentQuestionData.options.map((opt: string, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswerChange(opt)}
                                                className={`w-full p-6 text-left rounded-2xl border-2 transition-all flex items-center group font-bold text-lg
                                                    ${currentAnswer === opt
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-lg shadow-blue-100'
                                                        : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-full border-2 mr-6 flex items-center justify-center transition-all shrink-0
                                                    ${currentAnswer === opt ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                                                    {currentAnswer === opt && <div className="w-3 h-3 bg-white rounded-full"></div>}
                                                </div>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <textarea
                                        className="w-full p-6 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-xl min-h-[200px] resize-none"
                                        placeholder="Type your detailed answer here..."
                                        value={currentAnswer}
                                        onChange={(e) => handleAnswerChange(e.target.value)}
                                        autoFocus
                                    />
                                )}
                            </div>

                            {/* Action Bar */}
                            <div className="pt-8 border-t border-gray-100">
                                <button
                                    onClick={handleSubmitAnswer}
                                    disabled={!currentAnswer || analyzing}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-6 rounded-2xl font-black text-xl shadow-xl shadow-blue-200 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                                >
                                    <span>{currentQuestionIndex === totalQuestions - 1 ? 'Finish Assessment' : 'Next Question'}</span>
                                    <i className="fas fa-arrow-right"></i>
                                </button>
                            </div>

                        </div>
                    )}
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-green-900/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl transform transition-all scale-100 border-4 border-green-100">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg shadow-green-100 animate-bounce">
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Assessment Completed!</h3>
                            <p className="text-gray-500 font-medium">
                                You have successfully completed the interactive assessment.
                                <br />
                                Your personalized AI report is ready.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/student/dashboard')}
                            className="w-full py-4 bg-green-600 text-white rounded-xl font-black text-lg hover:bg-green-700 transition shadow-xl shadow-green-200"
                        >
                            View Results
                        </button>
                    </div>
                </div>
            )}
        </StudentLayout>
    );
};

export default QuizInterface;
