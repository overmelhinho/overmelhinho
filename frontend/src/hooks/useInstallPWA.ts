import { useEffect, useState } from 'react';

/**
 * Hook que captura o evento 'beforeinstallprompt' do Chrome.
 * Isso nos permite criar um botão customizado "Instalar App"
 * em vez de depender do banner nativo do browser (que pode demorar dias para aparecer).
 */
export function useInstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detecta se já está instalado como PWA (modo standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Captura o prompt nativo antes de ele ser exibido automaticamente
    const handler = (e: Event) => {
      e.preventDefault(); // Impede o banner automático do Chrome
      setDeferredPrompt(e);
    };

    // Quando o app é instalado com sucesso
    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); // Exibe o diálogo nativo de instalação
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // canInstall: true apenas se o prompt foi capturado E o app não está instalado
  const canInstall = !!deferredPrompt && !isInstalled;

  return { canInstall, install, isInstalled };
}
