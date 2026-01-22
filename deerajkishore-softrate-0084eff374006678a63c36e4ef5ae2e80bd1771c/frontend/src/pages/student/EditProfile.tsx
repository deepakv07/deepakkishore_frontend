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
            <div className="max-w-4xl mx-auto space-y-10 md:space-y-14 animate-fade-in pb-10">
                {/* Header Information */}
                <div className="bg-white rounded-[1.5rem] md:rounded-[3rem] p-8 md:p-14 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-10 border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-[-20%] right-[-10%] w-48 h-48 md:w-64 md:h-64 bg-pastel-blue opacity-40 rounded-full"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2.5rem] bg-pastel-blue flex items-center justify-center text-blue-900 border border-white shadow-sm shrink-0">
                            <i className="fas fa-user-edit text-2xl md:text-3xl"></i>
                        </div>
                        <div className="text-center md:text-left min-w-0">
                            <h1 className="text-fluid-h2 font-extrabold tracking-tight text-slate-900 leading-tight uppercase break-words">{user?.name}</h1>
                            <p className="text-slate-700 text-[10px] font-bold tracking-widest uppercase mt-2 break-words">Identity Management</p>
                        </div>
                    </div>
                </div>

                {/* Edit Profile Form */}
                <div className="bg-white rounded-[1.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3 md:gap-4 uppercase">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-pastel-mint rounded-full flex items-center justify-center text-teal-900 border border-white shadow-sm shrink-0">
                                <i className="fas fa-edit text-xs md:text-sm"></i>
                            </div>
                            Update Information
                        </h2>
                        <button
                            onClick={() => navigate('/student/profile')}
                            className="text-slate-700 transition-all text-[9px] md:text-[10px] font-bold uppercase tracking-widest"
                        >
                            Abandon
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 md:p-14 space-y-10 md:space-y-14">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-8 md:gap-y-10">
                            {[
                                { name: 'firstName', label: 'FIRST NAME', placeholder: 'Enter first name' },
                                { name: 'lastName', label: 'LAST NAME', placeholder: 'Enter last name' },
                                { name: 'phone', label: 'PHONE NUMBER', placeholder: '+91 98765 43210' },
                                { name: 'department', label: 'DEPARTMENT', placeholder: 'e.g. Computer Science' },
                                { name: 'yearOfStudy', label: 'YEAR OF STUDY', placeholder: 'e.g. B.Tech | 4th Year' },
                                { name: 'degree', label: 'DEGREE', placeholder: 'e.g. B.Tech' },
                            ].map((field) => (
                                <div key={field.name} className="space-y-2 md:space-y-3">
                                    <label className="text-[9px] md:text-[10px] font-bold text-slate-700 uppercase tracking-widest ml-2 leading-none">
                                        {field.label}
                                    </label>
                                    <input
                                        type="text"
                                        name={field.name}
                                        value={(formData as any)[field.name]}
                                        onChange={handleChange}
                                        placeholder={field.placeholder}
                                        className="elite-input border border-slate-200"
                                    />
                                </div>
                            ))}

                            <div className="space-y-2 md:space-y-3">
                                <label className="text-[9px] md:text-[10px] font-bold text-slate-700 uppercase tracking-widest ml-2 leading-none">Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="elite-input cursor-not-allowed bg-slate-100 border border-slate-200 text-slate-900 font-bold"
                                />
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-2">Official identifier cannot be modified</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-end gap-4 md:gap-6 pt-10 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-10 md:px-12 py-4 text-slate-700 font-bold text-[9px] md:text-[10px] uppercase tracking-widest"
                            >
                                Reset Form
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="elite-button !rounded-[1rem] md:!rounded-[1.5rem] !px-10 md:!px-12 shadow-xl shadow-slate-100 bg-blue-600"
                            >
                                {loading ? (
                                    <i className="fas fa-spinner fa-spin"></i>
                                ) : (
                                    <>
                                        <span>Commit Changes</span>
                                        <i className="fas fa-check-circle text-[10px] ml-2"></i>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </StudentLayout>
    );
};

export default EditProfile;
