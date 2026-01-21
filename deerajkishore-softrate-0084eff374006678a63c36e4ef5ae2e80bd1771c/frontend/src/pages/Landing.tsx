import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-bg-main relative overflow-hidden cursor-pointer"
            onClick={() => navigate('/role-selection')}
        >
            {/* Soft Pastel Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pastel-lavender/60 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pastel-mint/60 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-pastel-blue/30 rounded-full blur-[150px]" />

            <div className="text-center space-y-8 relative z-10 px-6 max-w-4xl animate-fade-in">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-slate-200/50 mb-10 active:scale-95">
                    <span className="text-slate-900 text-4xl md:text-5xl font-extrabold tracking-tighter">SB</span>
                </div>

                <div className="space-y-4">
                    <h1 className="text-fluid-h1 font-extrabold tracking-tighter text-slate-900 leading-[1.1]">
                        Skill<br /><span className="text-slate-900/30">Builder</span>
                    </h1>
                </div>

                <p className="text-slate-700 text-fluid-body font-semibold max-w-2xl mx-auto leading-relaxed">
                    The next generation of assessment and learning.
                </p>

                <div className="pt-20">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-1.5 h-16 bg-slate-900/20 rounded-full overflow-hidden">
                            <div className="w-full h-1/2 bg-slate-900 animate-bounce"></div>
                        </div>
                        <p className="text-slate-900 text-[10px] md:text-xs font-black tracking-[0.4em] uppercase animate-pulse">Tap anywhere</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Landing;
