import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import type { Quiz } from '../../types';
import { useAuth } from '../../context/AuthContext';

const QuizDetails: React.FC = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // Get user
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [startingQuiz, setStartingQuiz] = useState(false); // New state for start loading
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        if (quizId) {
            loadQuizDetails(quizId);
        }
    }, [quizId]);

    // ... existing loadQuizDetails ...

    const handleStartQuiz = async () => {
        if (!user || !quizId || !quiz) return;

        try {
            setStartingQuiz(true);

            // Call AI Service to start quiz
            console.log("Starting AI Quiz...");
            const sessionData = await apiService.startAIQuiz(
                user.id?.toString() || (user as any)._id?.toString() || 'unknown_user',
                quizId,
                quiz.title
            );

            console.log("AI Session Started:", sessionData);

            // Navigate with session data
            navigate(`/quiz/${quizId}`, { state: { aiSession: sessionData } });

        } catch (error) {
            console.error("Failed to start AI quiz:", error);
            alert("Failed to start AI quiz. Please try again. Ensure the AI Service is running.");
        } finally {
            setStartingQuiz(false);
        }
    };

    const loadQuizDetails = async (id: string) => {
        try {
            // Fetch both detailed quiz data and student's status for this quiz
            const [detailsData, quizzesList] = await Promise.all([
                apiService.getQuizQuestions(id),
                apiService.getStudentQuizzes()
            ]);

            // Find this quiz in the student's list to check completion status
            const quizStatus = quizzesList.find(q => String(q.id) === String(id) || String(q._id) === String(id));

            console.log('🔍 Quiz Status Check:', {
                quizId: id,
                foundInList: !!quizStatus,
                isCompleted: quizStatus?.isCompleted,
                matchedId: quizStatus?.id || quizStatus?._id
            });

            setQuiz({
                ...detailsData,
                isCompleted: quizStatus?.isCompleted,
                score: quizStatus?.score,
                passed: quizStatus?.passed
            });
        } catch (err) {
            console.error('Error loading quiz details:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <StudentLayout>
            <div className="max-w-5xl mx-auto py-12 px-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Loading assessment details...</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Header & Stats */}
                        <div className="text-center space-y-4">
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Assessment Details</h1>
                            <div className="text-7xl font-black text-gray-900 leading-none">
                                {quiz?.questions?.length || 0}
                            </div>
                            <p className="text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                                {quiz?.description || 'Test your knowledge and skills with this assessment.'}
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pb-12 border-b border-gray-100">
                                {[
                                    { label: 'Questions', val: quiz?.questions?.length?.toString() || '0', color: 'text-blue-600' },
                                    { label: 'Duration', val: quiz?.durationMinutes?.toString() || '30', suffix: 'mins', color: 'text-green-600' },
                                    { label: 'Total Points', val: quiz?.questions?.reduce((sum, q) => sum + (q.points || 0), 0).toString() || '0', color: 'text-purple-600' },
                                    { label: 'Type', val: 'Mixed', color: 'text-red-600' },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm">
                                        <div className={`text-4xl font-black ${stat.color} mb-1`}>{stat.val}</div>
                                        <div className="text-gray-400 font-bold text-xs uppercase tracking-widest">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase tracking-[0.2em] text-center">Structure Breakdown</h2>
                            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-100/50 space-y-4">
                                {[
                                    { title: 'Multiple Choice', desc: 'Standard MCQ questions', val: quiz?.questions?.filter(q => q.type === 'mcq').length.toString() || '0', icon: 'fa-list-ul', color: 'bg-blue-50 text-blue-500' },
                                    { title: 'Points Per Question', desc: 'Average points', val: Math.round((quiz?.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0) / (quiz?.questions?.length || 1)).toString() || '0', icon: 'fa-brain', color: 'bg-green-50 text-green-500' },
                                    { title: 'Total Duration', desc: 'In minutes', val: quiz?.durationMinutes?.toString() || '30', icon: 'fa-clock', color: 'bg-purple-50 text-purple-500' },
                                    { title: 'Total Possible Score', desc: 'Sum of all sections', val: quiz?.questions?.reduce((sum, q) => sum + (q.points || 0), 0).toString() || '0', icon: 'fa-trophy', color: 'bg-indigo-50 text-indigo-500', isTotal: true },
                                ].map((item, i) => (
                                    <div key={i} className={`flex items-center justify-between p-6 rounded-2xl ${item.isTotal ? 'bg-blue-50/50 border border-blue-100' : 'border border-gray-50'}`}>
                                        <div className="flex items-center space-x-6">
                                            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-xl`}>
                                                <i className={`fas ${item.icon}`}></i>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900">{item.title}</h3>
                                                <p className="text-sm font-medium text-gray-500">{item.desc}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-black text-gray-900">{item.val}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.title === 'Total Duration' ? 'Mins' : 'Marks/Qty'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Time Limit Alert */}
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-xl shadow-lg shadow-orange-100/50 flex items-start space-x-6">
                            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xl shrink-0">
                                <i className="fas fa-hourglass-half animate-pulse"></i>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">Strict Time Limit</h3>
                                <p className="text-gray-600 font-medium leading-relaxed">
                                    You have exactly <span className="text-orange-600 font-black">{quiz?.durationMinutes} minutes</span> to complete this assessment.
                                    The timer will start the moment you click "Confirm & Start Quiz".
                                    <br /><br />
                                    <span className="font-bold text-gray-800">Note:</span> The quiz will <span className="underline decoration-orange-400 decoration-2">automatically submit</span> when the timer reaches the end. Please ensure you submit your answers before time runs out.
                                </p>
                            </div>
                        </div>

                        {/* Guidelines */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase tracking-[0.2em] text-center">Guidelines</h2>
                            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-100/50 space-y-4">
                                {[
                                    { title: 'Proctoring Rules', text: 'Screen sharing is strictly prohibited. The test will auto-submit after 3 warnings.', icon: 'fa-video-slash', color: 'bg-red-50 text-red-600', borderColor: 'border-red-100' },
                                    { title: 'Important Notice', text: "There's no internet restriction. Refreshing the page may cause data loss.", icon: 'fa-exclamation-triangle', color: 'bg-blue-50 text-blue-600', borderColor: 'border-blue-100' },
                                    { title: 'Time Management', text: 'Timer starts immediately after confirmation. Use your time wisely across sections.', icon: 'fa-clock', color: 'bg-green-50 text-green-600', borderColor: 'border-green-100' },
                                ].map((rule, i) => (
                                    <div key={i} className={`flex items-start p-6 rounded-2xl ${rule.borderColor} border`}>
                                        <div className={`w-10 h-10 ${rule.color} rounded-xl flex items-center justify-center mr-6 shrink-0`}>
                                            <i className={`fas ${rule.icon} text-sm`}></i>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">{rule.title}</h3>
                                            <p className="text-sm text-gray-500 font-medium leading-relaxed">{rule.text}</p>
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-6">
                                    <label className="flex items-start space-x-4 cursor-pointer group">
                                        <div className="relative mt-1">
                                            <input
                                                type="checkbox"
                                                className="peer hidden"
                                                checked={agreed}
                                                onChange={() => setAgreed(!agreed)}
                                            />
                                            <div className="w-6 h-6 border-2 border-gray-200 rounded-lg peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                                                <i className="fas fa-check text-white text-[10px] opacity-0 peer-checked:opacity-100"></i>
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-500 font-medium leading-relaxed">
                                            I have read and understood all the guidelines. I confirm that I will adhere to the assessment rules and complete the quiz without any malpractice.
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-12">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-full md:w-auto px-12 py-5 bg-white text-gray-500 font-black tracking-widest uppercase rounded-2xl border-2 border-gray-100 hover:bg-gray-50 transition"
                            >
                                <i className="fas fa-times mr-3"></i> Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (quiz?.isCompleted) {
                                        navigate('/student/quizzes');
                                        return;
                                    }
                                    if (agreed && quizId) {
                                        handleStartQuiz();
                                    }
                                }}
                                disabled={(!agreed && !quiz?.isCompleted) || loading || startingQuiz}
                                className={`w-full md:w-auto px-16 py-5 rounded-2xl font-black tracking-widest uppercase shadow-2xl transition flex items-center justify-center ${quiz?.isCompleted
                                    ? 'bg-green-600 text-white shadow-green-200 hover:scale-105 hover:bg-green-700'
                                    : agreed && !loading && !startingQuiz
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-200 hover:scale-105 active:scale-95'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                    }`}
                            >
                                {quiz?.isCompleted ? (
                                    <>
                                        <i className="fas fa-check-circle mr-3"></i> Completed
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-play-circle mr-3"></i> {loading || startingQuiz ? 'Starting AI...' : 'Confirm & Start Quiz'}
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
