import { Field } from "formik";

type Props = {
  inputClass?: string;
};

export default function TabInfoGerais({ inputClass = "border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A] outline-none transition" }: Props) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-600">
        Horário de Atendimento
      </label>
      <Field
        name="horario"
        className={inputClass}
        placeholder="Ex: Segunda a sexta: 07:00 às 19:00"
      />
    </div>
  );
}
