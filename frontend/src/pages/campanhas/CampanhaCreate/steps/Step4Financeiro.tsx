// /var/www/frontend/src/pages/campanhas/CampanhaCreate/steps/Step4Financeiro.tsx
import StepCard from "@/pages/campanhas/CampanhaCreate/components/StepCard";
import FinanceiroForm from "@/pages/campanhas/CampanhaCreate/components/FinanceiroForm";

export default function Step4Financeiro({
  financeiro_status,
  financeiro_forma,
  financeiro_valor,
  financeiro_vencimento,
  financeiro_pago_em,
  financeiro_observacao,
  due_at,
  onPatch,
}: {
  financeiro_status: string;
  financeiro_forma: string;
  financeiro_valor: string;
  financeiro_vencimento: string;
  financeiro_pago_em: string;
  financeiro_observacao: string;
  due_at: string;
  onPatch: (patch: any) => void;
}) {
  return (
    <StepCard
      step={4}
      title="Plano e financeiro"
      description="Pela regra oficial, toda campanha cria ticket financeiro."
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="mb-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <div className="font-semibold text-gray-900">Importante</div>
          <div className="mt-1">
            Para concluir, selecione o <b>Status</b>. Os demais campos são opcionais, mas ajudam no controle.
          </div>
        </div>

        <FinanceiroForm
          status={financeiro_status}
          forma={financeiro_forma}
          valor={financeiro_valor}
          vencimento={financeiro_vencimento}
          pago_em={financeiro_pago_em}
          observacao={financeiro_observacao}
          due_at={due_at}
          onChange={onPatch}
        />
      </div>
    </StepCard>
  );
}
