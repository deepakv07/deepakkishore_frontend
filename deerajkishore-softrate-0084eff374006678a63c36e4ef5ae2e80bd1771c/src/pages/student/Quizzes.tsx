import React, { useEffect, useState } from 'react';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import type { Quiz } from '../../types';
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
            console.log('📚 Loading quizzes for student...');
            const response = await apiService.getStudentQuizzes();
            console.log('✅ Quizzes loaded:', response);
            console.log('📊 Quiz count:', Array.isArray(response) ? response.length : 0);

            // Ensure we have an array
            const quizzesArray = Array.isArray(response) ? response : [];
            setQuizzes(quizzesArray);

            if (quizzesArray.length === 0) {
                console.warn('⚠️ No quizzes returned from API');
            }
        } catch (err: any) {
            console.error('❌ Error loading quizzes:', err);
            console.error('Error response:', err?.response);
            console.error('Error details:', err?.response?.data || err?.message);
            setQuizzes([]);
            // Show error message to user
            if (err?.response?.status === 401 || err?.response?.status === 403) {
                alert('Authentication error. Please log in again.');
            } else if (err?.response?.status === 500) {
                alert('Server error. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center py-40">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </StudentLayout>
        );
    }

    const filteredQuizzes = quizzes.filter((quiz) => {
        if (filter === 'completed') return quiz.isCompleted;
        if (filter === 'pending') return !quiz.isCompleted;
        return true; // 'all'
    });

    return (
        <StudentLayout>
            <div className="max-w-7xl mx-auto py-8 px-4">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Available Quizzes</h1>
                    <div className="relative">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="appearance-none bg-white border border-gray-100 px-6 py-3 pr-12 rounded-xl text-sm font-bold text-blue-600 shadow-sm focus:ring-2 focus:ring-blue-100 outline-none transition cursor-pointer"
                        >
                            <option value="all">All Quizzes</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                        </select>
                        <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-blue-600 pointer-events-none"></i>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-40">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : quizzes.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-lg mb-4">No quizzes available</p>
                        <p className="text-gray-300 text-sm">Check back later for new quizzes!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredQuizzes.map((quiz) => {
                            const now = new Date();
                            const scheduledAt = quiz.scheduledAt ? new Date(quiz.scheduledAt) : null;
                            const expiresAt = quiz.expiresAt ? new Date(quiz.expiresAt) : null;

                            const isUpcoming = scheduledAt && now < scheduledAt;
                            const isExpired = expiresAt && now > expiresAt;
                            const isActive = !isUpcoming && !isExpired;

                            // Format dates
                            const formatDate = (date: Date) => {
                                return new Intl.DateTimeFormat('en-US', {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                }).format(date);
                            };

                            return (
                                <div key={quiz.id} className="bg-white rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50 transition-all group relative">
                                    {/* Status Badge */}
                                    {isUpcoming && <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-700 font-bold px-3 py-1 rounded-full text-xs">Upcoming</div>}
                                    {isExpired && !quiz.isCompleted && <div className="absolute top-4 right-4 bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-xs">Expired</div>}

                                    {/* Card Header Area */}
                                    <div className={`h-48 transition-colors group-hover:opacity-80 ${isUpcoming ? 'bg-gray-100' :
                                        isExpired && !quiz.isCompleted ? 'bg-red-50' :
                                            'bg-gradient-to-br from-blue-100 to-indigo-100'
                                        }`}></div>

                                    <div className="p-8">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight">{quiz.title}</h3>
                                        <p className="text-sm text-gray-400 font-medium mb-2">{quiz.courseTitle || 'General Quiz'}</p>
                                        <p className="text-xs text-gray-300 mb-4 line-clamp-2">{quiz.description || 'Test your knowledge'}</p>

                                        {/* Schedule Info */}
                                        {(scheduledAt || expiresAt) && (
                                            <div className="mb-4 space-y-1">
                                                {scheduledAt && (
                                                    <p className="text-xs font-medium text-gray-500">
                                                        <span className="font-bold">Starts:</span> {formatDate(scheduledAt)}
                                                    </p>
                                                )}
                                                {expiresAt && (
                                                    <p className="text-xs font-medium text-gray-500">
                                                        <span className="font-bold">Ends:</span> {formatDate(expiresAt)}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-4 mb-8">
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm font-black text-blue-600">
                                                    {quiz.isCompleted ? `Score: ${quiz.score?.toFixed(0)}%` : 'Not Attempted'}
                                                </span>
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {quiz.totalQuestions} Questions
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-400">
                                                <span><i className="fas fa-clock mr-1"></i> {quiz.durationMinutes} mins</span>
                                                {quiz.isCompleted && (
                                                    <span className={quiz.passed ? 'text-green-600' : 'text-red-600'}>
                                                        {quiz.passed ? '✓ Passed' : '✗ Failed'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (quiz.isCompleted) {
                                                    navigate(`/quiz/${quiz.id}/results`);
                                                } else {
                                                    navigate(`/quiz/${quiz.id}/details`);
                                                }
                                            }}
                                            disabled={!quiz.isCompleted && (!isActive)}
                                            className={`w-full py-4 rounded-xl font-black tracking-widest uppercase transition-all flex items-center justify-center border-2 ${quiz.isCompleted
                                                ? 'border-green-600 text-green-600 bg-white hover:bg-green-50'
                                                : (!isActive)
                                                    ? 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed'
                                                    : 'border-blue-600 text-blue-600 bg-white hover:bg-blue-50'
                                                }`}
                                        >
                                            {quiz.isCompleted ? 'View Results' : isUpcoming ? 'Available Soon' : isExpired ? 'Expired' : 'Attempt Quiz'}
                                        </button>
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
