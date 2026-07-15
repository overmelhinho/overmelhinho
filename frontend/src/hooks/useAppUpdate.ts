import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Hook para detectar quando uma nova versão do PWA está disponível.
 * Usa registerType: 'prompt' — ou seja, o service worker NOVO aguarda confirmação
 * antes de assumir o controle. Isso evita que a tela da vendedora seja "recarregada"
 * no meio de um trabalho.
 */
export function useAppUpdate() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('✅ Service Worker registrado:', r);
      if (r) {
        // Verifica atualizações a cada 1 hora, caso o app fique aberto
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);

        // Verifica IMEDIATAMENTE sempre que o usuário voltar/abrir o aplicativo
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            r.update();
          }
        });
      }
    },
  });

  const applyUpdate = () => {
    updateServiceWorker(true);
  };

  return { needRefresh, applyUpdate };
}
