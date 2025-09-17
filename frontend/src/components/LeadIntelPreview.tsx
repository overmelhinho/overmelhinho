// src/components/LeadIntelPreview.tsx
import { useState } from 'react';
import { useLeadIntel } from '@/hooks/useLeadIntel';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LeadIntelPreview() {
  const [query, setQuery] = useState('');
  const [busca, setBusca] = useState('');
  const { data, isLoading, error } = useLeadIntel(busca, !!busca);

  const handleBuscar = () => {
    if (query.length > 2) setBusca(query);
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto p-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: Padaria São João Caxias"
        />
        <Button onClick={handleBuscar} disabled={isLoading}>
          Buscar
        </Button>
      </div>

      {isLoading && <p>Carregando informações...</p>}
      {error && <p className="text-red-500">Erro ao buscar dados.</p>}

      {data && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <h2 className="text-lg font-semibold">{data.nome_fantasia}</h2>
            <p className="text-sm text-muted-foreground">{data.descricao}</p>
            <div className="text-sm space-y-1">
              {data.telefone && <p>📞 {data.telefone}</p>}
              {data.endereco && <p>📍 {data.endereco}</p>}
              {data.instagram && <p>📸 {data.instagram}</p>}
              {data.email && <p>✉️ {data.email}</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
