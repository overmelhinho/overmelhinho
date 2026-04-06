'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import {
    Instagram,
    Facebook,
    Youtube,
    Linkedin,
    Phone,
    Mail,
    ChevronRight,
    Star
} from 'lucide-react';

// TikTok não tem ícone nativo no lucide-react, usamos SVG inline
function TikTokIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.321 5.562a5.122 5.122 0 0 1-.443-.258 6.228 6.228 0 0 1-1.138-.964 6.226 6.226 0 0 1-1.588-3.405H16.15v13.53a2.865 2.865 0 0 1-2.861 2.51 2.865 2.865 0 0 1-2.862-2.862 2.865 2.865 0 0 1 2.862-2.862c.28 0 .549.04.804.115V8.087a6.348 6.348 0 0 0-.804-.052 6.352 6.352 0 0 0-6.352 6.352 6.352 6.352 0 0 0 6.352 6.352 6.352 6.352 0 0 0 6.352-6.352V8.49a9.724 9.724 0 0 0 5.697 1.831V6.835a5.152 5.152 0 0 1-2.717-.764l-.002-.509Z" />
        </svg>
    );
}

export default function Footer() {
    const router = useRouter();
    const currentYear = new Date().getFullYear();

    const socialLinks = [
        { icon: Instagram, href: 'https://www.instagram.com/overmelhinho/', label: 'Instagram' },
        { icon: Facebook, href: 'https://www.facebook.com/guia.vermelhinho', label: 'Facebook' },
        { icon: Youtube, href: 'https://www.youtube.com/channel/UCS8qDu-fmdODhqzXrXf0FEA', label: 'YouTube' },
        { icon: Linkedin, href: 'https://www.linkedin.com/company/overmelhinho/', label: 'LinkedIn' },
        { TikTok: true, href: 'https://www.tiktok.com/@guiaovermelhinho', label: 'TikTok' },
    ];

    const navLinks = [
        { label: 'Anuncie', href: '/anuncie' },
        { label: 'Como Funciona', href: '/como-funciona' },
        { label: 'Vagas', href: '/vagas' },
        { label: 'Blog', href: '/blog' },
        { label: 'Sobre', href: '/sobre' },
    ];

    return (
        <footer className="bg-white border-t border-gray-100 pt-12 pb-12 overflow-hidden relative">
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
                            Conectando pessoas aos melhores negócios e oportunidades da sua região através de tecnologia de busca inteligente.
                        </p>

                        <div className="flex items-center space-x-3">
                            {socialLinks.map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                    className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-brand-red hover:text-white hover:scale-110 transition-all duration-300"
                                >
                                    {'TikTok' in social
                                        ? <TikTokIcon size={20} />
                                        : <social.icon size={20} />
                                    }
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Grid */}
                    <div className="lg:col-span-1 hidden lg:block"></div>

                    <div className="lg:col-span-3 space-y-6 text-left">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Acesso Rápido</h4>
                        <ul className="space-y-4">
                            {navLinks.map((link, i) => (
                                <li key={i}>
                                    <a href={link.href} className="text-gray-500 hover:text-brand-red text-sm font-bold flex items-center group transition-colors">
                                        <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all mr-1" />
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-gray-50 rounded-[2.5rem] p-8 space-y-6 border border-gray-100/50">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Suporte Premium</h4>
                            <div className="space-y-4">
                                {/* WhatsApp */}
                                <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-red flex-shrink-0">
                                        <Phone size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">WhatsApp</p>
                                        <a
                                            href="https://api.whatsapp.com/send/?phone=555432680002&text&type=phone_number&app_absent=0"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-black text-gray-900 hover:text-brand-red transition-colors"
                                        >
                                            (54) 3268-0002
                                        </a>
                                    </div>
                                </div>
                                {/* E-mail */}
                                <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-red flex-shrink-0">
                                        <Mail size={18} />
                                    </div>
                                    <div className="min-w-0 overflow-hidden">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">E-mail</p>
                                        <a
                                            href="mailto:angelica@overmelhinho.com.br"
                                            className="text-sm font-black text-gray-900 hover:text-brand-red transition-colors break-all"
                                        >
                                            angelica@overmelhinho.com.br
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="pt-12 border-t border-gray-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="text-gray-400 text-xs font-medium space-y-1">
                        <p>© {currentYear} O Vermelhinho Negócios Digitais Ltda</p>
                        <p>Rua Cel. Pena de Moraes, 513 - Sala 1004 - Centro</p>
                        <p>Farroupilha/RS.</p>
                        <p className="pt-1">EP&amp;DG by Digital Intelligence</p>
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
