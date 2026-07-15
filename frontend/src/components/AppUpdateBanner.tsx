import { RefreshCw, Loader2, ArrowDownCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppUpdate } from '@/hooks/useAppUpdate';

/**
 * Overlay elegante e obrigatório de atualização do App.
 * Aparece ocupando a tela inteira com fundo translúcido para forçar a atualização.
 * Exclusivo para o App Mobile (oculto no Desktop).
 */
export function AppUpdateBanner() {
  const { needRefresh, applyUpdate } = useAppUpdate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop(); // check on mount
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Se não precisa atualizar OU se estiver no Desktop, não exibe nada.
  if (!needRefresh || isDesktop) return null;

  const handleUpdate = () => {
    setIsUpdating(true);
    applyUpdate();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-2xl animate-fade-in-up">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/50">
          <ArrowDownCircle className="h-10 w-10 text-red-600" />
        </div>
        
        <h2 className="mb-2 text-2xl font-black tracking-tight text-slate-900">
          Atualização Disponível
        </h2>
        
        <p className="mb-8 text-sm font-medium text-slate-500">
          O Vermelhinho recebeu melhorias importantes. Você precisa atualizar o aplicativo para continuar utilizando.
        </p>

        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-red-800 py-4 font-bold text-white shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:opacity-75"
        >
          {/* Efeito de brilho no botão */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          {isUpdating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Atualizando Sistema...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5 transition-transform group-hover:rotate-180 duration-500" />
              <span>Atualizar Versão</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
