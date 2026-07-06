import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 space-y-6 p-4">
            <h1 className="text-4xl font-black text-gray-900 font-serif italic">Ops!</h1>
            <p className="text-gray-500 text-center">Página ou empresa não encontrada.</p>
            <Link 
                href="/" 
                className="bg-brand-red text-white px-8 py-4 rounded-2xl font-black text-center hover:bg-red-700 transition-colors"
            >
                Voltar ao Início
            </Link>
        </div>
    );
}
