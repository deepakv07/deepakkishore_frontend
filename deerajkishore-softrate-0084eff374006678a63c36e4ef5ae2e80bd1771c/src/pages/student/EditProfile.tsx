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
            alert('Profile updated successfully');
            navigate('/student/profile');
            // If the auth context needs manual update:
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
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header Information */}
                <div className="bg-white rounded-[2rem] p-8 mb-6 shadow-sm border border-gray-100 flex justify-between items-start">
                    <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                            <i className="fas fa-user text-3xl"></i>
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h1 className="text-2xl font-black text-gray-900">{user?.name}</h1>
                                <i className="fas fa-pen text-xs text-gray-400"></i>
                            </div>
                            <p className="text-gray-500 font-medium">{user?.yearOfStudy || 'Year of Study'}</p>
                            <div className="flex items-center space-x-4 mt-2">
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider rounded-lg">Active</span>
                                <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider rounded-lg">5 Assessments</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex space-x-12">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Department:</p>
                            <p className="text-sm font-bold text-gray-900">{user?.department || 'Not Set'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Degree:</p>
                            <p className="text-sm font-bold text-gray-900">{user?.degree || 'Not Set'}</p>
                        </div>
                    </div>
                </div>

                {/* Edit Profile Form */}
                <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                        <h2 className="text-xl font-black text-gray-900 flex items-center">
                            <i className="fas fa-pen-nib text-indigo-600 mr-3"></i>
                            Edit Profile
                        </h2>
                        <button
                            onClick={() => navigate('/student/profile')}
                            className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                        >
                            Cancel
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                            {/* First Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-700"
                                    placeholder="Enter first name"
                                />
                            </div>

                            {/* Last Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 bg-white border-2 border-indigo-500 rounded-2xl transition-all outline-none font-bold text-gray-700"
                                    placeholder="Enter last name"
                                />
                            </div>

                            {/* Email ID */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email ID</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl transition-all outline-none font-bold text-gray-400 cursor-not-allowed"
                                />
                            </div>

                            {/* Department */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Department</label>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-700"
                                    placeholder="e.g. Computer Science"
                                />
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-700"
                                    placeholder="+91 98765 43210"
                                />
                            </div>

                            {/* Year of Study */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Year of Study</label>
                                <input
                                    type="text"
                                    name="yearOfStudy"
                                    value={formData.yearOfStudy}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-700"
                                    placeholder="e.g. B.Tech CSE | 2024-2028"
                                />
                            </div>

                            {/* Degree */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Degree</label>
                                <input
                                    type="text"
                                    name="degree"
                                    value={formData.degree}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-700"
                                    placeholder="e.g. B.Tech"
                                />
                            </div>

                        </div>

                        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-50">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-8 py-3 bg-gray-100 text-gray-600 font-black rounded-xl hover:bg-gray-200 transition-all text-xs uppercase tracking-widest"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 text-xs uppercase tracking-widest flex items-center"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                ) : null}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>

                {/* Bottom Navigation Tabs */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                    <button
                        onClick={() => navigate('/student/profile')}
                        className="p-6 bg-indigo-50 rounded-2xl border-2 border-indigo-100 flex flex-col items-center justify-center space-y-2 group"
                    >
                        <i className="fas fa-home text-indigo-600 text-xl group-hover:scale-110 transition-transform"></i>
                        <span className="text-xs font-black text-indigo-900 uppercase tracking-widest">Profile</span>
                    </button>
                    <button
                        onClick={() => navigate('/student/report')}
                        className="p-6 bg-white rounded-2xl border-2 border-transparent hover:border-gray-100 flex flex-col items-center justify-center space-y-2 group transition-all"
                    >
                        <i className="fas fa-file-download text-gray-400 text-xl group-hover:scale-110 transition-transform"></i>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Latest Report</span>
                    </button>
                </div>
            </div>
        </StudentLayout>
    );
};

export default EditProfile;
