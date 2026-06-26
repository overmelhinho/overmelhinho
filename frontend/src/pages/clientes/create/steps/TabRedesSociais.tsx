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
} from "lucide-react";

export default function TabRedesSociais() {
  const { values, setFieldValue } = useFormikContext<any>();

  // ─── Inicialização ───────────────────────────────────────────────────────────
  // Converte o formato legado { facebook, instagram, ... } para [{ tipo, url }]
  useEffect(() => {
    const raw = values.redes_sociais;

    // Se já vier no formato correto [{tipo, url}], não faz nada
    if (Array.isArray(raw) && raw.length > 0 && raw[0] && typeof raw[0] === "object" && "tipo" in raw[0]) {
      return;
    }

    // Formato legado: redes_sociais[0] = { facebook, instagram, ... }
    const legacyObj = Array.isArray(raw) && raw[0] && typeof raw[0] === "object" ? raw[0] : null;
    const legacyRoot = !raw || typeof raw !== "object" ? values : null;

    const source = legacyObj || legacyRoot || {};
    const normalizedKeys = ["facebook", "instagram", "linkedin", "youtube", "tiktok", "x"] as const;
    const normalized: { tipo: string; url: string }[] = [];

    for (const tipo of normalizedKeys) {
      const url = (source as any)[tipo];
      if (url && String(url).trim()) {
        normalized.push({ tipo, url: String(url).trim() });
      }
    }

    // Se não achou nada, inicializa com array vazio (formulário limpo)
    setFieldValue("redes_sociais", normalized.length > 0 ? normalized : []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const redes: { tipo: string; url: string }[] = Array.isArray(values.redes_sociais)
    ? values.redes_sociais.filter((r: any) => r && "tipo" in r)
    : [];

  const getByTipo = (tipo: string) =>
    redes.filter((r) => r.tipo === tipo).map((r) => r.url);

  const setTipoUrls = (tipo: string, urls: string[]) => {
    const others = redes.filter((r) => r.tipo !== tipo);
    const entries = urls.map((url) => ({ tipo, url }));
    setFieldValue("redes_sociais", [...others, ...entries]);
  };

  const updateSingle = (tipo: string, url: string) => {
    const idx = redes.findIndex((r) => r.tipo === tipo);
    const next = [...redes];
    if (idx >= 0) {
      next[idx] = { tipo, url };
    } else {
      next.push({ tipo, url });
    }
    setFieldValue("redes_sociais", next);
  };

  const handleOpenLink = (url: string) => {
    if (!url) return;
    const safe = url.startsWith("http") ? url : `https://${url}`;
    window.open(safe, "_blank", "noopener,noreferrer");
  };

  // ─── Campos fixos (1 por rede) ───────────────────────────────────────────────
  const FIXED_FIELDS = [
    { tipo: "facebook",  label: "Facebook",    placeholder: "https://facebook.com/empresa",  icon: Facebook  },
    { tipo: "linkedin",  label: "LinkedIn",     placeholder: "https://linkedin.com/empresa",  icon: Linkedin  },
    { tipo: "youtube",   label: "YouTube",      placeholder: "https://youtube.com/empresa",   icon: Youtube   },
    { tipo: "tiktok",    label: "TikTok",       placeholder: "https://tiktok.com/@empresa",   icon: Music2    },
    { tipo: "x",         label: "X (Twitter)",  placeholder: "https://x.com/empresa",         icon: Twitter   },
  ];

  // ─── Instagrams (múltiplos) ───────────────────────────────────────────────────
  const instagrams = getByTipo("instagram");
  // Garante pelo menos 1 campo visível
  const instagramList = instagrams.length > 0 ? instagrams : [""];

  const addInstagram = () => {
    setTipoUrls("instagram", [...instagrams, ""]);
  };

  const removeInstagram = (index: number) => {
    const next = instagrams.filter((_, i) => i !== index);
    setTipoUrls("instagram", next.length > 0 ? next : [""]);
  };

  const updateInstagram = (index: number, value: string) => {
    const next = [...instagramList];
    next[index] = value;
    setTipoUrls("instagram", next);
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

        {instagramList.map((url, idx) => (
          <div key={idx} className="relative flex items-center gap-2">
            <div className="flex-grow relative">
              <input
                type="text"
                value={url}
                onChange={(e) => updateInstagram(idx, e.target.value)}
                placeholder="https://instagram.com/empresa"
                className="border rounded-md px-3 py-2 w-full pr-10 focus:ring-2 focus:ring-[#B70F0A] outline-none transition"
              />
              {url && (
                <button
                  type="button"
                  onClick={() => handleOpenLink(url)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B70F0A] hover:text-[#8e0c08] transition"
                  title="Abrir link em nova aba"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Botão remover (só mostra se há mais de 1) */}
            {instagramList.length > 1 && (
              <button
                type="button"
                onClick={() => removeInstagram(idx)}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                title={`Remover Instagram ${idx + 1}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Índice (quando há mais de 1) */}
            {instagramList.length > 1 && (
              <span className="absolute -top-2 left-3 text-[10px] font-bold text-gray-400 bg-white px-1">
                Instagram {idx + 1}
              </span>
            )}
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

      {/* ─── Outras redes (campo único cada) ──────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {FIXED_FIELDS.map(({ tipo, label, placeholder, icon: Icon }) => {
          const urls = getByTipo(tipo);
          const value = urls[0] || "";

          return (
            <div key={tipo} className="relative flex items-center">
              <div className="flex-grow">
                <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[#B70F0A]" /> {label}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateSingle(tipo, e.target.value)}
                  placeholder={placeholder}
                  className="border rounded-md px-3 py-2 w-full pr-10 focus:ring-2 focus:ring-[#B70F0A] outline-none transition"
                />
              </div>
              {value && (
                <button
                  type="button"
                  onClick={() => handleOpenLink(value)}
                  className="absolute right-3 top-[38px] text-[#B70F0A] hover:text-[#8e0c08] transition"
                  title="Abrir link em nova aba"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
