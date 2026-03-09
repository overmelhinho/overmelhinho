'use client';

import React from 'react';

interface LogoProps {
    className?: string;
    showText?: boolean;
}

export default function Logo({ className = "", showText = true }: LogoProps) {
    return (
        <div className={`flex items-center space-x-3 group ${className}`}>
            {/* O Ícone do Logo - O "V" Estilizado */}
            <div className="relative">
                <div className="bg-brand-red w-10 h-10 md:w-11 md:h-11 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-red-100 rotate-3 group-hover:rotate-0 transition-all duration-500 overflow-hidden border-2 border-white">
                    <span className="text-white font-black text-xl md:text-2xl italic tracking-tighter select-none">V</span>
                    {/* Brilho decorativo */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                </div>
                {/* Pingo de notificação/foco no logo */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-red rounded-full border-2 border-white animate-pulse" />
            </div>

            {showText && (
                <div className="flex flex-col -space-y-1">
                    <h2 className="font-black text-xl md:text-2xl text-gray-900 tracking-tighter font-serif italic leading-none group-hover:text-brand-red transition-colors">
                        O Vermelhinho
                    </h2>
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-300 group-hover:text-brand-red/50 transition-colors">
                        Cidades Inteligentes
                    </span>
                </div>
            )}
        </div>
    );
}
