import { get, set } from 'idb-keyval';
import api from './api';

const OUTBOX_KEY = 'offline_outbox';

export type OutboxItem = {
  id: string; // UUID gerado no momento da interceptação
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data: any;
  headers: any;
  timestamp: number;
  retries: number;
};

/**
 * Adiciona uma requisição à fila offline
 */
export async function addToOutbox(request: Omit<OutboxItem, 'id' | 'timestamp' | 'retries'>) {
  const id = crypto.randomUUID();
  const newItem: OutboxItem = {
    ...request,
    id,
    timestamp: Date.now(),
    retries: 0,
  };

  const queue = (await get<OutboxItem[]>(OUTBOX_KEY)) || [];
  queue.push(newItem);
  await set(OUTBOX_KEY, queue);

  // Dispara evento para a UI (ex: badge na navbar) atualizar
  window.dispatchEvent(new CustomEvent('outbox-updated', { detail: queue.length }));
  
  return id;
}

/**
 * Retorna o número de itens na fila
 */
export async function getOutboxCount(): Promise<number> {
  const queue = (await get<OutboxItem[]>(OUTBOX_KEY)) || [];
  return queue.length;
}

let isProcessing = false;

/**
 * Processa a fila de forma sequencial quando a internet volta
 */
export async function processOutbox() {
  if (isProcessing || !navigator.onLine) return;
  isProcessing = true;

  try {
    const queue = (await get<OutboxItem[]>(OUTBOX_KEY)) || [];
    if (queue.length === 0) {
      isProcessing = false;
      return;
    }

    // Processa os itens um a um, em ordem de chegada
    const remainingQueue = [...queue];

    for (const item of queue) {
      if (!navigator.onLine) break; // Caiu a rede no meio do processamento

      try {
        // Envia para a API real, ignorando o interceptor offline (precisa de um header flag)
        await api.request({
          method: item.method,
          url: item.url,
          data: item.data,
          headers: {
            ...item.headers,
            'X-From-Outbox': 'true', // Flag para o interceptor não re-enfileirar
          }
        });
        
        // Sucesso: remove o item processado da fila
        remainingQueue.shift();
      } catch (err: any) {
        const isNetworkError = !err.response;
        
        if (isNetworkError) {
          // Erro de rede (ex: instabilidade), para o processamento e deixa na fila
          break;
        }

        // Se for erro 400 (Bad Request), 403, 404, etc, o dado é inválido
        // Falha permanente, incrementa tentativas ou descarta
        // Por ora, vamos remover para não travar a fila com um erro 422 (validação),
        // mas o ideal futuro é mover para uma lista de "Atenção Necessária".
        console.error('Falha permanente ao sincronizar item:', item, err);
        remainingQueue.shift();
      }
    }

    await set(OUTBOX_KEY, remainingQueue);
    window.dispatchEvent(new CustomEvent('outbox-updated', { detail: remainingQueue.length }));

  } finally {
    isProcessing = false;
  }
}

// Inicia automaticamente o processamento quando a rede volta
window.addEventListener('online', () => {
  processOutbox();
});
