// /var/www/frontend/src/pages/campanhas/CampanhaCreate/index.tsx
import CampanhaWizardCore from "@/pages/campanhas/CampanhaWizard/CampanhaWizardCore";

export default function CampanhaCreatePage() {
  // ✅ Wrapper para não mudar rotas/imports existentes.
  // ✅ Comportamento permanece idêntico ao que já estava funcionando.
  return <CampanhaWizardCore />;
}
