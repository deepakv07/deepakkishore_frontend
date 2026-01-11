import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { StudentDashboardData } from '../../types';

const StudentProfile: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await apiService.getStudentDashboard();
                setDashboardData(data);
            } catch (err) {
                console.error('Error loading profile data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    return (
        <StudentLayout>
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100/50 p-10 max-w-4xl mx-auto border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Your Profile</h2>
                    <button
                        onClick={() => navigate('/student/profile/edit')}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-sm font-black uppercase tracking-widest"
                    >
                        <i className="fas fa-user-edit mr-2"></i>
                        Edit Profile
                    </button>
                </div>
                {loading ? (
                    <div className="py-20 flex justify-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* User Info */}
                        <div className="flex items-center space-x-8 pb-10 border-b border-gray-100">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-lg shadow-blue-200 transform rotate-3">
                                {user?.name?.charAt(0) || 'S'}
                            </div>
                            <div>
                                <div className="flex items-center space-x-4 mb-1">
                                    <h3 className="text-3xl font-black text-gray-900">{user?.name}</h3>
                                </div>
                                <p className="text-gray-500 font-medium text-lg">{user?.email}</p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <span className="px-4 py-1.5 bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-widest rounded-xl">
                                        Student Account
                                    </span>
                                    {user?.department && (
                                        <span className="px-4 py-1.5 bg-gray-50 text-gray-600 text-xs font-black uppercase tracking-widest rounded-xl">
                                            {user.department}
                                        </span>
                                    )}
                                    {user?.degree && (
                                        <span className="px-4 py-1.5 bg-gray-50 text-gray-600 text-xs font-black uppercase tracking-widest rounded-xl">
                                            {user.degree}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Profile Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-12 border-b border-gray-100">
                            <div className="space-y-8">
                                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-6 flex items-center">
                                    <i className="fas fa-user-circle mr-2"></i>
                                    Personal Information
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex flex-col space-y-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">First Name</span>
                                        <span className="text-lg font-bold text-gray-900">{user?.firstName || user?.name?.split(' ')[0] || '—'}</span>
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Last Name</span>
                                        <span className="text-lg font-bold text-gray-900">{user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '—'}</span>
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Phone Number</span>
                                        <span className="text-lg font-bold text-gray-900">{user?.phone || '—'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-8">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center">
                                    <i className="fas fa-graduation-cap mr-2"></i>
                                    Academic Highlights
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex flex-col space-y-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Department</span>
                                        <span className="text-lg font-bold text-gray-900">{user?.department || '—'}</span>
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Year of Study</span>
                                        <span className="text-lg font-bold text-gray-900">{user?.yearOfStudy || '—'}</span>
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Degree</span>
                                        <span className="text-lg font-bold text-gray-900">{user?.degree || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Job Prediction Card */}
                        <div>
                            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center">
                                <i className="fas fa-sparkles text-blue-600 mr-3"></i>
                                Career Insights
                            </h3>
                            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-6">
                                    <i className="fas fa-rocket text-6xl"></i>
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-1 opacity-80">AI Job Prediction</h3>
                                    <p className="text-blue-200 text-xs font-bold mb-8">
                                        {dashboardData?.aiJobPrediction?.role || 'Analyzing...'} ({dashboardData?.aiJobPrediction?.confidence || 85}%)
                                        <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block animate-pulse"></span>
                                    </p>

                                    <div className="text-5xl font-black mb-10 tracking-tight">
                                        {dashboardData?.aiJobPrediction?.salaryRange
                                            ? `₹${dashboardData.aiJobPrediction.salaryRange.min} – ₹${dashboardData.aiJobPrediction.salaryRange.max} LPA`
                                            : '₹6.5 – ₹9.0 LPA'}
                                    </div>

                                    <button
                                        onClick={() => navigate('/student/report')}
                                        className="w-full bg-white text-blue-800 font-black py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-blue-900/50 uppercase tracking-widest text-sm"
                                    >
                                        View Detailed Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentProfile;
