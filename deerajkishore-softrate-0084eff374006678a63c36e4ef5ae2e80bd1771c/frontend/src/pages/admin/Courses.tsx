import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiService from '../../services/api';
import { Link } from 'react-router-dom';

const AdminCourses: React.FC = () => {
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteQuizId, setDeleteQuizId] = useState<string | number | null>(null);

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

    const handleDeleteClick = (quizId: string | number) => {
        setDeleteQuizId(quizId);
    };

    const confirmDelete = async () => {
        if (!deleteQuizId) return;

        try {
            await apiService.deleteQuiz(deleteQuizId);
            setDeleteQuizId(null);
            loadData(); // Refresh the list
        } catch (err) {
            console.error('Error deleting quiz:', err);
            // Optional: You could add an error toast here if you have a toast system
            alert('Failed to delete quiz.');
        }
    };

    return (
        <AdminLayout>
            <div className="animate-fade-in space-y-12 md:space-y-16 pb-20">
                {/* Strategic Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-5 py-1.5 rounded-full bg-pastel-orange text-amber-900 text-[10px] font-black uppercase tracking-[0.4em] border border-white italic">
                                Educational Assets
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] italic">
                            Module <br /><span className="text-amber-600/40">Architecture</span>
                        </h1>
                        <p className="text-slate-700 text-lg font-bold italic">Design and manage assessment frameworks</p>
                    </div>

                    <div className="w-full md:w-auto">
                        <Link
                            to="/create-quiz"
                            className="elite-button !rounded-[2rem] !py-6 !px-10 shadow-2xl shadow-amber-200/50 bg-amber-600"
                        >
                            <i className="fas fa-plus-circle text-xs"></i>
                            <span className="italic">Construct Module</span>
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="py-40 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 border-4 border-pastel-orange border-t-amber-500 rounded-full animate-spin mb-10"></div>
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] animate-pulse italic">Synchronizing Repositories...</p>
                    </div>
                ) : quizzes.length === 0 ? (
                    <div className="bg-white rounded-[4rem] p-24 border border-slate-200 border-dashed relative overflow-hidden">
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-pastel-orange rounded-[2.5rem] flex items-center justify-center mb-10 border border-white text-amber-900 shadow-sm">
                                <i className="fas fa-folder-open text-3xl"></i>
                            </div>
                            <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter mb-4 uppercase">No Asset Records</h3>
                            <p className="text-slate-700 font-bold uppercase tracking-[0.2em] text-xs max-w-sm mb-14 leading-relaxed italic">
                                The module repository is currently vacant. Initiate a new assessment framework to begin.
                            </p>

                            <Link
                                to="/create-quiz"
                                className="elite-button !rounded-full !py-6 !px-14 bg-amber-600 shadow-2xl shadow-amber-200/50 italic"
                            >
                                <i className="fas fa-plus text-[10px]"></i>
                                Initialize First Module
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {quizzes.map((quiz) => (
                            <div key={quiz.id} className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col h-full">
                                <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-pastel-orange opacity-20 rounded-full"></div>

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-10">
                                        <span className="px-5 py-2 rounded-full bg-pastel-orange border border-white text-amber-900 text-[10px] font-black uppercase tracking-[0.2em] italic">
                                            COMPREHENSIVE
                                        </span>
                                        <div className="flex gap-3">
                                            <button
                                                className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm"
                                                title="Edit Entity"
                                            >
                                                <i className="fas fa-pen-nib text-sm"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(quiz.id)}
                                                className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm"
                                                title="Decommission Entity"
                                            >
                                                <i className="fas fa-trash-can text-sm"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic leading-tight uppercase mb-3 px-1 transition-colors line-clamp-2">
                                        {quiz.title}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] mb-12 px-1 italic">
                                        {quiz.courseTitle || 'Unmapped Module'}
                                    </p>

                                    <div className="mt-auto pt-10 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-pastel-blue text-blue-900 flex items-center justify-center border border-white shadow-sm">
                                                <i className="fas fa-file-invoice text-xs"></i>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] italic">{quiz.totalQuestions || 0} Entities</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-pastel-lavender text-indigo-900 flex items-center justify-center border border-white shadow-sm">
                                                <i className="fas fa-hourglass-half text-xs"></i>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] italic">{quiz.durationMinutes || 30} Cycles</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Confirm Deletion Hub */}
                {deleteQuizId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/10 backdrop-blur-xl">
                        <div className="bg-white max-w-lg w-full p-14 rounded-[4rem] border border-white shadow-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-[4rem]"></div>

                            <div className="relative z-10 text-center">
                                <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-red-100 shadow-sm">
                                    <i className="fas fa-triangle-exclamation text-4xl text-red-500"></i>
                                </div>

                                <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter mb-4 uppercase">Decommission Asset?</h3>
                                <p className="text-slate-700 text-sm font-bold uppercase tracking-widest mb-12 leading-relaxed italic">
                                    You are about to permanently purge this assessment module.<br />
                                    <span className="text-red-700 underline decoration-2 underline-offset-4">This operation is irreversible.</span>
                                </p>

                                <div className="flex gap-6">
                                    <button
                                        onClick={() => setDeleteQuizId(null)}
                                        className="flex-1 py-6 rounded-[2rem] bg-slate-50 border border-slate-200 text-slate-700 font-black uppercase tracking-[0.3em] text-[10px] shadow-sm italic"
                                    >
                                        Abandon
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 py-6 rounded-[2rem] bg-red-600 text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-red-500/30 italic"
                                    >
                                        Purge Record
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminCourses;
