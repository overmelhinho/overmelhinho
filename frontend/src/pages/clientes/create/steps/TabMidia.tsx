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
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || error.message || "Falha ao enviar arquivo.";
      toast.error(msg);
      setFieldValue("arquivo_midia", null);
    } finally {
      setUploading(false);
      setProgress(0);
      e.target.value = "";
    }
  };

  const isPdfUrl = (url: string) => url?.toLowerCase().includes(".pdf");

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error(`Limite de 2MB excedido.`);
      e.target.value = "";
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append("files[]", file);
      const { data } = await axios.post("/v1/upload-temp", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploaded = data.files[0];
      setFieldValue("banner", uploaded.public_url);
      setFieldValue("banner_path", uploaded.path || null);
      toast.success("Capa enviada!");
    } catch (error) {
      toast.error("Falha ao enviar capa.");
    } finally {
      setUploading(false);
      setProgress(0);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-8">
      {/* 🖼️ CAPA SECTION */}
      <section className="p-6 bg-red-50/30 rounded-2xl border border-red-100">
        <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2 mb-2">
          <Upload className="w-5 h-5 text-[#B70F0A]" /> Capa
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border text-sm text-gray-600 space-y-2">
              <p className="font-semibold text-gray-800">📏 Dimensões Ideais:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Resolução sugerida: <b>1920 x 700 px</b></li>
                <li>Proporção: <b>3:1</b></li>
                <li>Área de foco: <b>Centro da imagem</b></li>
                <li>Tamanho máx: <b>2MB</b> (WebP recomendado)</li>
              </ul>
              <p className="text-xs italic bg-amber-50 p-2 rounded border border-amber-100 mt-2">
                <b>Dica:</b> Mantenha o conteúdo principal centralizado. Evite textos na parte inferior, pois serão cobertos pelo box do perfil.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                id="bannerUpload"
                className="hidden"
                onChange={handleBannerUpload}
              />
              <label
                htmlFor="bannerUpload"
                className="cursor-pointer flex items-center gap-2 bg-[#B70F0A] text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" /> Enviar Capa
              </label>

              {values.banner && (
                <button
                  type="button"
                  onClick={() => {
                    setFieldValue("banner", null);
                    setFieldValue("banner_path", null);
                  }}
                  className="text-red-500 text-sm font-medium hover:underline flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Remover
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prévia da Capa</span>
            <div className="aspect-[3/1] bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center relative group">
              {values.banner ? (
                <img src={values.banner} alt="Capa Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <Eye className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Nenhuma capa selecionada</p>
                </div>
              )}
              {uploading && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-white text-sm font-bold animate-pulse">Enviando...</div>
                  </div>
              )}
            </div>
          </div>
        </div>
      </section>

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
          {/* Que tipo de material é */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Tipo de Documento</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 border rounded-xl hover:bg-red-50 transition-all">
                <input
                  type="radio"
                  name="tipo_arquivo_midia"
                  value="catalogo"
                  checked={values.tipo_arquivo_midia === "catalogo" || !values.tipo_arquivo_midia}
                  onChange={(e) => setFieldValue("tipo_arquivo_midia", e.target.value)}
                  className="accent-[#B70F0A]"
                />
                <span className="text-sm font-medium">Catálogo & Preços</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 border rounded-xl hover:bg-red-50 transition-all">
                <input
                  type="radio"
                  name="tipo_arquivo_midia"
                  value="portfolio"
                  checked={values.tipo_arquivo_midia === "portfolio"}
                  onChange={(e) => setFieldValue("tipo_arquivo_midia", e.target.value)}
                  className="accent-[#B70F0A]"
                />
                <span className="text-sm font-medium">Portfólio / Apresentação</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 border rounded-xl hover:bg-red-50 transition-all">
                <input
                  type="radio"
                  name="tipo_arquivo_midia"
                  value="cardapio"
                  checked={values.tipo_arquivo_midia === "cardapio"}
                  onChange={(e) => setFieldValue("tipo_arquivo_midia", e.target.value)}
                  className="accent-[#B70F0A]"
                />
                <span className="text-sm font-medium">Cardápio</span>
              </label>
            </div>
          </div>

          <div className="h-px bg-gray-200 my-2" />

          {/* Toggle de Tipo Fisico ou Virtual */}
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
