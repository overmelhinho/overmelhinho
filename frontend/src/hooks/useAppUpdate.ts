import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Hook para detectar quando uma nova versão do PWA está disponível.
 * Usa registerType: 'prompt' — o service worker avisa e mostra o banner
 * para o usuário atualizar manualmente (e forçar o reload).
 */
export function useAppUpdate() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Verifica atualizações a cada 1 hora
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
  });

  return { 
    needRefresh, 
    applyUpdate: () => updateServiceWorker(true) 
  };
}
