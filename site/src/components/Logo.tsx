'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
    className?: string;
    showText?: boolean;
}

export default function Logo({ className = "", showText = true }: LogoProps) {
    return (
        <div className={`flex items-center group ${className}`}>
            <div className="relative">
                <Image 
                    src="/logo-overmelhinho.png" 
                    alt="O Vermelhinho" 
                    width={200}
                    height={36}
                    priority
                    className="h-[30px] md:h-[36px] w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                />
            </div>
        </div>
    );
}
