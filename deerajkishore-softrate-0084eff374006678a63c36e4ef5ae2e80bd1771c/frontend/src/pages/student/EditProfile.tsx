import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/layouts/StudentLayout';
import apiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const EditProfile: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        yearOfStudy: '',
        degree: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                department: user.department || '',
                yearOfStudy: user.yearOfStudy || '',
                degree: user.degree || '',
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleReset = () => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                department: user.department || '',
                yearOfStudy: user.yearOfStudy || '',
                degree: user.degree || '',
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiService.updateStudentProfile(formData);
            navigate('/student/profile');
            window.location.reload();
        } catch (err: any) {
            console.error('Error updating profile:', err);
            alert(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <StudentLayout>
            <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
                {/* Header Information */}
                <div className="glass-card p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-[#00E5FF11] border border-[#00E5FF33] flex items-center justify-center text-[#00E5FF]">
                            <i className="fas fa-id-card-clip text-3xl"></i>
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-2xl font-black tracking-tighter">{user?.name}</h1>
                            <p className="text-[#8E9AAF] text-xs font-bold tracking-widest uppercase mt-1">{user?.email}</p>
                        </div>
                    </div>


                </div>

                {/* Edit Profile Form */}
                <div className="glass-card overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
                            <i className="fas fa-edit text-[#00E5FF]"></i>
                            Edit Profile
                        </h2>
                        <button
                            onClick={() => navigate('/student/profile')}
                            className="text-[#8E9AAF] hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            {[
                                { name: 'firstName', label: 'FIRST NAME', placeholder: 'Enter first name' },
                                { name: 'lastName', label: 'LAST NAME', placeholder: 'Enter last name' },
                                { name: 'phone', label: 'PHONE NUMBER', placeholder: '+91 98765 43210' },
                                { name: 'department', label: 'DEPARTMENT', placeholder: 'e.g. Computer Science' },
                                { name: 'yearOfStudy', label: 'YEAR OF STUDY', placeholder: 'e.g. B.Tech CSE | 2024-2028' },
                                { name: 'degree', label: 'DEGREE', placeholder: 'e.g. B.Tech' },
                            ].map((field) => (
                                <div key={field.name} className="space-y-2 group">
                                    <label className="text-[10px] font-black text-[#8E9AAF] uppercase tracking-widest ml-1 transition-colors group-focus-within:text-[#00E5FF]">
                                        {field.label}
                                    </label>
                                    <input
                                        type="text"
                                        name={field.name}
                                        value={(formData as any)[field.name]}
                                        onChange={handleChange}
                                        placeholder={field.placeholder}
                                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-[#00E5FF] focus:bg-[#00E5FF08] transition-all font-black text-sm tracking-tight placeholder:text-white/20"
                                    />
                                </div>
                            ))}

                            <div className="space-y-2 opacity-50">
                                <label className="text-[10px] font-black text-[#8E9AAF] uppercase tracking-widest ml-1">EMAIL ID</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none font-black text-sm tracking-tight text-[#8E9AAF] cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-black rounded-2xl transition-all text-xs uppercase tracking-widest border border-white/5"
                            >
                                RESET
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-10 py-4 bg-[#0066FF] hover:bg-[#0052cc] text-white font-black rounded-2xl transition-all text-xs uppercase tracking-widest shadow-lg shadow-[#0066FF22]"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : 'SAVE CHANGES'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </StudentLayout>
    );
};

export default EditProfile;
