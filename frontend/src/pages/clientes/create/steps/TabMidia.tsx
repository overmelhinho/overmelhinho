// /var/www/frontend/src/pages/clientes/create/steps/TabMidia.tsx
import { useFormikContext } from "formik";
import { useEffect, useRef, useState } from "react";
import { FileText, Youtube, Upload, Eye, X, Link as LinkIcon, FileUp } from "lucide-react";
import axios from "@/services/api";
import toast from "react-hot-toast";

type OEmbedResp = {
  title?: string;
  thumbnail_url?: string;
  author_name?: string;
};

function extractYoutubeId(link: string): string | null {
  if (!link) return null;
  const m = link.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/
  );
  if (m?.[1]) return m[1];
  try {
    const u = new URL(link);
    const v = u.searchParams.get("v");
    if (v && v.length === 11) return v;
  } catch { }
  return null;
}

export default function TabMidia() {
  const { values, setFieldValue } = useFormikContext<any>();

  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoThumb, setVideoThumb] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);

  const [filePreview, setFilePreview] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Default type if not set
  useEffect(() => {
    if (!values.tipo_material) {
      setFieldValue("tipo_material", "file");
    }
  }, [values.tipo_material, setFieldValue]);

  // Video Preview Logic
  useEffect(() => {
    let alive = true;
    const link = (values.video_link || "").trim();
    if (!link) {
      setVideoPreview(null);
      setVideoThumb(null);
      setVideoTitle(null);
      return;
    }

    const id = extractYoutubeId(link);
    setVideoPreview(id ? `https://www.youtube.com/embed/${id}` : null);

    (async () => {
      try {
        const resp = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(link)}&format=json`
        );
        if (!resp.ok) throw new Error("oEmbed failed");
        const data = (await resp.json()) as OEmbedResp;
        if (!alive) return;
        setVideoThumb(data?.thumbnail_url || null);
        setVideoTitle(data?.title || null);
      } catch {
        if (!alive) return;
        setVideoThumb(null);
        setVideoTitle(null);
      }
    })();
    return () => { alive = false; };
  }, [values.video_link]);

  // File Preview Logic
  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    const v = values.arquivo_midia;
    if (!v || values.tipo_material === 'link') {
      setFilePreview(null);
      return;
    }
    if (typeof v === "string" && (v.startsWith("http") || v.startsWith("/storage"))) {
      setFilePreview(v);
      return;
    }
    setFilePreview(null);
  }, [values.arquivo_midia, values.tipo_material]);

  const uploadTemp = async (file: File) => {
    const formData = new FormData();
    formData.append("files[]", file);
    const { data } = await axios.post("/v1/upload-temp", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
        }
      },
    });
    if (!data?.success || !data?.files?.length) {
      throw new Error(data?.message || "Falha no upload");
    }
    return data.files[0];
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPDF = file.type === "application/pdf";
    const maxSize = 10 * 1024 * 1024; // 10MB para todos agora conforme solicitado
    if (file.size > maxSize) {
      toast.error(`Limite de 10MB excedido.`);
      e.target.value = "";
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const uploaded = await uploadTemp(file);
      setFieldValue("arquivo_midia", uploaded.public_url);
      setFieldValue("arquivo_midia_path", uploaded.path || null);
      setFieldValue("arquivo_midia_mime", uploaded.mime || file.type || null);
      toast.success("Upload concluído!");
    } catch (error) {
      console.error(error);
      toast.error("Falha ao enviar arquivo.");
      setFieldValue("arquivo_midia", null);
    } finally {
      setUploading(false);
      setProgress(0);
      e.target.value = "";
    }
  };

  const isPdfUrl = (url: string) => url?.toLowerCase().includes(".pdf");

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
          <Youtube className="w-5 h-5 text-[#B70F0A]" /> Vídeo da Empresa
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          Cole o link do vídeo do YouTube.
        </p>
        <input
          type="text"
          name="video_link"
          placeholder="Ex: https://youtu.be/abc123xyz99"
          value={values.video_link || ""}
          onChange={(e) => setFieldValue("video_link", e.target.value)}
          className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
        />
        {videoPreview && (
          <div className="mt-4 aspect-video rounded-lg overflow-hidden border shadow-sm">
            <iframe src={videoPreview} className="w-full h-full" allowFullScreen title="Prévia do vídeo" />
          </div>
        )}
      </section>

      <section className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
        <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[#B70F0A]" /> Materiais da Empresa
        </h3>

        <div className="flex flex-col gap-6">
          {/* Toggle de Tipo */}
          <div className="flex bg-white p-1 rounded-xl border w-fit shadow-sm">
            <button
              type="button"
              onClick={() => setFieldValue("tipo_material", "file")}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${values.tipo_material === "file"
                  ? "bg-[#B70F0A] text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              <FileUp className="w-4 h-4" /> Arquivo (PDF/IMG)
            </button>
            <button
              type="button"
              onClick={() => setFieldValue("tipo_material", "link")}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${values.tipo_material === "link"
                  ? "bg-[#B70F0A] text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              <LinkIcon className="w-4 h-4" /> Link Externo (URL)
            </button>
          </div>

          {values.tipo_material === "file" ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  id="arquivoUpload"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="arquivoUpload"
                  className="cursor-pointer flex items-center gap-2 border-2 border-dashed border-gray-300 px-8 py-4 rounded-xl text-sm bg-white hover:border-[#B70F0A] hover:bg-red-50 transition-all group w-full sm:w-auto text-center justify-center"
                >
                  <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#B70F0A]" />
                  <span className="font-semibold text-gray-600 group-hover:text-[#B70F0A]">Escolher Arquivo</span>
                </label>

                {values.arquivo_midia && !uploading && (
                  <button
                    type="button"
                    onClick={() => {
                      setFieldValue("arquivo_midia", null);
                      setFieldValue("arquivo_midia_path", null);
                      setFieldValue("arquivo_midia_mime", null);
                    }}
                    className="text-red-600 text-sm hover:underline flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Remover
                  </button>
                )}
              </div>

              {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full bg-[#B70F0A] transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}

              {filePreview && (
                <div className="border rounded-xl p-2 bg-white shadow-sm overflow-hidden">
                  {isPdfUrl(values.arquivo_midia) ? (
                    <iframe src={filePreview} className="w-full h-[400px]" title="PDF Preview" />
                  ) : (
                    <img src={filePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">URL do Material</label>
              <input
                type="url"
                placeholder="https://exemplo.com/seu-cardapio-online"
                value={values.arquivo_midia || ""}
                onChange={(e) => setFieldValue("arquivo_midia", e.target.value)}
                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#B70F0A] transition-all shadow-sm"
              />
              <p className="text-xs text-gray-500">Insira o link completo do seu material digital.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
