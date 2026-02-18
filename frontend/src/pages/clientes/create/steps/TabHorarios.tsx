import { useFormikContext } from "formik";
import { Clock, Lightbulb } from "lucide-react";

export default function TabHorarios() {
  const { values, handleChange } = useFormikContext<any>();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
        <Clock className="w-5 h-5 text-[#B70F0A]" /> Horário de Atendimento
      </h3>

      <textarea
        name="horario_atendimento"
        value={values.horario_atendimento || ""}
        onChange={handleChange}
        placeholder="Ex: Segunda a sexta: 07h às 19h | Sábado: 07h às 18h30"
        className="border rounded-md px-3 py-2 w-full h-28 resize-none focus:ring-2 focus:ring-[#B70F0A]"
      />

      <div className="flex items-start gap-2 text-sm text-gray-600 border-l-4 border-[#B70F0A] pl-3 bg-gray-50">
        <Lightbulb className="w-4 h-4 text-[#B70F0A]" />
        Dica: use um formato claro como “Segunda a sexta: 07h às 19h”.
      </div>
    </div>
  );
}
