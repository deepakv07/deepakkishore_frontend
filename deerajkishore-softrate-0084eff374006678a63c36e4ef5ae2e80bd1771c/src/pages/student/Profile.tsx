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
            <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
                {/* Header/Identity Card */}
                <div className="glass-card p-10 relative overflow-hidden group">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#00E5FF11] rounded-full blur-3xl group-hover:bg-[#00E5FF22] transition-colors duration-700" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-[#00E5FF] to-[#0077FF] p-1 shadow-[0_0_30px_#00E5FF33]">
                                <div className="w-full h-full rounded-[2.3rem] bg-[#030508] flex items-center justify-center text-4xl font-black text-white group-hover:scale-95 transition-transform duration-500">
                                    {user?.name?.charAt(0) || 'S'}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#00E5FF] text-black flex items-center justify-center text-xs border-4 border-[#030508]">
                                <i className="fas fa-check"></i>
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <p className="text-[#00E5FF] text-[10px] font-black tracking-[0.4em] uppercase opacity-70 mb-1">Authenticated Entity</p>
                                <h2 className="text-4xl font-black tracking-tighter">{user?.name}</h2>
                                <p className="text-[#8E9AAF] font-bold text-lg">{user?.email}</p>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-3">

                                {user?.department && (
                                    <span className="px-4 py-1.5 bg-white/5 border border-white/10 text-[#8E9AAF] text-[10px] font-black uppercase tracking-widest rounded-full">
                                        {user.department}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/student/profile/edit')}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-2xl transition-all group flex items-center gap-3"
                        >
                            <i className="fas fa-pencil-alt text-[#00E5FF] text-xs"></i>
                            <span className="text-xs font-black tracking-widest uppercase">Modify Profile</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Information Clusters */}
                    <div className="glass-card p-8 space-y-8">
                        <div className="flex items-center gap-3">
                            <i className="fas fa-id-card text-[#00E5FF]"></i>
                            <h3 className="text-sm font-black tracking-[0.2em] uppercase">Identity Metadata</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {[
                                { label: 'First Name', val: profileData?.firstName || user?.firstName || user?.name?.split(' ')[0] || 'N/A' },
                                { label: 'Last Name', val: profileData?.lastName || user?.lastName || user?.name?.split(' ').slice(1).join(' ') || 'N/A' },
                                { label: 'Contact', val: profileData?.phone || user?.phone || 'UNREGISTERED' },
                            ].map((field, idx) => (
                                <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 group hover:border-[#00E5FF33] transition-colors">
                                    <p className="text-[8px] font-black text-[#8E9AAF] uppercase tracking-widest mb-1">{field.label}</p>
                                    <p className="font-black tracking-tight text-white">{field.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card p-8 space-y-8">
                        <div className="flex items-center gap-3">
                            <i className="fas fa-graduation-cap text-[#9D4EDD]"></i>
                            <h3 className="text-sm font-black tracking-[0.2em] uppercase">Academic Status</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {[
                                { label: 'Department', val: profileData?.department || user?.department || 'GENERAL' },
                                { label: 'Cycle of Study', val: profileData?.yearOfStudy || user?.yearOfStudy || 'N/A' },
                                { label: 'Accreditation', val: profileData?.degree || user?.degree || 'NONE' },
                            ].map((field, idx) => (
                                <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 group hover:border-[#9D4EDD33] transition-colors">
                                    <p className="text-[8px] font-black text-[#8E9AAF] uppercase tracking-widest mb-1">{field.label}</p>
                                    <p className="font-black tracking-tight text-white">{field.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Futurist Career Insights */}
                <div className="glass-card p-1 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00E5FF11] via-transparent to-[#9D4EDD11] opacity-50" />
                    <div className="relative z-10 p-10 bg-[#030508]/40 rounded-[1.5rem] backdrop-blur-sm border border-white/5">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                            <div className="text-center md:text-left">
                                <p className="text-[#00E5FF] text-[8px] font-black tracking-[0.4em] uppercase mb-1">Predictive Intelligence</p>
                                <h3 className="text-3xl font-black tracking-tighter mb-4">Career Projection</h3>
                                <div className="inline-flex items-center gap-4 bg-white/5 px-6 py-3 rounded-full border border-white/10">
                                    <span className="text-xs font-black tracking-widest uppercase text-white/60">Primary Vector:</span>
                                    <span className="text-xs font-black tracking-widest uppercase text-[#00E5FF] neon-text-cyan">SOFTWARE DEVELOPER</span>
                                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                                    <span className="text-[10px] font-black text-[#8E9AAF]">85% CONFIDENCE</span>
                                </div>
                            </div>

                            <div className="text-center md:text-right">
                                <p className="text-[8px] font-black text-[#8E9AAF] tracking-[0.3em] uppercase mb-1">Projected Compensation</p>
                                <p className="text-4xl font-black tracking-tighter neon-text-cyan">
                                    ₹6.0 – ₹12.0 LPA
                                </p>
                                <button
                                    onClick={() => navigate('/student/report')}
                                    className="mt-6 text-[10px] font-black text-[#00E5FF] hover:underline tracking-widest uppercase group flex items-center justify-center md:justify-end gap-2"
                                >
                                    Access Full Diagnostic
                                    <i className="fas fa-arrow-right text-[8px] group-hover:translate-x-1 transition-transform"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentProfile;
