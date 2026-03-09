'use client';

import React from 'react';
import {
    User,
    Lock,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    ShieldCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function LoginPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-cloud-dancer flex items-center justify-center p-6 font-sans">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-red/5 to-transparent pointer-events-none" />

            <div className="max-w-md w-full space-y-8 relative z-10">
                <div className="text-center space-y-6">
                    <div className="flex justify-center">
                        <Logo />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic font-serif">Área do <span className="text-brand-red">Anunciante.</span></h1>
                        <p className="text-gray-400 font-medium">Gerencie seu perfil, veja métricas e destaque sua empresa.</p>
                    </div>
                </div>

                <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-50 space-y-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">E-mail de Acesso</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-300 group-focus-within:text-brand-red transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-red focus:bg-white rounded-2xl py-4 pl-14 pr-6 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Senha</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-300 group-focus-within:text-brand-red transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-red focus:bg-white rounded-2xl py-4 pl-14 pr-6 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-200"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-2">
                        <label className="flex items-center space-x-2 cursor-pointer group">
                            <div className="w-5 h-5 rounded border-2 border-gray-100 group-hover:border-brand-red transition-colors" />
                            <span className="text-xs font-bold text-gray-400 group-hover:text-gray-600 transition-colors">Lembrar de mim</span>
                        </label>
                        <a href="#" className="text-xs font-black text-brand-red hover:underline italic">Esqueceu a senha?</a>
                    </div>

                    <div className="space-y-4">
                        <button className="w-full bg-brand-red text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-red-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-3">
                            <span>Entrar no Painel</span>
                            <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => router.push('/anuncie')}
                            className="w-full bg-gray-50 text-gray-400 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors"
                        >
                            Quero ser um anunciante
                        </button>
                    </div>
                </div>

                <div className="text-center pt-8">
                    <button
                        onClick={() => router.push('/')}
                        className="inline-flex items-center space-x-2 text-gray-400 hover:text-brand-red font-bold text-sm transition-colors"
                    >
                        <ArrowLeft size={16} />
                        <span>Voltar para o Portal</span>
                    </button>
                </div>

                {/* Info Badges */}
                <div className="flex items-center justify-center gap-6 pt-8 grayscale opacity-40">
                    <div className="flex items-center space-x-2">
                        <ShieldCheck size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Ambiente Seguro</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">SSO Autenticado</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
