// /var/www/frontend/src/pages/campanhas/CampanhaDetails/components/MidiaUploadCard.tsx
import { useState } from "react";
import toast from "react-hot-toast";

import { useUploadTemp } from "@/hooks/useUploadTemp";
import {
  CampanhaMidiaSlot,
  CampanhaMidiaStatus,
  useCommitCampanhaMidiaTemp,
} from "@/hooks/useCampanhaMidias";

import {
  extractTempPathFromPublicUrl,
  normalizeTempPath,
} from "@/pages/campanhas/CampanhaDetails/utils/media";

function normalizeSlot(slot: any): CampanhaMidiaSlot | null {
  const s = String(slot ?? "").trim().toLowerCase();
  if (s === "desktop" || s === "mobile") return s as CampanhaMidiaSlot;
  return null;
}

export default function MidiaUploadCard({ campanhaId }: { campanhaId: number }) {
  const uploadTemp = useUploadTemp();
  const commitTemp = useCommitCampanhaMidiaTemp(campanhaId);

  const [upload, setUpload] = useState<{
    tipo: string;
    slot: CampanhaMidiaSlot;
    status: Exclude<CampanhaMidiaStatus, "publicado">;
    file: File | null;
  }>({
    tipo: "banner",
    slot: "desktop",
    status: "em_revisao",
    file: null,
  });

  async function onUploadAndCommit() {
    if (!upload.tipo.trim()) {
      toast.error("Informe o tipo da mídia (ex: banner).");
      return;
    }
    if (!upload.file) {
      toast.error("Selecione um arquivo.");
      return;
    }

    const safeSlot = normalizeSlot(upload.slot);
    if (!safeSlot) {
      toast.error('Slot inválido. Selecione "Desktop" ou "Mobile".');
      return;
    }

    // proteção extra: commit-temp não aceita publicado
    if ((upload.status as any) === "publicado") {
      toast.error('Status "publicado" não é permitido no commit-temp.');
      return;
    }

    const t = toast.loading("Enviando arquivo (temp)...");
    try {
      const up = await uploadTemp.mutateAsync([upload.file]);
      const first = up?.files?.[0];

      if (!first?.public_url && !first?.path) {
        toast.dismiss(t);
        toast.error(up?.message || "Falha no upload-temp.");
        return;
      }

      const tempPath =
        normalizeTempPath(first.path) ||
        normalizeTempPath(extractTempPathFromPublicUrl(first.public_url));

      if (!tempPath) {
        toast.dismiss(t);
        toast.error("Não consegui extrair temp_path do upload.");
        return;
      }

      toast.dismiss(t);
      const t2 = toast.loading("Criando mídia (commit-temp)...");

      await commitTemp.mutateAsync({
        temp_path: tempPath,
        tipo: upload.tipo.trim(),
        slot: safeSlot,
        status: upload.status,
        meta_json: {},
      });

      toast.dismiss(t2);
      toast.success("Mídia criada (commit-temp).");
      setUpload((u) => ({ ...u, file: null }));
    } catch (e: any) {
      toast.dismiss(t);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Erro ao enviar/commit mídia.";

      const slotErr = e?.response?.data?.errors?.slot?.[0];
      toast.error(slotErr ? `${msg} (${slotErr})` : msg);

      // eslint-disable-next-line no-console
      console.error("MIDIA_UPLOAD_COMMIT_FAIL:", e?.response?.data || e);
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="mb-2 text-xs font-semibold text-gray-700">
        Enviar mídia (upload-temp → commit-temp)
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="md:col-span-3">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Tipo
          </label>
          <input
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            placeholder="ex: banner"
            value={upload.tipo}
            onChange={(e) => setUpload((u) => ({ ...u, tipo: e.target.value }))}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Slot
          </label>
          <select
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            value={upload.slot}
            onChange={(e) =>
              setUpload((u) => ({
                ...u,
                slot: (e.target.value as any) as CampanhaMidiaSlot,
              }))
            }
          >
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Status inicial
          </label>
          <select
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            value={upload.status}
            onChange={(e) =>
              setUpload((u) => ({ ...u, status: e.target.value as any }))
            }
            title="Controller bloqueia criar diretamente como publicado"
          >
            <option value="rascunho">rascunho</option>
            <option value="em_revisao">em_revisao</option>
            <option value="aprovado">aprovado</option>
            <option value="reprovado">reprovado</option>
            <option value="arquivado">arquivado</option>
          </select>
          <div className="mt-1 text-[11px] text-gray-500">
            Publicado só via PATCH/PUT.
          </div>
        </div>

        <div className="md:col-span-4">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Arquivo
          </label>
          <input
            type="file"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            onChange={(e) =>
              setUpload((u) => ({ ...u, file: e.target.files?.[0] || null }))
            }
          />
          {upload.file ? (
            <div className="mt-1 text-xs text-gray-600">{upload.file.name}</div>
          ) : null}
        </div>

        <div className="md:col-span-12 flex items-center justify-end">
          <button
            disabled={uploadTemp.isPending || commitTemp.isPending}
            onClick={onUploadAndCommit}
            className="rounded-xl bg-[#B70F0A] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
          >
            {uploadTemp.isPending || commitTemp.isPending
              ? "Enviando..."
              : "Enviar mídia"}
          </button>
        </div>
      </div>
    </div>
  );
}
