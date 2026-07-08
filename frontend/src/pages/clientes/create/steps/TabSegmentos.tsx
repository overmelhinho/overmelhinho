import { useFormikContext } from "formik";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "@/services/api";
import CreatableSelect from "react-select/creatable";
import { components, MultiValueProps } from "react-select";
import { Layers, Loader2, Star } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const CustomMultiValue = (props: MultiValueProps<any>) => {
  const isFirst = props.index === 0;
  
  return (
    <components.MultiValue {...props}>
      <div className="flex items-center gap-1.5 pl-1 pr-1 py-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isFirst) return;
            const currentValues = props.getValue();
            const clickedValue = currentValues[props.index];
            const newValues = [clickedValue, ...currentValues.filter((_, i) => i !== props.index)];
            if (props.selectProps.onChange) {
              props.selectProps.onChange(newValues, { action: 'set-value', option: clickedValue, name: props.selectProps.name });
            }
          }}
          className={`flex-shrink-0 transition-colors ${isFirst ? 'text-yellow-500 cursor-default' : 'text-gray-400 hover:text-yellow-500'}`}
          title={isFirst ? 'Segmento Principal' : 'Tornar Principal'}
        >
          <Star className={`w-3.5 h-3.5 ${isFirst ? 'fill-current' : ''}`} />
        </button>
        <span className={isFirst ? 'font-bold text-[#B70F0A]' : ''}>{props.children}</span>
      </div>
    </components.MultiValue>
  );
};

export default function TabSegmentos() {
  const { values, setFieldValue } = useFormikContext<any>();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const { data: segmentos, isLoading } = useQuery({
    queryKey: ["segmentos"],
    queryFn: async () => {
      const { data } = await axios.get("/v1/segmentos");
      const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      return list;
    },
  });

  const options = (segmentos || [])
    .map((s: any) => ({
      value: s.id,
      label: s.nome,
    }))
    .sort((a: any, b: any) => a.label.localeCompare(b.label, 'pt-BR'));

  const selected = (values.segmentos || [])
    .map((id: number) => options.find((o: any) => o.value === id))
    .filter(Boolean);

  if (selected.length > 1) {
    const first = selected[0];
    const rest = selected.slice(1).sort((a: any, b: any) => a.label.localeCompare(b.label, 'pt-BR'));
    selected.splice(0, selected.length, first, ...rest);
  }

  const handleCreate = async (inputValue: string) => {
    setIsCreating(true);
    try {
      const { data } = await axios.post("/v1/segmentos", { nome: inputValue });
      const newSegmento = data.data;

      toast.success(`Segmento "${newSegmento.nome}" criado com sucesso!`);

      // Atualiza o cache do react-query para incluir o novo segmento na lista
      queryClient.setQueryData(["segmentos"], (old: any) => {
        const list = Array.isArray(old) ? old : [];
        return [...list, newSegmento];
      });

      // Adiciona o novo segmento aos selecionados
      const currentSegmentos = values.segmentos || [];
      setFieldValue("segmentos", [...currentSegmentos, newSegmento.id]);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Erro ao criar segmento.";
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
        <Layers className="w-5 h-5 text-[#B70F0A]" /> Segmentos de Atuação
      </h3>

      <div className="space-y-2">
        <label className="text-sm text-gray-600">
          Selecione um ou mais segmentos. Se não encontrar, basta digitar o nome e pressionar Enter para criar.
        </label>
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="animate-spin w-4 h-4" /> Carregando segmentos...
          </div>
        ) : (
          <CreatableSelect
            isMulti
            name="segmentos"
            options={options}
            value={selected}
            isDisabled={isCreating}
            isLoading={isCreating}
            components={{ MultiValue: CustomMultiValue }}
            onCreateOption={handleCreate}
            onChange={(sel) =>
              setFieldValue(
                "segmentos",
                Array.isArray(sel) ? sel.map((s) => s.value) : []
              )
            }
            placeholder="Selecione ou crie um novo segmento..."
            loadingMessage={() => "Criando..."}
            formatCreateLabel={(inputValue) => `Criar segmento "${inputValue}"`}
            className="w-full text-sm"
            classNamePrefix="react-select"
          />
        )}
      </div>
    </div>
  );
}
