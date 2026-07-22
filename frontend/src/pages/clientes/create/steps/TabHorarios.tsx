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
    DAYS.map(d => saved.find((x: any) => x.day === d.id) || { day: d.id, open: "", close: "", open2: "", close2: "", closed: true });

  const savedHorarios = Array.isArray(values.horario_atendimento) ? values.horario_atendimento : [];
  const horarios = buildFullHorarios(savedHorarios);

  const updateDay = (dayId: number, field: string, value: any) => {
    const next = buildFullHorarios(savedHorarios).map((h: any) =>
      h.day === dayId ? { ...h, [field]: value } : h
    );
    setFieldValue("horario_atendimento", next);
  };

  const replicateToAll = (dayId: number) => {
    const source = buildFullHorarios(savedHorarios).find((h: any) => h.day === dayId);
    if (!source) return;

    const next = DAYS.map(d => ({
      ...source,
      day: d.id
    }));
    setFieldValue("horario_atendimento", next);
    toast.success("Horário replicado para todos os dias!");
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

  const handleImportLegacy = async () => {
    if (!values.legacy_horario) {
      toast.error("Este cliente não possui um horário legado.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post("/v1/clientes/parse-legacy-horario", {
        texto: values.legacy_horario
      });

      if (data.success && data.horarios && data.horarios.length > 0) {
        setFieldValue("horario_atendimento", data.horarios);
        toast.success("Horários extraídos com sucesso pela IA!");
      } else {
        toast.error("A IA não conseguiu interpretar o texto.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao processar horário legado.");
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

        <div className="flex items-center gap-2">
          {values.legacy_horario && (
            <button
              type="button"
              onClick={handleImportLegacy}
              disabled={loading}
              className="text-xs px-4 py-2 bg-white border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <span className="text-sm">🤖</span>}
              Importar Horário Antigo (IA)
            </button>
          )}

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
      </div>

      {values.legacy_horario && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 rounded-xl flex flex-col gap-1">
          <span className="font-bold">Texto Legado (Anotação Antiga):</span>
          <span>{values.legacy_horario}</span>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between shadow-sm cursor-pointer hover:bg-blue-100 transition-colors mb-4" onClick={() => setFieldValue("is_horario_marcado", !values.is_horario_marcado)}>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-blue-900 cursor-pointer">Atendimento exclusivo com horário marcado / agendamento</label>
          <span className="text-xs text-blue-700">Oculta a tabela de dias e exibe o selo 'COM HORÁRIO MARCADO' no perfil do cliente.</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={values.is_horario_marcado || false}
            onChange={(e) => setFieldValue("is_horario_marcado", e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded border-blue-300 focus:ring-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {!values.is_horario_marcado && (
        <>
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Dia</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">1º Turno (Abre/Fecha)</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">2º Turno (Abre/Fecha)</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {DAYS.map((day) => {
              const h = horarios.find((x: any) => x.day === day.id) || { open: "", close: "", open2: "", close2: "", closed: true };

              return (
                <tr key={day.id} className={h.closed ? "bg-gray-50/50" : "bg-white hover:bg-slate-50/50 transition-colors"}>
                  <td className="px-4 py-3 font-bold text-gray-900">{day.label}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => updateDay(day.id, "closed", !h.closed)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${h.closed
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "bg-green-100 text-green-700 border border-green-200"
                        }`}
                    >
                      {h.closed ? "Fechado" : "Aberto"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="relative">
                        <Sun className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-500" />
                        <input
                          type="time"
                          value={h.open || ""}
                          disabled={h.closed}
                          onChange={(e) => updateDay(day.id, "open", e.target.value)}
                          className="pl-7 pr-2 py-1.5 border rounded-lg focus:ring-1 focus:ring-[#B70F0A] disabled:opacity-50 text-xs font-bold bg-white w-28"
                        />
                      </div>
                      <span className="text-gray-400">às</span>
                      <div className="relative">
                        <Moon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-500" />
                        <input
                          type="time"
                          value={h.close || ""}
                          disabled={h.closed}
                          onChange={(e) => updateDay(day.id, "close", e.target.value)}
                          className="pl-7 pr-2 py-1.5 border rounded-lg focus:ring-1 focus:ring-[#B70F0A] disabled:opacity-50 text-xs font-bold bg-white w-28"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="relative">
                        <Sun className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-orange-400" />
                        <input
                          type="time"
                          value={h.open2 || ""}
                          disabled={h.closed}
                          onChange={(e) => updateDay(day.id, "open2", e.target.value)}
                          className="pl-7 pr-2 py-1.5 border rounded-lg focus:ring-1 focus:ring-[#B70F0A] disabled:opacity-50 text-xs font-bold bg-white w-28"
                          placeholder="Turno 2"
                        />
                      </div>
                      <span className="text-gray-400">às</span>
                      <div className="relative">
                        <Moon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                        <input
                          type="time"
                          value={h.close2 || ""}
                          disabled={h.closed}
                          onChange={(e) => updateDay(day.id, "close2", e.target.value)}
                          className="pl-7 pr-2 py-1.5 border rounded-lg focus:ring-1 focus:ring-[#B70F0A] disabled:opacity-50 text-xs font-bold bg-white w-28"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => replicateToAll(day.id)}
                      disabled={h.closed || !h.open || !h.close}
                      className="p-2 text-slate-400 hover:text-[#B70F0A] hover:bg-red-50 rounded-lg transition-all disabled:opacity-0"
                      title="Replicar este horário para todos os dias"
                    >
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-start gap-3 text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
        <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-700">Dicas de Preenchimento:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Para empresas que fecham ao meio-dia, preencha os dois turnos (ex: 08:00 às 12:00 e 13:30 às 18:00).</li>
            <li>Se a empresa não fecha ao meio-dia, preencha apenas o 1º Turno.</li>
            <li>Use o botão <RefreshCcw className="inline w-3 h-3 mx-1" /> para copiar o horário de um dia para todos os outros rapidamente.</li>
          </ul>
        </div>
      </div>
        </>
      )}

      <div className="mt-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Observações de Horário (Opcional)
        </label>
        <textarea
          name="observacoes_horario"
          value={values.observacoes_horario || ""}
          onChange={(e) => setFieldValue("observacoes_horario", e.target.value)}
          placeholder="Ex: Atendimento somente com hora marcada. / Plantão aos domingos."
          className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-[#B70F0A] min-h-[80px]"
        />
        <p className="text-xs text-gray-500 mt-1">Essa informação ficará visível no perfil do cliente, logo abaixo da lista de dias.</p>
      </div>
    </div>
  );
}
