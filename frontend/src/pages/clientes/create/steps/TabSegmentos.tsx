import { useFormikContext } from "formik";
import { useQuery } from "@tanstack/react-query";
import axios from "@/services/api";
import Select from "react-select";
import { Layers, Loader2 } from "lucide-react";

export default function TabSegmentos() {
  const { values, setFieldValue } = useFormikContext<any>();

  const { data: segmentos, isLoading } = useQuery({
    queryKey: ["segmentos"],
    queryFn: async () => {
      const { data } = await axios.get("/v1/segmentos");
      return Array.isArray(data.data) ? data.data : data;
    },
  });

  const options = (segmentos || []).map((s: any) => ({
    value: s.id,
    label: s.nome,
  }));

  const selected = options.filter((o) => (values.segmentos || []).includes(o.value));

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
        <Layers className="w-5 h-5 text-[#B70F0A]" /> Segmentos de Atuação
      </h3>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="animate-spin w-4 h-4" /> Carregando segmentos...
        </div>
      ) : (
        <Select
          isMulti
          name="segmentos"
          options={options}
          value={selected}
          onChange={(sel) =>
            setFieldValue(
              "segmentos",
              Array.isArray(sel) ? sel.map((s) => s.value) : []
            )
          }
          className="w-full text-sm"
          classNamePrefix="react-select"
        />
      )}
    </div>
  );
}
