import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelection: React.FC = () => {
    const navigate = useNavigate();

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
        <div className="min-h-screen bg-[#030508] relative overflow-hidden flex items-center justify-center p-6">
            {/* Background Glows */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#9D4EDD]/10 rounded-full blur-[150px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E5FF]/10 rounded-full blur-[150px]" />

            <div className="max-w-4xl w-full relative z-10">
                <div className="text-center mb-16 space-y-4">
                    {/* <p className="text-[#00E5FF] font-bold tracking-[0.4em] text-xs uppercase opacity-70">Security Protocol</p> */}
                    <h2 className="text-5xl font-black tracking-tighter text-white">Welcome to <span className="neon-text-cyan">Skill Builder</span></h2>
                    <p className="text-[#8E9AAF] text-lg">Please select your role to continue</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {roles.map((role) => (
                        <div
                            key={role.title}
                            onClick={() => navigate(role.path)}
                            className="glass-card glass-card-hover group p-10 cursor-pointer text-left relative overflow-hidden"
                        >
                            {/* Card Accent Glow */}
                            <div
                                className="absolute -top-10 -right-10 w-32 h-32 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                                style={{ backgroundColor: role.color }}
                            />

                            <div
                                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl mb-8 border transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3"
                                style={{
                                    backgroundColor: `${role.color}11`,
                                    borderColor: `${role.color}33`,
                                    color: role.color,
                                    boxShadow: `0 0 20px ${role.color}11`
                                }}
                            >
                                <i className={role.icon}></i>
                            </div>

                            <h3 className="text-3xl font-black text-white mb-4 tracking-tight group-hover:text-white transition-colors">
                                {role.title}
                            </h3>
                            <p className="text-[#8E9AAF] mb-10 leading-relaxed text-lg group-hover:text-white/80 transition-colors">
                                {role.description}
                            </p>

                            <div
                                className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm border-2 text-center transition-all duration-300"
                                style={{
                                    borderColor: `${role.color}44`,
                                    color: role.color,
                                    backgroundColor: 'transparent'
                                }}
                            >
                                Select {role.title}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-[#8E9AAF] hover:text-[#00E5FF] font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 mx-auto group"
                    >
                        <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform duration-300"></i> Back to Landing
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleSelection;
