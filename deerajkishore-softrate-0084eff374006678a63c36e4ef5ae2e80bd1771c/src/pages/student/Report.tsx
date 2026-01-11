import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import { useNavigate } from 'react-router-dom';

const StudentReport: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<any>(null);
    const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [report, quizzes] = await Promise.all([
                apiService.getStudentReport(),
                apiService.getStudentQuizzes()
            ]);
            setReportData(report);
            setRecentQuizzes(Array.isArray(quizzes) ? quizzes.filter((q: any) => q.isCompleted) : []);
        } catch (err: any) {
            console.error('Error fetching report data:', err);
            // alert('Failed to load report data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="max-w-7xl mx-auto py-8 px-4">
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                        Your Performance <span className="text-blue-600">Overview</span>
                    </h1>
                    <p className="text-gray-500 font-medium mt-2">Comprehensive analysis of your skills and quiz history</p>
                </div>

                <div className="space-y-10">
                    {/* Skills Summary */}
                    <div className="space-y-10">
                        <section className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl shadow-gray-100/50">
                            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xs">
                                    <i className="fas fa-brain"></i>
                                </div>
                                Skill Assessment
                            </h3>

                            {reportData?.skills && reportData.skills.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {reportData.skills.map((skill: any, index: number) => (
                                        <div key={index} className="p-6 bg-gray-50/50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-white transition-all group">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-gray-800">{skill.name}</h4>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${skill.level === 'Advanced' ? 'bg-green-100 text-green-600' :
                                                    skill.level === 'Intermediate' ? 'bg-blue-100 text-blue-600' :
                                                        'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {skill.level}
                                                </span>
                                            </div>
                                            <div className="flex items-end gap-4">
                                                <div className="flex-1">
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                                                            style={{ width: `${skill.score}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <span className="text-xl font-black text-blue-600 leading-none">{skill.score}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-400">
                                    <p>Complete a quiz to see your skill assessment.</p>
                                </div>
                            )}
                        </section>

                        {/* Recent Reports List */}
                        <section className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl shadow-gray-100/50">
                            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xs">
                                    <i className="fas fa-file-contract"></i>
                                </div>
                                Recent Quiz Reports
                            </h3>

                            {recentQuizzes.length > 0 ? (
                                <div className="space-y-4">
                                    {recentQuizzes.map((quiz: any) => (
                                        <div
                                            key={quiz.id}
                                            onClick={() => navigate(`/quiz/${quiz.id}/results`)}
                                            className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-3xl hover:border-blue-600 hover:shadow-lg hover:shadow-blue-50 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-lg font-black group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <i className="fas fa-clipboard-check"></i>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{quiz.title}</h4>
                                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                                        {quiz.courseTitle || 'General Quiz'} • {new Date(quiz.completedAt || Date.now()).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-blue-600 leading-none">{quiz.score?.toFixed(0)}%</p>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${quiz.passed ? 'text-green-500' : 'text-red-500'}`}>
                                                        {quiz.passed ? 'Passed' : 'Failed'}
                                                    </p>
                                                </div>
                                                <div className="w-10 h-10 border border-gray-100 rounded-full flex items-center justify-center text-gray-300 group-hover:text-blue-600 group-hover:border-blue-100 transition-all">
                                                    <i className="fas fa-chevron-right text-xs"></i>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                                    <i className="fas fa-history text-3xl mb-4 opacity-20"></i>
                                    <p className="font-medium">You haven't completed any quizzes yet.</p>
                                    <button
                                        onClick={() => navigate('/student/quizzes')}
                                        className="mt-4 text-blue-600 font-bold hover:underline"
                                    >
                                        Take your first quiz
                                    </button>
                                </div>
                            )}
                        </section>
                    </div>


                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentReport;
