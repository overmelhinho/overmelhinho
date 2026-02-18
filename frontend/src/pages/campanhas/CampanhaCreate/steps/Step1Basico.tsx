// /var/www/frontend/src/pages/campanhas/CampanhaCreate/steps/Step1Basico.tsx
import { useEffect, useRef } from "react";
import StepCard from "@/pages/campanhas/CampanhaCreate/components/StepCard";
import ClienteSelector from "@/pages/campanhas/CampanhaCreate/components/ClienteSelector";
import TipoSelector from "@/pages/campanhas/CampanhaCreate/components/TipoSelector";
import PlanoSelector from "@/pages/campanhas/CampanhaCreate/components/PlanoSelector";
import type { CampanhaOrigem, CampanhaTipo, PlanoCampanha } from "@/hooks/useCampanhas";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function Step1Basico(props: {
  clienteLabel: string;

  cliente_id: string;
  nome: string;
  tipo: CampanhaTipo;
  origem: "" | CampanhaOrigem;
  plano: PlanoCampanha;
  keywordsLimit: number;

  clienteSearch: string;
  setClienteSearch: (v: string) => void;
  loadingClientes: boolean;
  filteredClientes: any[];

  onPatch: (patch: Partial<{
    cliente_id: string;
    nome: string;
    tipo: CampanhaTipo;
    origem: "" | CampanhaOrigem;
    plano: PlanoCampanha;
  }>) => void;
}) {
  const {
    cliente_id,
    nome,
    tipo,
    origem,
    plano,
    keywordsLimit,
    clienteSearch,
    setClienteSearch,
    loadingClientes,
    filteredClientes,
    onPatch,
  } = props;

  const tipoRef = useRef<HTMLDivElement>(null);

  const isClienteValid = !!cliente_id;
  const isNomeValid = !!nome?.trim();
  const isTipoValid = !!tipo;
  const isPlanoValid = !!plano;

  // 🔥 Auto scroll quando cliente for selecionado
  useEffect(() => {
    if (isClienteValid && tipoRef.current) {
      tipoRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isClienteValid]);

  const origemOptions: Array<{ v: "" | CampanhaOrigem; label: string }> = [
    { v: "", label: "Não definida" },
    { v: "venda_nova", label: "Venda nova" },
    { v: "renovacao", label: "Renovação" },
    { v: "upgrade", label: "Upgrade" },
  ];

  return (
    <StepCard
      step={1}
      title="Cliente e configuração comercial"
      description="Defina cliente, tipo, origem e plano."
      rightLabel={isClienteValid && isNomeValid && isTipoValid && isPlanoValid ? "Completo" : undefined}
    >
      <div className="space-y-8">
        {/* 🔹 Cliente + Nome (mais compacto e organizado) */}
        <div
          className={cx(
            "rounded-3xl border p-6 transition",
            !isClienteValid || !isNomeValid ? "border-gray-200 bg-white" : "border-emerald-200 bg-emerald-50/30"
          )}
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <ClienteSelector
                value={cliente_id}
                search={clienteSearch}
                setSearch={setClienteSearch}
                loading={loadingClientes}
                options={filteredClientes}
                onChange={(v: string) => onPatch({ cliente_id: v })}
              />
            </div>

            <div className="lg:col-span-5">
              <label className="mb-2 block text-xs font-medium text-gray-600">
                Nome da campanha <span className="text-[#B70F0A]">*</span>
              </label>
              <input
                className={cx(
                  "w-full rounded-2xl border px-3 py-2 text-sm shadow-sm outline-none focus:ring-4 focus:ring-gray-900/5",
                  !isNomeValid && cliente_id ? "border-red-200 bg-red-50/40" : "border-gray-200 bg-white"
                )}
                placeholder="Ex: Campanha Telha - Fevereiro"
                value={nome}
                onChange={(e) => onPatch({ nome: e.target.value })}
              />
              <div className="mt-2 text-xs text-gray-500">Dica: objetivo + cidade(s) + mês.</div>
            </div>
          </div>
        </div>

        {/* 🔹 Tipo */}
        <div
          ref={tipoRef}
          className={cx(
            "rounded-3xl border p-6 transition",
            isClienteValid ? "border-gray-200 bg-white" : "border-gray-200 bg-gray-50 opacity-70"
          )}
        >
          <TipoSelector value={tipo} onChange={(v: CampanhaTipo) => onPatch({ tipo: v })} />
        </div>

        {/* 🔹 Origem + Plano (lado a lado no desktop) */}
        {tipo ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 animate-in fade-in duration-300">
            <div className="xl:col-span-4 rounded-3xl border border-gray-200 bg-white p-6">
              <label className="mb-4 block text-xs font-medium text-gray-600">Origem</label>

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
                {origemOptions.map((o) => {
                  const active = origem === o.v;

                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => onPatch({ origem: o.v })}
                      className={cx(
                        "rounded-2xl border p-4 text-sm font-medium transition",
                        active
                          ? "border-[#B70F0A]/30 bg-[#B70F0A]/5 ring-4 ring-[#B70F0A]/10"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
                Origem é opcional, mas ajuda relatórios comerciais.
              </div>
            </div>

            <div className="xl:col-span-8 rounded-3xl border border-gray-200 bg-white p-6">
              <PlanoSelector
                value={plano}
                keywordsLimit={keywordsLimit}
                onChange={(v: PlanoCampanha) => onPatch({ plano: v })}
              />

              {!isPlanoValid ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
                  Selecione um plano para calcular limites (ex.: keywords) e elegibilidade.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </StepCard>
  );
}
