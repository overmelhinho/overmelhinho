// /var/www/frontend/src/pages/clientes/create/steps/TabLogotipo.tsx
import { useFormikContext } from "formik";
import { useEffect, useMemo, useRef, useState } from "react";
import UploadArea from "@/components/custom/UploadArea";
import imageCompression from "browser-image-compression";
import axios from "@/services/api";
import toast from "react-hot-toast";

type FormValues = {
  logotipo?: string | File | null;
  logotipo_path?: string | null;
  logotipo_mime?: string | null;
  remover_logotipo?: boolean;
};

async function compressLogo(file: File): Promise<File> {
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 500, // ✅ Logo no máximo 500px
    maxSizeMB: 0.18,
    initialQuality: 0.8,
    fileType: "image/webp",
    useWebWorker: true,
  });

  return new File([compressed], "logo.webp", {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

export default function TabLogotipo() {
  const { setFieldValue, values } = useFormikContext<FormValues>();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const localObjectUrlRef = useRef<string | null>(null);

  const logotipoValue = useMemo(() => values?.logotipo ?? null, [values?.logotipo]);

  // ✅ Mantém preview ao trocar de abas (string URL ou File)
  useEffect(() => {
    // limpa URL anterior (se era criada localmente)
    if (localObjectUrlRef.current) {
      URL.revokeObjectURL(localObjectUrlRef.current);
      localObjectUrlRef.current = null;
    }

    if (!logotipoValue) {
      setPreviewUrl(null);
      return;
    }

    if (typeof logotipoValue === "string") {
      setPreviewUrl(logotipoValue);
      return;
    }

    // File local
    const url = URL.createObjectURL(logotipoValue);
    localObjectUrlRef.current = url;
    setPreviewUrl(url);
  }, [logotipoValue]);

  // ✅ Cleanup geral
  useEffect(() => {
    return () => {
      if (localObjectUrlRef.current) {
        URL.revokeObjectURL(localObjectUrlRef.current);
        localObjectUrlRef.current = null;
      }
    };
  }, []);

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      setPreviewUrl(null);
      setFieldValue("logotipo", null);
      setFieldValue("logotipo_path", null);
      setFieldValue("logotipo_mime", null);
      setFieldValue("remover_logotipo", true);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // ✅ comprime de verdade (WebP)
      const optimized = await compressLogo(file);

      // ✅ preview imediato do arquivo otimizado
      if (localObjectUrlRef.current) URL.revokeObjectURL(localObjectUrlRef.current);
      const tempPreview = URL.createObjectURL(optimized);
      localObjectUrlRef.current = tempPreview;
      setPreviewUrl(tempPreview);

      // ✅ upload no mesmo endpoint do /upload-temp (igual galeria)
      const formData = new FormData();
      formData.append("files[]", optimized);

      const { data } = await axios.post("/v1/upload-temp", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          const percent = Math.round((evt.loaded * 100) / (evt.total || 1));
          setProgress(percent);
        },
      });

      if (data?.success && Array.isArray(data.files) && data.files[0]?.public_url) {
        const f = data.files[0];

        // ✅ salva como string (URL) no formik -> não some ao trocar de abas
        setFieldValue("logotipo", f.public_url);
        setFieldValue("logotipo_path", f.path || null);
        setFieldValue("logotipo_mime", f.mime || "image/webp");
        setFieldValue("remover_logotipo", false);

        toast.success("Logotipo enviado e otimizado!");
      } else {
        toast.error(data?.message || "Falha ao enviar logotipo.");
        // fallback: mantém o File no formik pra não perder
        setFieldValue("logotipo", optimized);
        setFieldValue("logotipo_mime", "image/webp");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao otimizar/enviar logotipo.");
      // fallback: mantém o arquivo original
      setFieldValue("logotipo", file);
      setFieldValue("logotipo_mime", file.type || null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block font-medium text-gray-700">Logotipo</label>

      <UploadArea
        name="logotipo"
        accept="image/*"
        maxSizeMB={5}
        onChange={handleFileChange}
      />

      {uploading && (
        <div className="w-full">
          <div className="mt-2 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-[#B70F0A] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{progress}%</p>
        </div>
      )}

      {previewUrl && (
        <div className="border rounded-lg p-3 bg-gray-50 flex justify-center">
          <img
            src={previewUrl}
            alt="Prévia"
            className="max-h-40 object-contain"
          />
        </div>
      )}
    </div>
  );
}
