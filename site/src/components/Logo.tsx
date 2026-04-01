'use client';

import React from 'react';

interface LogoProps {
    className?: string;
    showText?: boolean;
}

export default function Logo({ className = "", showText = true }: LogoProps) {
    return (
        <div className={`flex items-center group ${className}`}>
            <div className="relative">
                <img 
                    src="/logo-overmelhinho.png" 
                    alt="O Vermelhinho" 
                    className="h-10 md:h-12 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                />
            </div>
        </div>
    );
}
