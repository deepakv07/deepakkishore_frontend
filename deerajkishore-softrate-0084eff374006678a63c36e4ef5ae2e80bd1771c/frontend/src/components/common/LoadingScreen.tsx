import React from 'react';

const LoadingScreen: React.FC<{ color?: string }> = ({ color = 'bg-slate-900' }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="relative w-12 h-12">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className={`absolute left-[45%] top-0 w-[10%] h-[30%] ${color} rounded-full origin-[center_165%] animate-ios-spinner`}
                        style={{
                            transform: `rotate(${i * 30}deg)`,
                            animationDelay: `${-1.1 + (i * 0.1)}s`
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default LoadingScreen;
