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
    },
    onRegisterError(error) {
      console.error('❌ Erro ao registrar Service Worker:', error);
    },
  });

  const applyUpdate = () => {
    updateServiceWorker(true);
  };

  return { needRefresh, applyUpdate };
}
