import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StudentProfile: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<any>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const profile = await apiService.getStudentProfile();
                setProfileData(profile);
            } catch (err) {
                console.error('Error loading profile data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

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
            <div className="max-w-4xl mx-auto space-y-10 md:space-y-14 animate-fade-in pb-10">
                {/* Header/Identity Card */}
                <div className="w-full bg-white rounded-[3rem] p-8 md:p-14 relative overflow-hidden group border border-slate-100 shadow-sm">
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-pastel-blue opacity-40 rounded-full"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="relative">
                            <div className="w-28 h-28 md:w-40 md:h-40 rounded-[2.5rem] md:rounded-[3rem] bg-pastel-blue flex items-center justify-center text-5xl md:text-6xl font-extrabold text-blue-900 shadow-sm border border-white">
                                {user?.name?.charAt(0) || 'S'}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center text-sm shadow-md border-4 border-pastel-blue">
                                <i className="fas fa-check-circle"></i>
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div className="space-y-1">
                                <span className="text-blue-900 text-[10px] font-bold uppercase tracking-widest leading-none">Official Profile</span>
                                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none text-slate-900 uppercase">{user?.name}</h2>
                                <p className="text-slate-700 font-semibold text-base mt-1">{user?.email}</p>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                {user?.department && (
                                    <span className="px-5 py-2 bg-pastel-blue text-blue-900 text-[10px] font-bold uppercase tracking-widest rounded-full border border-white shadow-sm">
                                        {user.department}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/student/profile/edit')}
                            className="elite-button !rounded-[1.5rem] !py-4 shadow-xl shadow-slate-100 bg-blue-600"
                        >
                            <i className="fas fa-pen-nib text-[10px]"></i>
                            <span>Edit Profile</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Information Clusters */}
                    <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-sm space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-pastel-mint rounded-2xl flex items-center justify-center text-teal-900 border border-white shadow-sm">
                                <i className="fas fa-fingerprint text-xl"></i>
                            </div>
                            <h3 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">Personal Data</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            {[
                                { label: 'First Name', val: profileData?.firstName || user?.firstName || user?.name?.split(' ')[0] || 'N/A' },
                                { label: 'Last Name', val: profileData?.lastName || user?.lastName || user?.name?.split(' ').slice(1).join(' ') || 'N/A' },
                                { label: 'Phone Number', val: profileData?.phone || user?.phone || 'UNSET' },
                            ].map((field, idx) => (
                                <div key={idx} className="border-b border-slate-100 pb-4">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 leading-none">{field.label}</p>
                                    <p className="text-lg font-bold text-slate-900 uppercase">{field.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-sm space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-pastel-lavender rounded-2xl flex items-center justify-center text-indigo-900 border border-white shadow-sm">
                                <i className="fas fa-university text-xl"></i>
                            </div>
                            <h3 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">Academic Status</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            {[
                                { label: 'Department', val: profileData?.department || user?.department || 'GENERAL' },
                                { label: 'Year', val: profileData?.yearOfStudy || user?.yearOfStudy || 'N/A' },
                                { label: 'Degree', val: profileData?.degree || user?.degree || 'NONE' },
                            ].map((field, idx) => (
                                <div key={idx} className="border-b border-slate-100 pb-4">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 leading-none">{field.label}</p>
                                    <p className="text-lg font-bold text-slate-900 uppercase">{field.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Career Projection Card */}
                <div className="w-full bg-pastel-orange rounded-[3rem] p-10 md:p-16 relative overflow-hidden border border-white shadow-sm">
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white opacity-20 rounded-full"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="text-center md:text-left space-y-4">
                            <span className="text-amber-900 text-[10px] font-bold uppercase tracking-widest leading-none">Intelligence Report</span>
                            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-none uppercase">Career Projection</h3>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <span className="bg-white px-6 py-2 rounded-full text-xs font-bold text-slate-900 border border-white/20 shadow-sm uppercase">
                                    {profileData?.careerProjection?.role || 'Full Stack Architect'}
                                </span>
                                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-widest">
                                    {profileData?.careerProjection?.confidence || 92}% Match
                                </span>
                            </div>
                        </div>

                        <div className="text-center md:text-right space-y-4">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">Expected Package</p>
                            <p className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-none tabular-nums">
                                {profileData?.careerProjection?.salaryRange || '₹8L – ₹14L'}
                            </p>
                            <button
                                onClick={() => navigate('/student/report')}
                                className="text-[10px] font-bold text-slate-900 transition-all uppercase tracking-widest flex items-center justify-center md:justify-end gap-3 mx-auto md:mr-0 group"
                            >
                                Detailed Analytics
                                <i className="fas fa-chevron-right text-[8px] group-hover:translate-x-1 transition-transform"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentProfile;
