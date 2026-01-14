import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiService from '../../services/api';
import { Link } from 'react-router-dom';

const AdminCourses: React.FC = () => {
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const quizData = await apiService.getAdminQuizzes();
            setQuizzes(quizData);
        } catch (err) {
            console.error('Error fetching admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuiz = async (quizId: string | number) => {
        if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
            return;
        }

        try {
            await apiService.deleteQuiz(quizId);
            loadData(); // Refresh the list
        } catch (err) {
            console.error('Error deleting quiz:', err);
            alert('Failed to delete quiz.');
        }
    };

    return (
        <AdminLayout>
            <div className="animate-fade-in space-y-12 pb-20">
                {/* Strategic Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1 rounded-full bg-[#FFD70011] border border-[#FFD70033] text-[#FFD700] text-[10px] font-black uppercase tracking-[0.3em]">
                                COURSE MANAGEMENT
                            </span>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter leading-none">
                            Course <span className="text-[#FFD700]">Management</span>
                        </h1>
                        <p className="text-gray-500 mt-4 text-sm font-bold uppercase tracking-widest uppercase">Manage your courses and quizzes</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            to="/admin/courses/create"
                            className="px-8 py-4 bg-white text-[#030508] font-black rounded-2xl hover:bg-gray-200 transition-all duration-300 flex items-center shadow-2xl shadow-white/5 uppercase tracking-[0.2em] text-[10px]"
                        >
                            <i className="fas fa-plus mr-3 text-xs"></i> + Create New Quiz
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="py-40 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-[#FFD70033] border-t-[#FFD700] rounded-full animate-spin shadow-[0_0_20px_rgba(255,215,0,0.1)] mb-8"></div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] animate-pulse">Syncing Sector Data...</p>
                    </div>
                ) : quizzes.length === 0 ? (
                    <div className="glass-card rounded-[3rem] p-20 border border-white/5 border-dashed relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFD70003] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-white/2 rounded-[2rem] flex items-center justify-center mb-10 border border-white/5 text-gray-600 group-hover:text-[#FFD700] group-hover:border-[#FFD70022] transition-all duration-700 shadow-2xl">
                                <i className="fas fa-book-open text-4xl"></i>
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">No Quizzes Found</h3>
                            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs max-w-sm mb-12 leading-relaxed">
                                You haven't created any quizzes yet. Start by creating your first quiz to begin assessing students.
                            </p>

                            <Link
                                to="/admin/courses/create"
                                className="px-12 py-5 bg-[#FFD70011] text-[#FFD700] font-black rounded-2xl hover:bg-[#FFD70022] border border-[#FFD70033] transition-all uppercase tracking-[0.3em] text-[10px] shadow-2xl flex items-center gap-4"
                            >
                                <i className="fas fa-plus text-[8px]"></i>
                                Create Your First Quiz
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {quizzes.map((quiz) => (
                            <div key={quiz.id} className="glass-card p-10 border border-white/5 shadow-2xl relative overflow-hidden group hover:border-[#FFD70033] transition-all duration-500 flex flex-col h-full">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/2 rounded-bl-full -mr-16 -mt-16 group-hover:bg-[#FFD70008] transition-colors duration-500"></div>

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-8">
                                        <span className="px-3 py-1 rounded-lg bg-[#FFD70011] border border-[#FFD70033] text-[#FFD700] text-[8px] font-black uppercase tracking-[0.2em]">
                                            GENERAL COURSE
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:text-[#FFD700] hover:border-[#FFD70033] transition-all"
                                                title="Edit Quiz"
                                            >
                                                <i className="fas fa-pencil-alt text-xs"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteQuiz(quiz.id)}
                                                className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-500/33 transition-all"
                                                title="Delete Quiz"
                                            >
                                                <i className="fas fa-trash-alt text-xs"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-2 group-hover:text-[#FFD700] transition-colors line-clamp-2">
                                        {quiz.title}
                                    </h3>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-8 line-clamp-1">
                                        {quiz.courseTitle || 'Unassigned Course'}
                                    </p>

                                    <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-gray-500 border border-white/5">
                                                <i className="fas fa-question text-[8px]"></i>
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{quiz.totalQuestions || 0} Questions</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-gray-500 border border-white/5">
                                                <i className="fas fa-clock text-[8px]"></i>
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{quiz.durationMinutes || 30} Minutes</span>
                                        </div>
                                    </div>
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
