// /var/www/frontend/src/pages/clientes/create/steps/TabMidia.tsx
import { useFormikContext } from "formik";
import { useEffect, useRef, useState } from "react";
import { FileText, Youtube, Upload, Eye, X } from "lucide-react";
import axios from "@/services/api";
import toast from "react-hot-toast";

type OEmbedResp = {
  title?: string;
  thumbnail_url?: string;
  author_name?: string;
};

function extractYoutubeId(link: string): string | null {
  if (!link) return null;

  // padrões comuns
  const m = link.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/
  );
  if (m?.[1]) return m[1];

  // fallback: tenta v=
  try {
    const u = new URL(link);
    const v = u.searchParams.get("v");
    if (v && v.length === 11) return v;
  } catch {}

  return null;
}

export default function TabMidia() {
  const { values, setFieldValue } = useFormikContext<any>();

  const [videoPreview, setVideoPreview] = useState<string | null>(null); // embed
  const [videoThumb, setVideoThumb] = useState<string | null>(null); // thumb
  const [videoTitle, setVideoTitle] = useState<string | null>(null);

  const [filePreview, setFilePreview] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // ✅ volta preview do vídeo (embed quando tem ID, senão thumb via oEmbed)
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

    // thumb + título via oEmbed (funciona para links de vídeo)
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

    return () => {
      alive = false;
    };
  }, [values.video_link]);

  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const v = values.arquivo_midia;
    if (!v) {
      setFilePreview(null);
      return;
    }

    if (typeof v === "string") {
      setFilePreview(v);
      return;
    }

    if (v instanceof File) {
      const url = URL.createObjectURL(v);
      objectUrlRef.current = url;
      setFilePreview(url);
      return;
    }

    setFilePreview(null);
  }, [values.arquivo_midia]);

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
    const maxSize = isPDF ? 10 * 1024 * 1024 : 5 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error(`Limite: ${isPDF ? "10MB (PDF)" : "5MB (imagem)"}`);
      e.target.value = "";
      return;
    }

    // UX: preview local imediato
    const localUrl = URL.createObjectURL(file);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = localUrl;
    setFilePreview(localUrl);

    setUploading(true);
    setProgress(0);

    try {
      const uploaded = await uploadTemp(file);

      // ✅ salva URL + PATH + MIME no Formik (para commit no backend)
      setFieldValue("arquivo_midia", uploaded.public_url);
      setFieldValue("arquivo_midia_path", uploaded.path || null);
      setFieldValue("arquivo_midia_mime", uploaded.mime || file.type || null);

      toast.success("Upload concluído!");
    } catch (error) {
      console.error(error);
      toast.error("Falha ao enviar arquivo.");
      setFilePreview(null);

      setFieldValue("arquivo_midia", null);
      setFieldValue("arquivo_midia_path", null);
      setFieldValue("arquivo_midia_mime", null);
    } finally {
      setUploading(false);
      setProgress(0);
      e.target.value = "";
    }
  };

  const tipos = [
    { id: "cardapio", label: "Cardápio" },
    { id: "portfolio", label: "Portfólio" },
    { id: "catalogo", label: "Catálogo" },
  ];

  const isPdfUrl = (url: string) => url.toLowerCase().includes(".pdf");

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
          <Youtube className="w-5 h-5 text-[#B70F0A]" /> Vídeo da Empresa
        </h3>

        <p className="text-sm text-gray-600 mb-2">
          Cole o link do vídeo do YouTube. A miniatura/player serão gerados automaticamente.
        </p>

        <input
          type="text"
          name="video_link"
          placeholder="Ex: https://youtu.be/abc123xyz99"
          value={values.video_link || ""}
          onChange={(e) => setFieldValue("video_link", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
        />

        {/* ✅ embed quando tem id */}
        {videoPreview && (
          <div className="mt-4 aspect-video rounded-lg overflow-hidden border shadow-sm">
            <iframe
              src={videoPreview}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Prévia do vídeo"
            />
          </div>
        )}

        {/* ✅ fallback thumb quando não dá embed (ou enquanto carrega) */}
        {!videoPreview && videoThumb && (
          <div className="mt-4 rounded-lg overflow-hidden border shadow-sm bg-white">
            <a
              href={values.video_link}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
              title="Abrir vídeo"
            >
              <img src={videoThumb} alt={videoTitle || "Miniatura do vídeo"} className="w-full" />
            </a>
            {videoTitle && (
              <div className="p-3 text-sm text-gray-700">
                <b>{videoTitle}</b>
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#B70F0A]" /> Materiais da Empresa
        </h3>

        <p className="text-sm text-gray-600 mb-2">
          Envie o arquivo do cardápio, portfólio ou catálogo (PDF ou imagem).
        </p>

        <div className="flex items-center gap-3 mb-4">
          {tipos.map((tipo) => (
            <button
              key={tipo.id}
              type="button"
              onClick={() => setFieldValue("tipo_arquivo_midia", tipo.id)}
              className={`px-4 py-2 rounded-md border text-sm font-medium transition ${
                values.tipo_arquivo_midia === tipo.id
                  ? "bg-[#B70F0A] text-white border-[#B70F0A]"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
              }`}
            >
              {tipo.label}
            </button>
          ))}
        </div>

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
            className="cursor-pointer flex items-center gap-2 border px-4 py-2 rounded-md text-sm bg-white hover:bg-gray-100 shadow-sm"
          >
            <Upload className="w-4 h-4 text-[#B70F0A]" /> Enviar arquivo
          </label>

          {values.arquivo_midia && !uploading && (
            <button
              type="button"
              onClick={() => {
                setFieldValue("arquivo_midia", null);
                setFieldValue("arquivo_midia_path", null);
                setFieldValue("arquivo_midia_mime", null);
                setFilePreview(null);
              }}
              className="flex items-center gap-1 text-red-600 text-sm hover:underline"
            >
              <X className="w-4 h-4" /> Remover arquivo
            </button>
          )}
        </div>

        {uploading && (
          <div className="mt-3 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-[#B70F0A] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2">Tamanho máximo: 10 MB (PDF) ou 5 MB (imagem)</p>

        {filePreview && !uploading && (
          <div className="mt-4 border rounded-lg p-3 bg-gray-50 flex flex-col items-center">
            {typeof values.arquivo_midia === "string" && isPdfUrl(values.arquivo_midia) ? (
              <div className="w-full">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <Eye className="w-4 h-4 text-[#B70F0A]" /> Prévia do PDF
                </div>
                <iframe
                  src={filePreview}
                  className="w-full h-[500px] rounded-md border"
                  title="Visualização de PDF"
                />
              </div>
            ) : (
              <img
                src={filePreview}
                alt="Prévia do arquivo"
                className="max-h-64 object-contain rounded-md"
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
