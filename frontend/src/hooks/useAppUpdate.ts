import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Hook para detectar quando uma nova versão do PWA está disponível.
 * Usa registerType: 'autoUpdate' — o service worker atualiza silenciosamente
 * em background sem interromper a sessão do usuário.
 */
export function useAppUpdate() {
  useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Verifica atualizações a cada 1 hora, caso o app fique aberto por muito tempo
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
  });

  // Com autoUpdate, não precisamos de needRefresh nem applyUpdate manual
  return { needRefresh: false, applyUpdate: () => {} };
}
