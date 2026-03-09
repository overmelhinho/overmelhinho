'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import {
    Instagram,
    Facebook,
    Twitter,
    Youtube,
    MapPin,
    Phone,
    Mail,
    Heart,
    ChevronRight,
    Star
} from 'lucide-react';

export default function Footer() {
    const router = useRouter();
    const currentYear = new Date().getFullYear();

    const links = {
        institucional: [
            { label: 'Como Funciona', href: '/como-funciona' },
            { label: 'Sobre Nós', href: '/sobre' },
            { label: 'Planos e Preços', href: '/anuncie' },
            { label: 'Blog da Região', href: '/blog' },
        ],
        servicos: [
            { label: 'Anuncie sua Empresa', href: '/anuncie' },
            { label: 'Vagas de Emprego', href: '/vagas' },
            { label: 'Guia Comercial', href: '/busca' },
            { label: 'Radar de Oportunidades', href: '/radar' },
        ],
        suporte: [
            { label: 'Central de Ajuda', href: '/ajuda' },
            { label: 'Termos de Uso', href: '/termos' },
            { label: 'Privacidade', href: '/privacidade' },
            { label: 'Fale Conosco', href: '/contato' },
        ]
    };

    return (
        <footer className="bg-white border-t border-gray-100 pt-24 pb-12 overflow-hidden relative">
            {/* Elementos Decorativos */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-red/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-red/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-8 mb-20">

                    {/* Brand Section */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="cursor-pointer" onClick={() => router.push('/')}>
                            <Logo />
                        </div>

                        <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-sm">
                            Conectando pessoas aos melhores negócios e oportunidades da sua região através de tecnologia de busca inteligente e inteligência geográfica.
                        </p>

                        <div className="flex items-center space-x-4">
                            {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-brand-red hover:text-white hover:scale-110 transition-all duration-300">
                                    <Icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Grid */}
                    <div className="lg:col-span-1 hidden lg:block"></div>

                    <div className="lg:col-span-2 space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Plataforma</h4>
                        <ul className="space-y-4">
                            {links.institucional.map((link, i) => (
                                <li key={i}>
                                    <a href={link.href} className="text-gray-500 hover:text-brand-red text-sm font-bold flex items-center group transition-colors">
                                        <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all mr-1" />
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Serviços</h4>
                        <ul className="space-y-4">
                            {links.servicos.map((link, i) => (
                                <li key={i}>
                                    <a href={link.href} className="text-gray-500 hover:text-brand-red text-sm font-bold flex items-center group transition-colors">
                                        <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all mr-1" />
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-3 space-y-8">
                        <div className="bg-gray-50 rounded-[2.5rem] p-8 space-y-6 border border-gray-100/50">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Suporte Premium</h4>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-red flex-shrink-0">
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Telefone</p>
                                        <p className="text-sm font-black text-gray-900">(54) 99999-9999</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-red flex-shrink-0">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">E-mail</p>
                                        <p className="text-sm font-black text-gray-900">contato@overmelhinho.com.br</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="pt-12 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center space-x-2 text-gray-400 text-xs font-medium">
                        <span>© {currentYear} O Vermelhinho Portal.</span>
                        <span className="hidden md:inline">•</span>
                        <span>D&D by Digital Intelligence</span>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white shadow-sm overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?u=${i}`} alt="" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">+ 10k Parceiros</span>
                        </div>
                        <div className="w-px h-4 bg-gray-100 hidden md:block" />
                        <div className="flex items-center space-x-1 text-brand-red">
                            <Star size={12} fill="currentColor" />
                            <Star size={12} fill="currentColor" />
                            <Star size={12} fill="currentColor" />
                            <Star size={12} fill="currentColor" />
                            <Star size={12} fill="currentColor" />
                            <span className="text-[10px] font-black ml-1 uppercase tracking-widest text-gray-900">4.9/5</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
