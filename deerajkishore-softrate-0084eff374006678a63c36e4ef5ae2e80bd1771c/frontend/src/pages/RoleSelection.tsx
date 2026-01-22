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
                <div className="text-center mb-10 md:mb-16 space-y-4">
                    <h2 className="text-fluid-h1 font-black tracking-tight text-slate-900 leading-tight uppercase break-words">
                        Choose Your <br /><span className="text-slate-900/30">Access</span>
                    </h2>
                    <p className="text-slate-700 text-fluid-h4 font-extrabold uppercase tracking-tight break-words">Ready to continue your journey?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14">
                    {roles.map((role, idx) => (
                        <div
                            key={role.title}
                            onClick={() => navigate(role.path)}
                            className="glass-card group p-8 md:p-14 cursor-pointer text-left relative overflow-hidden border-white"
                        >
                            <div
                                className={`w-16 h-16 md:w-28 md:h-28 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center text-3xl md:text-6xl mb-8 md:mb-12 shadow-sm shrink-0 ${idx === 0 ? 'bg-pastel-blue' : 'bg-pastel-orange'
                                    }`}
                            >
                                <i className={role.icon}></i>
                            </div>

                            <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase break-words">
                                {role.title}
                            </h3>
                            <p className="text-slate-600 mb-8 md:mb-12 leading-relaxed text-sm md:text-base font-bold break-words">
                                {role.description}
                            </p>

                            <div className="elite-button !rounded-[1rem] md:!rounded-[1.5rem] !py-5 md:!py-6 shadow-xl transition-all active:scale-95">
                                <span>Go to {role.title}</span>
                                <i className="fas fa-chevron-right text-[10px] opacity-50 ml-2"></i>
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
