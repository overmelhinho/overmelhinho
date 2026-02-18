// /var/www/frontend/src/pages/campanhas/CampanhaWizard/CampanhaEditWizard.tsx
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import CampanhaWizard from "./CampanhaWizard";

export default function CampanhaEditWizard() {
  const { id } = useParams();
  const campanhaId = useMemo(() => (id ? Number(id) : 0), [id]);

  // ✅ Mantém contrato: rota só existe com :id, então aqui sempre deve ter número.
  return <CampanhaWizard mode="edit" campanhaId={campanhaId} />;
}
