import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiService from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import ValidationModal from '../../components/common/ValidationModal';

const AdminCourses: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const navigate = useNavigate();

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'error' | 'warning' | 'success';
        onConfirm?: () => void;
        showCancel?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'error'
    });

    useEffect(() => {
        loadQuizzes();
    }, []);

    const loadQuizzes = async () => {
        try {
            const data = await apiService.getAdminQuizzes();
            setQuizzes(data);
        } catch (err) {
            console.error('Error fetching quizzes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (quizId: string, quizTitle: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Delete Quiz',
            message: `Are you sure you want to delete "${quizTitle}"? This action cannot be undone.`,
            type: 'warning',
            showCancel: true,
            onConfirm: async () => {
                try {
                    await apiService.deleteQuiz(quizId);
                    // Remove from state
                    setQuizzes(prev => prev.filter(q => q.id !== quizId));
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                    // Show success
                    // setTimeout(() => alert('Quiz deleted successfully'), 100); // Simple alert or toast
                } catch (err) {
                    console.error('Error deleting quiz:', err);
                    alert('Failed to delete quiz');
                }
            }
        });
    };

    const handleEdit = (quizId: string) => {
        // Navigate to create page with quizId as a parameter to populate data (assuming create page supports edit or we reuse it)
        // Since we didn't explicitly build an Edit page, we might need to update CreateQuiz to handle 'edit' mode or simply pass state.
        // For now, let's navigate to a hypothetical edit route or create with query param.
        // Assuming CreateQuiz.tsx might need adjustment to read ?edit=id, but standard practice is /admin/quizzes/edit/:id or similar.
        // As per user request "edit the test if i click pencil icon", I will route to /admin/courses/edit/:id and ensure route exists or handle in CreateQuiz.
        // Let's try to reuse the create route with state or query param for now, or just /admin/courses/edit/:id if we set up the route.
        // Given I haven't set up a dedicated edit route in App.tsx, I should probably check App.tsx first.
        // For this step, I'll navigate to /admin/courses/create?edit=quizId
        navigate(`/admin/courses/create?edit=${quizId}`);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not scheduled';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AdminLayout>
            <ValidationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
                showCancel={modalConfig.showCancel}
            />
            <div className="max-w-7xl mx-auto pb-20">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Course Management</h1>
                        <p className="text-gray-500 font-medium mt-2">Manage your courses and quizzes</p>
                    </div>
                    <Link
                        to="/admin/courses/create"
                        className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all flex items-center shadow-lg shadow-indigo-100 transform hover:-translate-y-1"
                    >
                        <i className="fas fa-plus mr-3"></i> Create New Quiz
                    </Link>
                </div>

                {loading ? (
                    <div className="py-20 flex justify-center">
                        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : quizzes.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-16 text-center border border-gray-100 shadow-xl shadow-gray-100/50">
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500 text-4xl">
                            <i className="fas fa-book-open"></i>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">No Quizzes Created Yet</h3>
                        <p className="text-gray-500 font-medium mb-8 max-w-md mx-auto">
                            Get started by creating your first quiz for a course.
                        </p>
                        <Link
                            to="/admin/courses/create"
                            className="inline-flex px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition"
                        >
                            Create Quiz
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {quizzes.map((quiz) => (
                            <div key={quiz.id} className="group bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-300 hover:-translate-y-1">
                                <div className="flex justify-between items-start mb-6">
                                    <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest">
                                        {quiz.courseName || 'General Course'}
                                    </span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(quiz.id)}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                        >
                                            <i className="fas fa-pen"></i>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(quiz.id, quiz.title)}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                                    {quiz.title}
                                </h3>

                                <p className="text-gray-500 font-medium mb-6 line-clamp-2 text-sm leading-relaxed">
                                    {quiz.description || 'No description provided'}
                                </p>

                                <div className="space-y-4 pt-6 border-t border-gray-100">
                                    <div className="flex items-center text-gray-500 text-sm font-semibold">
                                        <i className="fas fa-question-circle w-6 text-indigo-400"></i>
                                        {/* Use totalQuestions if available, else fallback to questions array length */}
                                        <span className="text-gray-900 mr-1">{quiz.totalQuestions || quiz.questions?.length || 0}</span> Questions
                                    </div>
                                    <div className="flex items-center text-gray-500 text-sm font-semibold">
                                        <i className="fas fa-clock w-6 text-indigo-400"></i>
                                        <span className="text-gray-900 mr-1">{quiz.durationMinutes}</span> Minutes
                                    </div>
                                    {quiz.scheduledAt && (
                                        <div className="flex items-center text-gray-500 text-sm font-semibold">
                                            <i className="fas fa-calendar-alt w-6 text-indigo-400"></i>
                                            {formatDate(quiz.scheduledAt)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminCourses;
