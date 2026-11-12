'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Next.js Global Error Boundary]:', error);
    }, [error]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 space-y-6 p-4">
            <h1 className="text-4xl font-black text-gray-900 font-serif italic">Serviço Temporariamente Indisponível</h1>
            <p className="text-gray-500 text-center max-w-md">
                Ocorreu uma instabilidade momentânea na comunicação com nossos servidores. Nossa equipe já foi notificada.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={() => reset()}
                    className="bg-brand-red text-white px-6 py-3 rounded-2xl font-black text-center hover:bg-red-700 transition-colors"
                >
                    Tentar Novamente
                </button>
                <Link
                    href="/"
                    className="bg-gray-200 text-gray-800 px-6 py-3 rounded-2xl font-black text-center hover:bg-gray-300 transition-colors"
                >
                    Voltar ao Início
                </Link>
            </div>
        </div>
    );
}

