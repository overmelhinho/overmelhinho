import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { useUploadTemp } from "@/hooks/useUploadTemp";
import { useCommitCampanhaMidiaTemp } from "@/hooks/useCampanhaMidias";

import {
  extractTempPathFromPublicUrl,
  normalizeTempPath,
} from "@/pages/campanhas/CampanhaDetails/utils/media";

type Slot = "desktop" | "mobile";

export default function MidiasUploadStep({
  campanhaId,
  defaultTipo = "banner",
}: {
  campanhaId: number;
  defaultTipo?: string;
}) {
  const uploadTemp = useUploadTemp();
  const commitTemp = useCommitCampanhaMidiaTemp(campanhaId);

  const [tipo, setTipo] = useState(defaultTipo);
  const [files, setFiles] = useState<{ desktop: File | null; mobile: File | null }>({
    desktop: null,
    mobile: null,
  });

  const busy = uploadTemp.isPending || commitTemp.isPending;

  const canDesktop = useMemo(() => !!tipo.trim() && !!files.desktop, [tipo, files.desktop]);
  const canMobile = useMemo(() => !!tipo.trim() && !!files.mobile, [tipo, files.mobile]);

  async function uploadAndCommit(slot: Slot) {
    if (!tipo.trim()) {
      toast.error("Informe o tipo da mídia (ex: banner).");
      return;
    }

    const file = slot === "desktop" ? files.desktop : files.mobile;
    if (!file) {
      toast.error(`Selecione o arquivo (${slot}).`);
      return;
    }

    const t = toast.loading(`Enviando (${slot})...`);
    try {
      // 1) upload-temp
      const up = await uploadTemp.mutateAsync([file]);
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

      // 2) commit-temp
      await commitTemp.mutateAsync({
        temp_path: tempPath,
        tipo: tipo.trim(),
        slot,
        status: "em_revisao",
        meta_json: {},
      });

      toast.dismiss(t);
      toast.success(`Mídia criada (${slot}).`);

      setFiles((s) => ({ ...s, [slot]: null }));
    } catch (e: any) {
      toast.dismiss(t);
      toast.error(e?.response?.data?.message || "Erro ao enviar/commit mídia.");
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
      <div className="mb-2 text-sm font-semibold text-gray-900">Upload de mídias</div>
      <div className="text-sm text-gray-600">
        Envia para <b>upload-temp</b> e cria via <b>commit-temp</b> (status:{" "}
        <b>em_revisao</b>). Publicar/ativar você faz no detalhe.
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="md:col-span-4">
          <label className="mb-1 block text-xs font-medium text-gray-600">Tipo</label>
          <input
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/5"
            placeholder="ex: banner"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            disabled={busy}
          />
          <div className="mt-1 text-xs text-gray-500">
            Mesmo tipo para desktop e mobile (recomendado).
          </div>
        </div>
        <div className="md:col-span-8" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Desktop */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-2 text-sm font-semibold text-gray-900">Desktop</div>

          <input
            type="file"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            onChange={(e) =>
              setFiles((s) => ({ ...s, desktop: e.target.files?.[0] || null }))
            }
            disabled={busy}
          />

          {files.desktop ? (
            <div className="mt-2 text-xs text-gray-600">{files.desktop.name}</div>
          ) : (
            <div className="mt-2 text-xs text-gray-500">Nenhum arquivo selecionado.</div>
          )}

          <button
            type="button"
            disabled={!canDesktop || busy}
            onClick={() => uploadAndCommit("desktop")}
            className="mt-3 w-full rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
          >
            {busy ? "Enviando..." : "Enviar Desktop"}
          </button>
        </div>

        {/* Mobile */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-2 text-sm font-semibold text-gray-900">Mobile</div>

          <input
            type="file"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            onChange={(e) =>
              setFiles((s) => ({ ...s, mobile: e.target.files?.[0] || null }))
            }
            disabled={busy}
          />

          {files.mobile ? (
            <div className="mt-2 text-xs text-gray-600">{files.mobile.name}</div>
          ) : (
            <div className="mt-2 text-xs text-gray-500">Nenhum arquivo selecionado.</div>
          )}

          <button
            type="button"
            disabled={!canMobile || busy}
            onClick={() => uploadAndCommit("mobile")}
            className="mt-3 w-full rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
          >
            {busy ? "Enviando..." : "Enviar Mobile"}
          </button>
        </div>
      </div>
    </div>
  );
}
