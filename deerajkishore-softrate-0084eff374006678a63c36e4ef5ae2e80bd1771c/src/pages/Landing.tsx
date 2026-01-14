import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-[#030508] relative overflow-hidden cursor-pointer"
            onClick={() => navigate('/role-selection')}
        >
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00E5FF]/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#9D4EDD]/10 rounded-full blur-[120px]" />

            <div className="text-center space-y-8 relative z-10">
                <div className="w-32 h-32 bg-gradient-to-br from-[#00E5FF] to-[#9D4EDD] rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(0,229,255,0.3)] mb-8 transform hover:rotate-6 transition-transform duration-500">
                    <span className="text-black text-6xl font-black italic tracking-tighter">SB</span>
                </div>

                <div className="space-y-2">
                    {/* <p className="text-[#00E5FF] font-bold tracking-[0.3em] text-xs uppercase opacity-70">Project Command Center</p> */}
                    <h1 className="text-7xl font-black tracking-tighter text-white">
                        Skill Builder
                    </h1>
                </div>

                <p className="text-[#8E9AAF] text-xl font-medium max-w-md mx-auto leading-relaxed">
                    Empowering your learning journey
                </p>

                <div className="pt-16">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-1 h-12 bg-gradient-to-b from-[#00E5FF] to-transparent rounded-full animate-bounce shadow-[0_0_10px_#00E5FF]" />
                        <p className="text-[#00E5FF] text-sm font-bold tracking-widest uppercase animate-pulse">Tap anywhere to begin</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Landing;
