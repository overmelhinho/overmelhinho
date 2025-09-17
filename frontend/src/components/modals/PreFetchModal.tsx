import { useState } from "react";
import axios from "@/services/api";
import toast from "react-hot-toast";

const cidadesSerra = [
  "André da Rocha", "Antônio Prado", "Bento Gonçalves", "Bom Jesus", "Cambará do Sul",
  "Carlos Barbosa", "Caxias do Sul", "Cotiporã", "Farroupilha", "Flores da Cunha",
  "Garibaldi", "Gramado", "Nova Araçá", "Nova Bassano", "Nova Pádua",
  "Nova Petrópolis", "Nova Prata", "Nova Roma do Sul", "Pinto Bandeira", "Protásio Alves",
  "São Francisco de Paula", "São José dos Ausentes", "São Marcos", "Veranópolis"
];

interface Props {
  nomeInicial: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dados: Record<string, string>) => void;
}

export default function PreFetchModal({ nomeInicial, isOpen, onClose, onConfirm }: Props) {
  const [cidade, setCidade] = useState("");
  const [loading, setLoading] = useState(false);
  const [sugestoes, setSugestoes] = useState<Record<string, string>>({});

  const buscar = async () => {
    if (!cidade) return toast.error("Selecione uma cidade.");
    setLoading(true);
    try {
    const query = `${nome} ${cidade}`;
      const { data } = await axios.get("/v1/lead-intel/fetch", {
        params: {
          query,
          location: "-29.2244,-51.3409", // região da Serra Gaúcha (Caxias do Sul)
          radius: 80000, // ~80 km de raio
        },
      });
      if (data?.dados) {
        setSugestoes(data.dados);
        toast.success("Sugestões encontradas!");
      } else {
        toast.error("Nenhum resultado no IA.");
      }
    } catch {
      toast.error("Erro na busca com IA.");
    } finally {
      setLoading(false);
    }
  };

  const confirmarUso = () => {
    const camposSelecionados: Record<string, string> = {};
    Object.entries(sugestoes).forEach(([k, v]) => v && (camposSelecionados[k] = v));
    onConfirm(camposSelecionados);
    onClose();
  };


  const [nome, setNome] = useState(nomeInicial || "");


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">Buscar Dados com IA</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Nome</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)}   className="w-full border rounded px-3 py-2"/>

        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Cidade</label>
          <select value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="">-- Selecione --</option>
            {cidadesSerra.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button onClick={buscar} disabled={loading || !cidade} className="bg-[#B70F0A] text-white px-4 py-2 rounded">
          {loading ? "Buscando..." : "Buscar com IA"}
        </button>

        {Object.keys(sugestoes).length > 0 && (
          <div className="mt-6 space-y-3 max-h-[300px] overflow-y-auto">
            {Object.entries(sugestoes).map(([campo, valor]) => (
              <div key={campo}>
                <label className="block text-sm font-semibold capitalize">{campo.replace(/_/g, " ")}</label>
                <input className="w-full border rounded px-2 py-1" value={valor} readOnly />
              </div>
            ))}
            <button onClick={confirmarUso} className="mt-4 bg-green-600 text-white px-4 py-2 rounded">
              Usar dados sugeridos
            </button>
          </div>
        )}

        <button onClick={onClose} className="mt-6 text-sm underline text-gray-600">Cancelar</button>
      </div>
    </div>
  );
}
