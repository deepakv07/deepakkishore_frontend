import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/common/LoadingScreen';

const Landing: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/role-selection');
        }, 2000);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-main relative px-6 py-20 overflow-hidden">
            <div className="text-center space-y-12 relative z-10 max-w-4xl w-full animate-fade-in">
                {/* Logo Box */}
                <div className="w-24 h-24 md:w-36 md:h-36 bg-white rounded-[2rem] md:rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl shadow-slate-200/50 mb-14 overflow-hidden p-3 border border-slate-50">
                    <img src="/logo.png?v=2" className="w-full h-full object-contain mix-blend-multiply" alt="Skill Builder Logo" />
                </div>

                {/* Typography Block */}
                <div className="space-y-4">
                    <h1 className="flex flex-col items-center leading-none tracking-tighter">
                        <span className="text-5xl md:text-8xl font-black text-[#141619] uppercase tracking-tighter">Skill</span>
                        <span className="text-5xl md:text-8xl font-black text-slate-300 uppercase tracking-tighter">Builder</span>
                    </h1>
                </div>

                <p className="text-slate-500 text-sm md:text-base font-bold max-w-lg mx-auto leading-relaxed uppercase tracking-tight">
                    The next generation of assessment and learning.
                </p>

                {/* Loading Component */}
                <div className="pt-24 scale-125">
                    <LoadingScreen color="bg-slate-900" />
                </div>
            </div>

            {/* Subtle Corner Graphic */}
            <div className="absolute bottom-8 right-8 opacity-10">
                <i className="fas fa-sparkles text-2xl text-slate-400"></i>
            </div>
        </div>
    );
};

export default Landing;
