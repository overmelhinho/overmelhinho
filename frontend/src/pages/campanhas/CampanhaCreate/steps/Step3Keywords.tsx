// /var/www/frontend/src/pages/campanhas/CampanhaCreate/steps/Step3Keywords.tsx
import StepCard from "@/pages/campanhas/CampanhaCreate/components/StepCard";
import KeywordsEditor from "@/pages/campanhas/CampanhaCreate/components/KeywordsEditor";

export default function Step3Keywords({
  keywords_text,
  keywordsParsed,
  keywordsLimit,
  onChange,
}: {
  keywords_text: string;
  keywordsParsed: string[];
  keywordsLimit: number;
  onChange: (v: string) => void;
}) {
  return (
    <StepCard
      step={3}
      title="Segmentos e keywords"
      description="Keywords ativam a campanha em buscas. Sem keyword, só entra se não existir nenhuma campanha com keyword válida no contexto."
      rightLabel={`${keywordsParsed.length} / ${keywordsLimit}`}
    >
      <KeywordsEditor
        value={keywords_text}
        keywordsParsed={keywordsParsed}
        keywordsLimit={keywordsLimit}
        onChange={onChange}
      />
    </StepCard>
  );
}
