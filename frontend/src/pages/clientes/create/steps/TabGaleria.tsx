// /var/www/frontend/src/pages/clientes/create/steps/TabGaleria.tsx
import { useFormikContext } from "formik";
import { useState, useEffect } from "react";
import { ImagePlus, Trash2, GripVertical, Loader2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDebouncedCallback } from "use-debounce";
import axios from "@/services/api";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";

/**
 * 📸 TabGaleria com compressão REAL (WebP) + progresso de upload + drag & drop
 * Config final:
 * - Galeria: maxWidthOrHeight 1600, initialQuality 0.75, maxSizeMB 0.6, WebP
 * - PDF: não comprime, envia direto
 */
export default function TabGaleria() {
  const { values, setFieldValue } = useFormikContext<any>();
  const [imagens, setImagens] = useState<any[]>(values.galeria || []);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Sincroniza com Formik
  useEffect(() => {
    setFieldValue("galeria", imagens);
  }, [imagens, setFieldValue]);

  // 🧲 Sensores do DnD Kit
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  async function compressGallery(file: File): Promise<File> {
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: 1600,
      maxSizeMB: 0.6,
      initialQuality: 0.75,
      fileType: "image/webp",
      useWebWorker: true,
    });

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    return new File([compressed], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  }

  /**
   * 📤 Upload handler
   */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      // ✅ Compressão por arquivo (PDF passa direto)
      const finalFiles = await Promise.all(
        files.map(async (file) => {
          if (file.type === "application/pdf") return file;

          try {
            return await compressGallery(file);
          } catch (err) {
            console.warn("Erro ao comprimir imagem:", err);
            return file; // fallback
          }
        })
      );

      // Monta o FormData
      const formData = new FormData();
      finalFiles.forEach((file) => formData.append("files[]", file));

      const { data } = await axios.post("/v1/upload-temp", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          const percent = Math.round((evt.loaded * 100) / (evt.total || 1));
          setProgress(percent);
        },
      });

      if (data?.success && Array.isArray(data.files)) {
        const novas = data.files.map((file: any) => ({
          id: crypto.randomUUID(),
          url: file.public_url,
          // ✅ compatível futuro: se backend retornar thumb_url, usa; senão cai no url
          thumb_url: file.thumb_url || file.public_url,

          legenda: values?.nome_fantasia ? `Imagem de ${values.nome_fantasia}` : "",
          size:
            typeof file.size_kb === "number"
              ? `≈ ${Math.max(1, Math.round(file.size_kb))} KB`
              : file.size || "≈1 MB",
          temp: true,
          path: file.path,
          mime: file.mime,
          name: file.name,
        }));

        setImagens((prev) => [...prev, ...novas]);
        toast.success("Upload concluído!");
      } else {
        toast.error(data?.message || "Erro ao enviar imagens");
      }
    } catch (err) {
      console.error(err);
      toast.error("Falha no upload das imagens.");
    } finally {
      setUploading(false);
      setProgress(0);
      // ✅ permite reupload do mesmo arquivo
      e.target.value = "";
    }
  };

  // 🗑️ Remover imagem (somente local)
  const handleRemove = (id: string) => {
    setImagens((prev) => prev.filter((img) => img.id !== id));
  };

  // ✏️ Editar legenda (debounced)
  const handleLegendaChange = useDebouncedCallback(
    (id: string, legenda: string) => {
      setImagens((prev) =>
        prev.map((img) => (img.id === id ? { ...img, legenda } : img))
      );
    },
    400
  );

  // 🔄 Reordenar via drag
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active?.id && over?.id && active.id !== over.id) {
      const oldIndex = imagens.findIndex((img) => img.id === active.id);
      const newIndex = imagens.findIndex((img) => img.id === over.id);
      setImagens((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
        <ImagePlus className="w-5 h-5 text-[#B70F0A]" /> Galeria de Imagens
      </h3>

      <p className="text-sm text-gray-600">
        Adicione e organize as imagens antes de salvar o cliente.
      </p>

      {/* 📤 Área de Upload */}
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#B70F0A]/50 transition cursor-pointer bg-gray-50/50">
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          id="uploadInput"
          onChange={handleUpload}
          className="hidden"
        />

        <label
          htmlFor="uploadInput"
          className="cursor-pointer flex flex-col items-center text-sm text-gray-600"
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 text-[#B70F0A] animate-spin mb-1" />
              <span>Enviando arquivos...</span>

              <div className="w-48 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-2 bg-[#B70F0A] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className="text-xs text-gray-400 mt-1">
                {progress.toFixed(0)}%
              </span>
            </>
          ) : (
            <>
              <ImagePlus className="w-6 h-6 text-[#B70F0A] mb-1" />
              <span>Clique ou arraste arquivos aqui</span>
              <span className="text-xs text-gray-400">
                (imagens/pdfs • máx. 5MB cada)
              </span>
            </>
          )}
        </label>
      </div>

      {/* 🖼️ Galeria */}
      {imagens.length === 0 ? (
        <p className="text-sm text-gray-500 text-center mt-4">
          Nenhuma imagem adicionada ainda.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={imagens.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              {imagens.map((img) => (
                <SortableItem
                  key={img.id}
                  id={img.id}
                  img={img}
                  onRemove={handleRemove}
                  onLegendaChange={handleLegendaChange}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

/**
 * 🧩 Item individual com arrastar, legenda e excluir
 */
function SortableItem({
  id,
  img,
  onRemove,
  onLegendaChange,
}: {
  id: string;
  img: any;
  onRemove: (id: string) => void;
  onLegendaChange: (id: string, legenda: string) => void;
}) {
  const { setNodeRef, transform, transition, listeners, attributes, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : ("auto" as any),
    opacity: isDragging ? 0.85 : 1,
  };

  const isPdf =
    (typeof img?.mime === "string" && img.mime.includes("pdf")) ||
    (typeof img?.url === "string" && img.url.toLowerCase().includes(".pdf"));

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative border rounded-lg overflow-hidden bg-white shadow-sm"
    >
      <div
        {...listeners}
        className="absolute top-2 left-2 cursor-grab bg-white/90 rounded-md p-1 shadow-sm hover:bg-gray-100 active:cursor-grabbing"
        title="Arraste para reordenar"
      >
        <GripVertical className="w-4 h-4 text-gray-500" />
      </div>

      {!isPdf ? (
        <img
          src={img.url}
          alt={img.legenda || "Imagem"}
          className="object-cover w-full h-40 select-none pointer-events-none"
        />
      ) : (
        <div className="w-full h-40 flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
          PDF
        </div>
      )}

      <button
        type="button"
        onClick={() => onRemove(id)}
        className="absolute top-2 right-2 bg-white/90 text-[#B70F0A] p-1 rounded-full hover:bg-[#B70F0A] hover:text-white transition"
        title="Remover"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="p-2 border-t">
        <input
          type="text"
          defaultValue={img.legenda}
          placeholder="Legenda..."
          onChange={(e) => onLegendaChange(id, e.target.value)}
          className="w-full text-sm border rounded-md px-2 py-1 focus:ring-2 focus:ring-[#B70F0A] outline-none"
        />
        {img.size && (
          <span className="text-xs text-gray-400 mt-1 block">{img.size}</span>
        )}
      </div>
    </div>
  );
}
