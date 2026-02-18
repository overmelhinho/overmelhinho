// /var/www/frontend/src/pages/campanhas/CampanhaCreate/steps/Step5Midias.tsx
import { useMemo, useState } from "react";
import StepCard from "@/pages/campanhas/CampanhaCreate/components/StepCard";
import DropzoneCard from "@/pages/campanhas/CampanhaCreate/components/ui/DropzoneCard";
import { useUploadTemp } from "@/hooks/useUploadTemp";

type Slot = "desktop" | "mobile";

export default function Step5Midias({
  desktopUrl,
  desktopName,
  mobileUrl,
  mobileName,
  onSetTemp,
}: {
  desktopUrl: string | null;
  desktopName: string | null;
  mobileUrl: string | null;
  mobileName: string | null;
  onSetTemp: (slot: Slot, tempPath: string | null, publicUrl: string | null, fileName: string | null) => void;
}) {
  const uploadTemp = useUploadTemp();

  const [errDesktop, setErrDesktop] = useState<string | null>(null);
  const [errMobile, setErrMobile] = useState<string | null>(null);

  const uploading = uploadTemp.isPending;

  const hintDesktop = useMemo(
    () => "Recomendado: imagem desktop. Formatos: PNG/JPG/WebP.",
    []
  );
  const hintMobile = useMemo(
    () => "Recomendado: imagem mobile. Formatos: PNG/JPG/WebP.",
    []
  );

  async function upload(slot: Slot, file: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      const msg = "Envie uma imagem (PNG/JPG/WebP).";
      slot === "desktop" ? setErrDesktop(msg) : setErrMobile(msg);
      return;
    }

    slot === "desktop" ? setErrDesktop(null) : setErrMobile(null);

    try {
      const res = await uploadTemp.mutateAsync([file]);
      const first = res?.files?.[0];
      if (!first?.path) throw new Error(res?.message || "Falha no upload.");

      onSetTemp(slot, first.path, first.public_url || null, first.name || file.name);

    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Erro ao enviar arquivo.";
      slot === "desktop" ? setErrDesktop(msg) : setErrMobile(msg);
    }
  }

  return (
    <StepCard
      step={5}
      title="Mídias (Desktop e Mobile)"
      description="Opcional. Os arquivos sobem para temporário e serão anexados após criar a campanha."
      rightLabel="Opcional"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="md:col-span-6">
          <DropzoneCard
            title="Desktop"
            subtitle="Criativo para exibição em desktop."
            hint={hintDesktop}
            valueUrl={desktopUrl}
            fileName={desktopName}
            uploading={uploading}
            error={errDesktop}
            onPick={(f) => upload("desktop", f)}
            onRemove={() => onSetTemp("desktop", null, null, null)}
          />
        </div>

        <div className="md:col-span-6">
          <DropzoneCard
            title="Mobile"
            subtitle="Criativo para exibição em mobile."
            hint={hintMobile}
            valueUrl={mobileUrl}
            fileName={mobileName}
            uploading={uploading}
            error={errMobile}
            onPick={(f) => upload("mobile", f)}
            onRemove={() => onSetTemp("mobile", null, null, null)}
          />
        </div>

        <div className="md:col-span-12">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <div className="font-semibold text-gray-900">Como funciona</div>
            <div className="mt-1">
              1) Upload para temporário (<code className="text-xs">/v1/upload-temp</code>) <br />
              2) Após criar, o sistema faz commit (<code className="text-xs">/v1/campanhas/:id/midias/commit-temp</code>).
            </div>
          </div>
        </div>
      </div>
    </StepCard>
  );
}
