import StepCard from "@/pages/campanhas/CampanhaCreate/components/StepCard";
import PeriodoSelector from "@/pages/campanhas/CampanhaCreate/components/PeriodoSelector";
import PlacementsSelector from "@/pages/campanhas/CampanhaCreate/components/PlacementsSelector";
import CidadesSelector from "@/pages/campanhas/CampanhaCreate/components/CidadesSelector";
import Chip from "@/pages/campanhas/CampanhaCreate/components/ui/Chip";
import type { PlacementType } from "@/hooks/useCampanhas";
import type { Cidade } from "@/hooks/useCidades";

export default function Step2PeriodoAlcance({
  ok,
  form,
  setForm,
  hasGlobalPlacement,
  togglePlacement,
  cidades,
  filteredCidades,
  loadingCidades,
  cidadeSearch,
  setCidadeSearch,
  toggleCidade,
}: {
  ok: boolean;

  form: {
    data_inicio: string;
    data_fim: string;
    placements: PlacementType[];
    cidades_ids: number[];
  };
  setForm: (updater: (prev: any) => any) => void;

  hasGlobalPlacement: boolean;
  togglePlacement: (p: PlacementType, checked: boolean) => void;

  cidades: Cidade[];
  filteredCidades: Cidade[];
  loadingCidades: boolean;
  cidadeSearch: string;
  setCidadeSearch: (v: string) => void;
  toggleCidade: (id: number, checked: boolean) => void;
}) {
  return (
    <StepCard
      step={2}
      title="Período e alcance"
      description="Definem onde a campanha aparece. Se for global, cidades deixam de ser obrigatórias."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="md:col-span-12">
          <PeriodoSelector
            data_inicio={form.data_inicio}
            data_fim={form.data_fim}
            onChangeInicio={(v) => setForm((f: any) => ({ ...f, data_inicio: v }))}
            onChangeFim={(v) => setForm((f: any) => ({ ...f, data_fim: v }))}
          />
        </div>

        <div className="md:col-span-12">
          <PlacementsSelector placements={form.placements} onToggle={togglePlacement} hasGlobalPlacement={hasGlobalPlacement} />
        </div>

        <div className="md:col-span-12">
          <CidadesSelector
            hasGlobalPlacement={hasGlobalPlacement}
            loading={loadingCidades}
            cidades={cidades}
            filteredCidades={filteredCidades}
            selectedIds={form.cidades_ids}
            search={cidadeSearch}
            setSearch={setCidadeSearch}
            onToggleCidade={toggleCidade}
            onClear={() => setForm((f: any) => ({ ...f, cidades_ids: [] }))}
          />
        </div>

        <div className="md:col-span-12">
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm text-gray-700">
              <div className="font-semibold text-gray-900">Etapa 2 de 5</div>
              <div className="text-sm text-gray-600">Período, placements e cidades (se não for global).</div>
            </div>
            {ok ? <Chip tone="success">OK</Chip> : <Chip tone="warn">Pendente</Chip>}
          </div>
        </div>
      </div>
    </StepCard>
  );
}
