import StepCard from "@/pages/campanhas/CampanhaCreate/components/StepCard";
import ClienteSelector from "@/pages/campanhas/CampanhaCreate/components/ClienteSelector";
import TipoSelector from "@/pages/campanhas/CampanhaCreate/components/TipoSelector";
import PlanoSelector from "@/pages/campanhas/CampanhaCreate/components/PlanoSelector";
import Chip from "@/pages/campanhas/CampanhaCreate/components/ui/Chip";
import type { CampanhaOrigem, CampanhaTipo, PlanoCampanha } from "@/hooks/useCampanhas";
import type { ClienteLiteOption } from "@/hooks/useClientesLite";

export default function Step1ClienteTipo({
  clienteLabel,
  ok,
  form,
  setForm,
  clienteSearch,
  setClienteSearch,
  loadingClientes,
  filteredClientes,
  keywordsLimit,
}: {
  clienteLabel: string;
  ok: boolean;

  form: {
    cliente_id: string;
    nome: string;
    tipo: CampanhaTipo;
    origem: "" | CampanhaOrigem;
    plano: PlanoCampanha;
  };
  setForm: (updater: (prev: any) => any) => void;

  clienteSearch: string;
  setClienteSearch: (v: string) => void;

  loadingClientes: boolean;
  filteredClientes: ClienteLiteOption[];

  keywordsLimit: number;
}) {
  return (
    <StepCard
      step={1}
      title="Cliente e tipo"
      description="Escolha o cliente e defina o básico. Segmentos serão herdados (snapshot) na criação."
      rightLabel={clienteLabel || undefined}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="md:col-span-7">
          <ClienteSelector
            value={form.cliente_id}
            search={clienteSearch}
            setSearch={setClienteSearch}
            loading={loadingClientes}
            options={filteredClientes}
            onChange={(v) => setForm((f: any) => ({ ...f, cliente_id: v }))}
          />
        </div>

        <div className="md:col-span-5">
          <label className="mb-1 block text-xs font-medium text-gray-600">Nome da campanha</label>
          <input
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/5"
            placeholder="Ex: Campanha Fevereiro"
            value={form.nome}
            onChange={(e) => setForm((f: any) => ({ ...f, nome: e.target.value }))}
          />
          <div className="mt-2 text-xs text-gray-500">Recomendado: objetivo + cidade(s) + mês.</div>
        </div>

        <div className="md:col-span-6">
          <TipoSelector value={form.tipo} onChange={(v) => setForm((f: any) => ({ ...f, tipo: v }))} />
        </div>

        <div className="md:col-span-3">
          <label className="mb-1 block text-xs font-medium text-gray-600">Origem</label>
          <select
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            value={form.origem}
            onChange={(e) => setForm((f: any) => ({ ...f, origem: e.target.value as any }))}
          >
            <option value="">(opcional)</option>
            <option value="venda_nova">Venda nova</option>
            <option value="renovacao">Renovação</option>
            <option value="upgrade">Upgrade</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <PlanoSelector
            value={form.plano}
            keywordsLimit={keywordsLimit}
            onChange={(v) => setForm((f: any) => ({ ...f, plano: v }))}
          />
        </div>

        <div className="md:col-span-12">
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm text-gray-700">
              <div className="font-semibold text-gray-900">Etapa 1 de 5</div>
              <div className="text-sm text-gray-600">Complete o básico para avançar.</div>
            </div>
            {ok ? <Chip tone="success">OK</Chip> : <Chip tone="warn">Pendente</Chip>}
          </div>
        </div>
      </div>
    </StepCard>
  );
}
