import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelection: React.FC = () => {
    const navigate = useNavigate();

    React.useEffect(() => {
        document.body.classList.remove('light-theme');
    }, []);

    const roles = [
        {
            title: 'Student',
            description: 'Access courses, take quizzes, and track your learning progress.',
            icon: 'fas fa-user-graduate',
            color: '#9D4EDD',
            glow: 'rgba(157, 78, 221, 0.4)',
            path: '/student/login',
        },
        {
            title: 'Administrator',
            description: 'Manage courses, students, and view platform analytics.',
            icon: 'fas fa-user-shield',
            color: '#00E5FF',
            glow: 'rgba(0, 229, 255, 0.4)',
            path: '/admin/login',
        },
    ];

    return (
        <div className="min-h-screen bg-bg-main relative overflow-hidden flex items-center justify-center p-6">
            {/* Soft Pastel Accents */}
            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-pastel-lavender/40 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-pastel-mint/40 rounded-full blur-[120px]" />

            <div className="max-w-4xl w-full relative z-10 px-6 animate-fade-in">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-fluid-h2 font-extrabold tracking-tight text-slate-900 leading-tight">
                        Choose Your <br /><span className="text-slate-900/30">Access</span>
                    </h2>
                    <p className="text-slate-700 text-fluid-body font-semibold">Ready to continue your journey?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
                    {roles.map((role, idx) => (
                        <div
                            key={role.title}
                            onClick={() => navigate(role.path)}
                            className="glass-card group p-10 md:p-14 cursor-pointer text-left relative overflow-hidden border-white"
                        >
                            <div
                                className={`w-20 h-20 md:w-28 md:h-28 rounded-[2rem] flex items-center justify-center text-4xl md:text-6xl mb-10 shadow-sm ${idx === 0 ? 'bg-pastel-blue' : 'bg-pastel-orange'
                                    }`}
                            >
                                <i className={role.icon}></i>
                            </div>

                            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
                                {role.title}
                            </h3>
                            <p className="text-slate-600 mb-10 leading-relaxed text-base font-medium">
                                {role.description}
                            </p>

                            <div className="elite-button !rounded-[1.5rem] !py-6 shadow-xl">
                                <span>Go to {role.title}</span>
                                <i className="fas fa-chevron-right text-[10px] opacity-50"></i>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-slate-900/60 hover:text-slate-900 font-bold uppercase tracking-[0.4em] text-[10px] transition-all flex items-center justify-center gap-4 mx-auto group"
                    >
                        <i className="fas fa-arrow-left"></i> Back to start
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleSelection;
