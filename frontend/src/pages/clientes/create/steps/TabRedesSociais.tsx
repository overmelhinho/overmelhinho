import { useFormikContext } from "formik";
import { useEffect } from "react";
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Music2,
  Twitter,
  ExternalLink,
  Plus,
  X,
  Globe,
} from "lucide-react";

export default function TabRedesSociais() {
  const { values, setFieldValue } = useFormikContext<any>();

  // ─── Inicialização ─────────────────────────────────────────────────────────
  useEffect(() => {
    const raw = values.redes_sociais;

    // Já no formato [{tipo, url, label?}] → não mexe
    if (Array.isArray(raw) && raw.length > 0 && raw[0] && typeof raw[0] === "object" && "tipo" in raw[0]) {
      return;
    }

    // Formato legado: redes_sociais[0] = { facebook, instagram, ... }
    const legacyObj = Array.isArray(raw) && raw[0] && typeof raw[0] === "object" ? raw[0] : null;
    const source = legacyObj || {};
    const normalizedKeys = ["facebook", "instagram", "linkedin", "youtube", "tiktok", "x", "website"] as const;
    const normalized: { tipo: string; url: string; label: string }[] = [];

    for (const tipo of normalizedKeys) {
      const url = (source as any)[tipo];
      if (url && String(url).trim()) {
        normalized.push({ tipo, url: String(url).trim(), label: "" });
      }
    }

    setFieldValue("redes_sociais", normalized.length > 0 ? normalized : []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  type Rede = { tipo: string; url: string; label: string };

  const redes: Rede[] = Array.isArray(values.redes_sociais)
    ? values.redes_sociais.filter((r: any) => r && "tipo" in r)
    : [];

  const getByTipo = (tipo: string): Rede[] =>
    redes.filter((r) => r.tipo === tipo);

  const setTipoRedes = (tipo: string, entries: Rede[]) => {
    const others = redes.filter((r) => r.tipo !== tipo);
    setFieldValue("redes_sociais", [...others, ...entries]);
  };

  const updateSingle = (tipo: string, url: string) => {
    const idx = redes.findIndex((r) => r.tipo === tipo);
    const next = [...redes];
    if (idx >= 0) {
      next[idx] = { ...next[idx], url };
    } else {
      next.push({ tipo, url, label: "" });
    }
    setFieldValue("redes_sociais", next);
  };

  const handleOpenLink = (url: string) => {
    if (!url) return;
    const safe = url.startsWith("http") ? url : `https://${url}`;
    window.open(safe, "_blank", "noopener,noreferrer");
  };

  // ─── Campos fixos (1 por rede) ─────────────────────────────────────────────
  const FIXED_FIELDS = [
    { tipo: "facebook",  label: "Facebook",    placeholder: "https://facebook.com/empresa",     icon: Facebook  },
    { tipo: "linkedin",  label: "LinkedIn",     placeholder: "https://linkedin.com/empresa",     icon: Linkedin  },
    { tipo: "youtube",   label: "YouTube",      placeholder: "https://youtube.com/empresa",      icon: Youtube   },
    { tipo: "tiktok",    label: "TikTok",       placeholder: "https://tiktok.com/@empresa",      icon: Music2    },
    { tipo: "x",         label: "X (Twitter)",  placeholder: "https://x.com/empresa",            icon: Twitter   },
    { tipo: "website",   label: "Website",      placeholder: "https://www.seusite.com.br",       icon: Globe     },
  ];

  // ─── Instagrams (múltiplos) ─────────────────────────────────────────────────
  const instagrams = getByTipo("instagram");
  const instagramList: Rede[] = instagrams.length > 0 ? instagrams : [{ tipo: "instagram", url: "", label: "" }];

  const addInstagram = () => {
    setTipoRedes("instagram", [...instagrams, { tipo: "instagram", url: "", label: "" }]);
  };

  const removeInstagram = (index: number) => {
    const next = instagrams.filter((_, i) => i !== index);
    setTipoRedes("instagram", next.length > 0 ? next : [{ tipo: "instagram", url: "", label: "" }]);
  };

  const updateInstagram = (index: number, field: "url" | "label", value: string) => {
    const next = [...instagramList];
    next[index] = { ...next[index], [field]: value };
    setTipoRedes("instagram", next);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
        <Facebook className="w-5 h-5 text-[#B70F0A]" /> Redes Sociais
      </h3>

      <p className="text-sm text-gray-600">
        Preencha os links das redes sociais. Se o link estiver preenchido, você
        pode testá-lo clicando no botão ao lado.
      </p>

      {/* ─── Instagram (múltiplos) ─────────────────────────────── */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <Instagram className="w-4 h-4 text-[#B70F0A]" />
          Instagram
        </label>

        {instagramList.map((entry, idx) => (
          <div
            key={idx}
            className="relative border rounded-xl p-3 space-y-2 bg-gray-50"
          >
            {/* Cabeçalho da entrada */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Instagram {instagramList.length > 1 ? idx + 1 : ""}
              </span>
              {instagramList.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInstagram(idx)}
                  className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Remover"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Label / Identificador */}
            <div>
              <input
                type="text"
                value={entry.label || ""}
                onChange={(e) => updateInstagram(idx, "label", e.target.value)}
                placeholder='Identificador, ex: "Principal", "Comercial", "Chef"'
                className="border rounded-md px-3 py-1.5 w-full text-sm focus:ring-2 focus:ring-[#B70F0A] outline-none transition bg-white"
              />
              <p className="text-[10px] text-gray-400 mt-1 ml-1">
                Este nome aparece no perfil público (badge no ícone)
              </p>
            </div>

            {/* URL */}
            <div className="relative">
              <input
                type="text"
                value={entry.url || ""}
                onChange={(e) => updateInstagram(idx, "url", e.target.value)}
                placeholder="https://instagram.com/empresa"
                className="border rounded-md px-3 py-2 w-full pr-10 focus:ring-2 focus:ring-[#B70F0A] outline-none transition bg-white"
              />
              {entry.url && (
                <button
                  type="button"
                  onClick={() => handleOpenLink(entry.url)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B70F0A] hover:text-[#8e0c08] transition"
                  title="Abrir link"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Botão Adicionar */}
        <button
          type="button"
          onClick={addInstagram}
          className="flex items-center gap-2 text-sm font-semibold text-[#B70F0A] hover:text-[#8e0c08] transition mt-1"
        >
          <Plus className="w-4 h-4" />
          Adicionar outro Instagram
        </button>
      </div>

      {/* ─── Outras redes (campo único cada) ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {FIXED_FIELDS.map(({ tipo, label, placeholder, icon: Icon }) => {
          const list = getByTipo(tipo);
          const value = list[0]?.url || "";

          return (
            <div key={tipo} className="relative flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Icon className="w-4 h-4 text-[#B70F0A]" /> {label}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateSingle(tipo, e.target.value)}
                  placeholder={placeholder}
                  className="border rounded-md px-3 py-2 w-full pr-10 focus:ring-2 focus:ring-[#B70F0A] outline-none transition"
                />
                {value && (
                  <button
                    type="button"
                    onClick={() => handleOpenLink(value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B70F0A] hover:text-[#8e0c08] transition"
                    title="Abrir link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
