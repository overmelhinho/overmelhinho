import { RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { useAppUpdate } from '@/hooks/useAppUpdate';

/**
 * Banner discreto que aparece no TOPO da tela quando uma nova versão do app
 * está disponível para instalação. Só é exibido após um novo deploy.
 * O usuário escolhe quando atualizar — nunca é forçado.
 */
export function AppUpdateBanner() {
  const { needRefresh, applyUpdate } = useAppUpdate();
  const [dismissed, setDismissed] = useState(false);

  if (!needRefresh || dismissed) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 px-4 py-2.5 text-white text-sm font-semibold shadow-lg"
      style={{ backgroundColor: '#C62828' }}
    >
      <div className="flex items-center gap-2">
        <RefreshCw size={15} className="animate-spin" />
        <span>Nova versão disponível!</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={applyUpdate}
          className="rounded bg-white px-3 py-1 text-xs font-black text-red-700 hover:bg-red-50 transition-colors"
        >
          Atualizar agora
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded p-1 hover:bg-red-700 transition-colors"
          aria-label="Fechar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
