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
} from "lucide-react";

interface SocialField {
  id: string;
  label: string;
  placeholder: string;
  icon: React.ElementType;
}

export default function TabRedesSociais() {
  const { values, handleChange, setFieldValue } = useFormikContext<any>();

  const redes: SocialField[] = [
    { id: "facebook", label: "Facebook", placeholder: "https://facebook.com/empresa", icon: Facebook },
    { id: "instagram", label: "Instagram", placeholder: "https://instagram.com/empresa", icon: Instagram },
    { id: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/empresa", icon: Linkedin },
    { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/empresa", icon: Youtube },
    { id: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@empresa", icon: Music2 },
    { id: "x", label: "X (Twitter)", placeholder: "https://x.com/empresa", icon: Twitter },
  ];

  // ✅ garante que redes_sociais[0] exista sempre
  useEffect(() => {
    const arr = Array.isArray(values.redes_sociais) ? values.redes_sociais : [];
    if (!arr[0] || typeof arr[0] !== "object") {
      setFieldValue("redes_sociais", [
        { facebook: "", instagram: "", linkedin: "", youtube: "", tiktok: "", x: "" },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenLink = (url: string) => {
    if (!url) return;
    const safeUrl = url.startsWith("http") ? url : `https://${url}`;
    window.open(safeUrl, "_blank", "noopener,noreferrer");
  };

  const obj = Array.isArray(values.redes_sociais) ? values.redes_sociais[0] : null;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
        <Facebook className="w-5 h-5 text-[#B70F0A]" /> Redes Sociais
      </h3>

      <p className="text-sm text-gray-600">
        Preencha os links das redes sociais. Se o link estiver preenchido, você
        pode testá-lo clicando no botão ao lado.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {redes.map(({ id, label, placeholder, icon: Icon }) => {
          const name = `redes_sociais[0].${id}`;
          const value = obj?.[id] || "";

          return (
            <div key={id} className="relative flex items-center">
              <div className="flex-grow">
                <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[#B70F0A]" /> {label}
                </label>

                <input
                  type="text"
                  name={name}
                  value={value}
                  onChange={handleChange}
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
