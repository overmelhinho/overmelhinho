import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, CheckCircle2, Building2, Phone, ArrowLeft, Loader2 } from "lucide-react";
import api from "@/services/api";

export default function ClienteExpress() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    nome_fantasia: "",
    telefone: "",
  });
  
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);

      // Compress and convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Qualidade 0.7 para reduzir tamanho (gera um JPEG base64)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setPhotoBase64(dataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, "");
    if (raw.length <= 10) {
      return raw.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return raw.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const handleSave = async () => {
    if (!form.nome_fantasia || !form.telefone) return;
    
    setLoading(true);
    try {
      // Criação rápida no Kanban de Leads
      await api.post("/v1/leads", {
        nome: form.nome_fantasia,
        telefone: form.telefone,
        origem: "App Mobile (Vendedor na Rua)",
        foto_fachada: photoBase64,
      });
      
      setSuccess(true);
      setTimeout(() => navigate("/leads-kanban"), 2000);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar o cliente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 size={80} className="text-green-500 mb-6 animate-bounce" />
        <h1 className="text-3xl font-black text-green-900 mb-2">Lead Capturado!</h1>
        <p className="text-green-700 font-medium">O escritório já foi notificado e vai dar andamento.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white px-4 py-4 flex items-center gap-3 border-b shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
          <ArrowLeft size={24} className="text-slate-700" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Novo Contato Rápido</h1>
      </header>

      <div className="flex-1 p-4 md:p-8 max-w-lg mx-auto w-full">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Building2 size={18} className="text-red-500" /> Nome do Estabelecimento
            </label>
            <input
              type="text"
              value={form.nome_fantasia}
              onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })}
              className="w-full text-lg p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-bold placeholder:font-normal placeholder:text-slate-300"
              placeholder="Ex: Padaria do João"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Phone size={18} className="text-red-500" /> WhatsApp / Telefone
            </label>
            <input
              type="tel"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: formatPhone(e.target.value) })}
              maxLength={15}
              className="w-full text-lg p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-bold placeholder:font-normal placeholder:text-slate-300"
              placeholder="(54) 99999-9999"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Camera size={18} className="text-red-500" /> Foto da Fachada (Opcional)
            </label>
            
            {!photoUrl ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-slate-100 hover:border-slate-300 transition-all"
              >
                <Camera size={32} />
                <span className="font-medium text-sm">Tirar Foto</span>
              </button>
            ) : (
              <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-slate-200">
                <img src={photoUrl} className="w-full h-full object-cover" alt="Fachada" />
                <button
                  onClick={() => setPhotoUrl(null)}
                  className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-sm font-bold px-3 py-1.5 rounded-lg shadow-sm"
                >
                  Refazer Foto
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handlePhotoCapture}
              className="hidden"
            />
          </div>

        </div>

        <button
          onClick={handleSave}
          disabled={!form.nome_fantasia || !form.telefone || loading}
          className="w-full mt-8 bg-red-600 disabled:bg-slate-300 text-white font-black text-lg py-5 rounded-3xl shadow-xl hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:shadow-none"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            <>Salvar Contato Rápido <CheckCircle2 size={24} /></>
          )}
        </button>

      </div>
    </div>
  );
}
