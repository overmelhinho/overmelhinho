// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/CidadesSelector.tsx
import type { Cidade } from "@/hooks/useCidades";
import Chip from "@/pages/campanhas/CampanhaCreate/components/ui/Chip";

export default function CidadesSelector({
  hasGlobalPlacement,
  loading,
  cidades,
  filteredCidades,
  selectedIds,
  search,
  setSearch,
  onToggleCidade,
  onClear,
}: {
  hasGlobalPlacement: boolean;
  loading: boolean;
  cidades: Cidade[];
  filteredCidades: Cidade[];
  selectedIds: number[];
  search: string;
  setSearch: (v: string) => void;
  onToggleCidade: (id: number, checked: boolean) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="mb-2 block text-xs font-medium text-slate-600">
        Cidades atendidas{" "}
        {hasGlobalPlacement ? "(não se aplica para global)" : <span className="text-[#B70F0A]">*</span>}
      </label>

      {hasGlobalPlacement ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Campanha com placement global não usa cidades.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none shadow-sm focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5"
                placeholder="Buscar cidade (nome/UF)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="mt-2 text-xs text-slate-500">
                Dica: selecione poucas cidades para campanhas específicas; global ignora isso.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Chip tone={selectedIds.length ? "info" : "neutral"}>{selectedIds.length} selecionada(s)</Chip>
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                onClick={onClear}
                disabled={selectedIds.length === 0}
              >
                Limpar
              </button>
            </div>
          </div>

          {selectedIds.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedIds.slice(0, 12).map((id) => {
                const c = cidades.find((x) => x.id === id);
                const label = c ? `${c.nome}${c.uf ? `-${c.uf}` : ""}` : `#${id}`;
                return (
                  <Chip key={id} onRemove={() => onToggleCidade(id, false)}>
                    {label}
                  </Chip>
                );
              })}
              {selectedIds.length > 12 ? <Chip>+{selectedIds.length - 12}</Chip> : null}
            </div>
          ) : (
            <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Nenhuma cidade selecionada.
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
            <div className="max-h-[340px] overflow-auto">
              {loading ? (
                <div className="p-4 text-sm text-slate-600">Carregando cidades…</div>
              ) : !cidades?.length ? (
                <div className="p-4 text-sm text-slate-600">Nenhuma cidade retornada pela API.</div>
              ) : filteredCidades.length === 0 ? (
                <div className="p-4 text-sm text-slate-600">Nenhuma cidade encontrada para esse filtro.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredCidades.map((c) => {
                    const checked = selectedIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900">
                            {c.nome}
                            {c.uf ? <span className="text-slate-500">-{c.uf}</span> : null}
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => onToggleCidade(c.id, e.target.checked)}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
