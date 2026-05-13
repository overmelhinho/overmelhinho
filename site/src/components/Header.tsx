'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, Menu, X, Search, MapPin } from 'lucide-react';
import Logo from '@/components/Logo';
import { HeaderSearch } from '@/components/HeaderSearch';
import { useLocation } from '@/contexts/LocationContext';

const navLinks = [
    { label: 'Como Funciona', href: '/como-funciona' },
    { label: 'Vagas', href: '/vagas' },
    { label: 'Blog', href: '/blog' },
    { label: 'Sobre', href: '/sobre' },
];

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const { cityName, setIsCityModalOpen } = useLocation();

    const isActive = (href: string) => pathname === href;

    return (
        <>
            <header className={`sticky top-0 z-[200] border-b border-gray-100 shadow-sm transition-colors duration-300 ${menuOpen ? 'bg-white' : 'bg-white/80 backdrop-blur-xl'}`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4 md:gap-8">

                    {/* Logo */}
                    <div className="cursor-pointer flex-shrink-0" onClick={() => { router.push('/'); setMenuOpen(false); }}>
                        <Logo />
                    </div>

                    {/* ✅ Search Bar Global (Hidden on Home) */}
                    {pathname !== '/' && (
                        <HeaderSearch />
                    )}

                    {/* ✅ Localização Global */}
                    {pathname !== '/' && (
                        <button 
                            onClick={() => setIsCityModalOpen(true)}
                            className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl hover:border-brand-red transition-all group"
                        >
                            <MapPin size={14} className="text-brand-red" />
                            <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest truncate max-w-[150px]">{cityName || 'Qualquer Cidade'}</span>
                        </button>
                    )}

                    {/* Nav Desktop */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map(link => (
                            <button
                                key={link.href}
                                onClick={() => router.push(link.href)}
                                className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors relative group ${isActive(link.href) ? 'text-brand-red' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {link.label}
                                {/* underline ativa */}
                                <span className={`absolute -bottom-1 left-0 h-0.5 bg-brand-red rounded-full transition-all duration-300 ${isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                            </button>
                        ))}
                    </nav>

                    {/* CTA Desktop */}
                    <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                        {/* Login Button Hidden */}
                        {/* <button
                            onClick={() => router.push('/login')}
                            className="flex items-center gap-2 text-gray-900 bg-white px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 border border-gray-100 text-[11px] font-black uppercase tracking-widest"
                        >
                            <User size={16} className="text-brand-red" />
                            Login
                        </button> */}
                        <button
                            onClick={() => router.push('/anuncie')}
                            className="hidden md:flex px-4 py-2 bg-brand-red text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md shadow-red-100 hover:scale-105 active:scale-95 transition-all outline-none"
                        >
                            Anunciar
                        </button>
                    </div>

                    {/* Hamburger Mobile */}
                    <button
                        className="md:hidden p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-brand-red hover:text-white transition-all"
                        onClick={() => setMenuOpen(v => !v)}
                        aria-label="Menu"
                    >
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="fixed inset-0 z-[150] flex flex-col" onClick={() => setMenuOpen(false)}>
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

                    {/* Drawer */}
                    <div
                        className="absolute top-20 left-0 right-0 bg-white border-b border-gray-100 shadow-xl rounded-b-[3rem] overflow-hidden z-[160]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-6 py-8 space-y-2">
                            {navLinks.map(link => (
                                <button
                                    key={link.href}
                                    onClick={() => { router.push(link.href); setMenuOpen(false); }}
                                    className={`w-full text-left px-5 py-4 rounded-2xl font-black text-lg transition-all ${isActive(link.href) ? 'bg-brand-red/5 text-brand-red' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    {link.label}
                                </button>
                            ))}

                            <div className="pt-4">
                                {/* Login Button Hidden */}
                                {/* <button
                                    onClick={() => { router.push('/login'); setMenuOpen(false); }}
                                    className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-gray-100 font-black text-gray-700 hover:border-brand-red transition-colors"
                                >
                                    <User size={18} className="text-brand-red" />
                                    Login
                                </button> */}
                                <button
                                    onClick={() => { router.push('/anuncie'); setMenuOpen(false); }}
                                    className="w-full py-4 rounded-2xl bg-brand-red text-white font-black shadow-lg shadow-red-100 active:scale-95 transition-all text-center"
                                >
                                    Anunciar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
