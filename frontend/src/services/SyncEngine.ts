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
  syncOfflineDatabase();
});

// E também tenta processar ao carregar a aplicação, caso tenha sobrado itens
if (typeof navigator !== 'undefined' && navigator.onLine) {
  setTimeout(() => {
    processOutbox();
    syncOfflineDatabase();
  }, 1000); // Aguarda a app inicializar
}

/**
 * Baixa o banco de dados Lite completo para uso offline 
 */
export async function syncOfflineDatabase() {
  if (!navigator.onLine) return;
  
  const syncKeyGlobal = 'last_sync_clientes';
  const lastSync = localStorage.getItem(syncKeyGlobal);
  const toastId = 'offline-sync-toast';

  try {
    const perPage = 2500;
    let currentPage = 1;
    let totalItems = 0;
    let allFetchedRows: any[] = [];
    let isFinished = false;

    // Apenas mostra o toast se não for um Delta Sync (ou seja, é o primeiro download gigante)
    if (!lastSync) {
      import('sonner').then(({ toast }) => {
        toast.loading('Sincronizando banco offline (0%)...', { id: toastId, duration: Infinity });
      });
    }

    while (!isFinished) {
      const params: any = { lite: true, per_page: perPage, page: currentPage };
      if (lastSync) {
        params.last_sync = lastSync;
      }

      const { data } = await api.get('/v1/clientes', { params });
      
      let fetchedRows = [];
      
      // O formato do Laravel Paginator retornado via response()->json($paginator) é:
      // { current_page: 1, data: [...], total: 3800, last_page: 2 }
      if (data && typeof data.total !== 'undefined' && typeof data.last_page !== 'undefined' && Array.isArray(data.data)) {
        fetchedRows = data.data;
        totalItems = data.total || 0;
        
        // Verifica se chegamos na última página
        if (currentPage >= (data.last_page || 1)) {
          isFinished = true;
        }
      } 
      // Formato de API Resource: { data: { data: [...], meta: { total: 3800 } } }
      else if (data?.data && Array.isArray(data.data.data)) {
        fetchedRows = data.data.data;
        totalItems = data.data.total || data.meta?.total || 0;
        
        if (currentPage >= (data.data.last_page || data.meta?.last_page || 1)) {
          isFinished = true;
        }
      } 
      // Array puro
      else if (Array.isArray(data?.data)) {
        fetchedRows = data.data;
        isFinished = true;
      } else {
        isFinished = true; // Formato desconhecido
      }

      allFetchedRows = [...allFetchedRows, ...fetchedRows];

      // Atualiza o progresso visual (apenas se for o download total)
      if (!lastSync && totalItems > 0 && !isFinished) {
        const percentage = Math.min(99, Math.round((allFetchedRows.length / totalItems) * 100));
        import('sonner').then(({ toast }) => {
          toast.loading(`Sincronizando banco offline (${percentage}%)...`, { id: toastId });
        });
      }

      currentPage++;
    }

    if (allFetchedRows.length > 0) {
      const dbKey = 'offline_clientes_db';
      const existingDb = (await get<any[]>(dbKey)) || [];
      
      if (lastSync && existingDb.length > 0) {
        // Delta sync: Atualiza os registros existentes com as novidades
        const newIds = new Set(allFetchedRows.map((r: any) => r.id));
        const keptOldRows = existingDb.filter((r: any) => !newIds.has(r.id));
        const mergedDb = [...allFetchedRows, ...keptOldRows];
        await set(dbKey, mergedDb);
      } else {
        // Full sync: Substitui o banco inteiro
        await set(dbKey, allFetchedRows);
        
        // Finaliza o status visual no primeiro download
        import('sonner').then(({ toast }) => {
          toast.success(`Banco sincronizado (${allFetchedRows.length} clientes offline)`, {
            id: toastId,
            duration: 5000
          });
        });
      }
      
      // Salva a data do último sync
      localStorage.setItem(syncKeyGlobal, new Date().toISOString());
    } else {
      // Nenhum dado novo baixado
      if (!lastSync) {
        import('sonner').then(({ toast }) => {
          toast.dismiss(toastId);
        });
      }
    }
  } catch (err) {
    console.error("Falha ao sincronizar banco offline:", err);
    if (!lastSync) {
      import('sonner').then(({ toast }) => {
        toast.error("Falha ao sincronizar banco offline.", { id: toastId, duration: 4000 });
      });
    }
  }
}

