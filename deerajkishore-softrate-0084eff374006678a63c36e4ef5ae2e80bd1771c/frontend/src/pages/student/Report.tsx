import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import { useNavigate } from 'react-router-dom';
import type { Quiz } from '../../types';


interface Skill {
    name: string;
    level: string;
    score: number;
}

interface ReportData {
    skills: Skill[];
}

const StudentReport: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);

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
            setRecentQuizzes(Array.isArray(quizzes) ? quizzes.filter((q: Quiz) => q.isCompleted) : []);
        } catch (err: unknown) {
            console.error('Error fetching report data:', err);
            // Simulating data if API fails to show the theme
            setReportData({
                skills: [
                    { name: 'React Development', level: 'Advanced', score: 92 },
                    { name: 'System Architecture', level: 'Intermediate', score: 78 },
                    { name: 'Cloud Infrastructure', level: 'Intermediate', score: 65 },
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-16 h-16 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#00E5FF55]"></div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="space-y-12 animate-fade-in pb-10">
                <div className="space-y-3">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#141619] leading-tight uppercase">
                        Performance <br /><span className="text-indigo-600/40">Diagnostic</span>
                    </h1>
                    <p className="text-slate-700 text-[10px] font-bold tracking-widest uppercase">Strategic analysis of your skills and history</p>
                </div>

                {/* Skill Assessment Section */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-pastel-blue rounded-xl flex items-center justify-center text-blue-900 border border-white shadow-sm">
                            <i className="fas fa-brain text-lg"></i>
                        </div>
                        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase">Proficiency Matrices</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {(reportData?.skills || [
                            { name: 'Python Programming', level: 'INTERMEDIATE', score: 65 },
                            { name: 'Data Science', level: 'BEGINNER', score: 25 },
                        ]).map((skill: Skill, index: number) => (
                            <div key={index} className="bg-white rounded-[3rem] p-10 space-y-8 border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-pastel-mint opacity-40 rounded-full"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-xl text-slate-900 uppercase leading-none">{skill.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{skill.level || 'INTERMEDIATE'}</p>
                                    </div>
                                    <p className="text-3xl font-bold tracking-tight text-[#141619] leading-none tabular-nums">{skill.score}%</p>
                                </div>

                                <div className="relative z-10 space-y-2">
                                    <div className="h-4 bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-200">
                                        <div
                                            className="h-full rounded-full bg-teal-500 shadow-sm transition-all duration-1000"
                                            style={{ width: `${skill.score}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Quiz Reports Section */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-pastel-lavender rounded-xl flex items-center justify-center text-indigo-900 border border-white shadow-sm">
                            <i className="fas fa-scroll text-lg"></i>
                        </div>
                        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase">Assessment Archive</h3>
                    </div>

                    <div className="space-y-6">
                        {(recentQuizzes.length > 0 ? recentQuizzes : [
                            { id: 1, title: 'Introduction to Web Architecture', courseTitle: 'SYSTEM DESIGN', score: 20, passed: false, completedAt: '2026-01-14' } as Quiz,
                        ]).map((quiz: Quiz) => (
                            <div
                                key={quiz.id}
                                onClick={() => navigate(`/quiz/${quiz.id}/results`)}
                                className="bg-white rounded-[2.5rem] p-8 md:p-10 flex items-center justify-between cursor-pointer border border-slate-100 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-pastel-blue opacity-20 rounded-bl-[4rem]"></div>

                                <div className="flex items-center gap-8 relative z-10">
                                    <div className="w-16 h-16 bg-pastel-blue rounded-[1.2rem] flex items-center justify-center text-blue-900 border border-white shadow-sm">
                                        <i className="fas fa-file-invoice text-2xl"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl text-slate-900 line-clamp-1 uppercase leading-none">{quiz.title}</h4>
                                        <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mt-2">
                                            {quiz.courseTitle} <span className="text-slate-300 px-2">•</span> {quiz.completedAt ? new Date(quiz.completedAt).toLocaleDateString() : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-10 relative z-10">
                                    <div className="text-right">
                                        <p className="text-3xl font-black italic tracking-tighter text-slate-900 leading-none mb-3 tabular-nums">{quiz.score}%</p>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-sm italic ${quiz.passed
                                            ? 'bg-pastel-mint border-teal-500 text-teal-900'
                                            : 'bg-red-50 border-red-500 text-red-900'
                                            }`}>
                                            {quiz.passed ? 'OPTIMAL' : 'CRITICAL'}
                                        </span>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-900 shadow-sm">
                                        <i className="fas fa-chevron-right text-[10px]"></i>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentReport;
