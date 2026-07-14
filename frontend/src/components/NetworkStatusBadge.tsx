import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Badge pequeno que exibe o status da conexão de rede.
 * 🟢 Online  /  🔴 Offline
 * 
 * Usado na barra de navegação do painel para que a vendedora
 * saiba claramente quando está sem internet e suas ações estão
 * sendo salvas na fila local.
 */
export function NetworkStatusBadge() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      title={isOnline ? 'Online' : 'Sem conexão — trabalhando offline'}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider transition-all duration-500 ${
        isOnline
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700 animate-pulse'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi size={11} />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff size={11} />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}
