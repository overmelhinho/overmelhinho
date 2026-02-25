import { useFormikContext } from "formik";
import { Clock, MapPin, RefreshCcw, Moon, Sun } from "lucide-react";
import axios from "@/services/api";
import toast from "react-hot-toast";
import { useState } from "react";

const DAYS = [
  { id: 1, label: "Segunda" },
  { id: 2, label: "Terça" },
  { id: 3, label: "Quarta" },
  { id: 4, label: "Quinta" },
  { id: 5, label: "Sexta" },
  { id: 6, label: "Sábado" },
  { id: 7, label: "Domingo" },
];

export default function TabHorarios() {
  const { values, setFieldValue } = useFormikContext<any>();
  const [loading, setLoading] = useState(false);

  // Garante todos os 7 dias presentes, sem valores pré-preenchidos
  const buildFullHorarios = (saved: any[]) =>
    DAYS.map(d => saved.find((x: any) => x.day === d.id) || { day: d.id, open: "", close: "", closed: true });

  const savedHorarios = Array.isArray(values.horario_atendimento) ? values.horario_atendimento : [];
  const horarios = buildFullHorarios(savedHorarios);

  const updateDay = (dayId: number, field: string, value: any) => {
    const next = buildFullHorarios(savedHorarios).map((h: any) =>
      h.day === dayId ? { ...h, [field]: value } : h
    );
    setFieldValue("horario_atendimento", next);
  };

  const handleImport = async () => {
    if (!values.nome_fantasia) {
      toast.error("Preencha o nome da empresa primeiro.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get("/v1/clientes/google-hours", {
        params: {
          nome: values.nome_fantasia,
          cidade: values.cidade || values.cidade_preferida || ""
        }
      });

      if (data.success && data.horarios) {
        setFieldValue("horario_atendimento", data.horarios);
        toast.success("Horários importados do Google Maps!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Não foi possível importar os horários.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#B70F0A]" /> Horário de Atendimento
        </h3>

        <button
          type="button"
          onClick={handleImport}
          disabled={loading}
          className="text-xs px-4 py-2 bg-white border border-[#B70F0A] text-[#B70F0A] hover:bg-[#B70F0A] hover:text-white rounded-lg flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
        >
          {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          Importar do Google Maps
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Dia</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Abertura</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Fechamento</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {DAYS.map((day) => {
              const h = horarios.find((x: any) => x.day === day.id) || { open: "", close: "", closed: true };

              return (
                <tr key={day.id} className={h.closed ? "bg-gray-50/50" : "bg-white"}>
                  <td className="px-4 py-3 font-medium text-gray-900">{day.label}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => updateDay(day.id, "closed", !h.closed)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${h.closed
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "bg-green-100 text-green-700 border border-green-200"
                        }`}
                    >
                      {h.closed ? "Fechado" : "Aberto"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="relative inline-block">
                      <Sun className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500" />
                      <input
                        type="time"
                        value={h.open}
                        disabled={h.closed}
                        onChange={(e) => updateDay(day.id, "open", e.target.value)}
                        className="pl-7 pr-2 py-1 border rounded-md focus:ring-1 focus:ring-[#B70F0A] disabled:opacity-50 text-sm"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="relative inline-block">
                      <Moon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-500" />
                      <input
                        type="time"
                        value={h.close}
                        disabled={h.closed}
                        onChange={(e) => updateDay(day.id, "close", e.target.value)}
                        className="pl-7 pr-2 py-1 border rounded-md focus:ring-1 focus:ring-[#B70F0A] disabled:opacity-50 text-sm"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
        <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
        <p>Os horários configurados aqui serão exibidos no seu perfil público. Certifique-se de mantê-los atualizados.</p>
      </div>
    </div>
  );
}
