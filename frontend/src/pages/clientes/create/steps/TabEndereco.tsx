import { useFormikContext, FieldArray } from "formik";
import { useState } from "react";
import { MapPin, Home, Building, Hash, Map, Landmark, Plus, Trash2, Phone } from "lucide-react";
import axios from "@/services/api";

export default function TabEndereco() {
  const { values, setFieldValue } = useFormikContext<any>();
  const [loadingCep, setLoadingCep] = useState<Record<number, boolean>>({});

  const buscarCEP = async (cep: string, index: number) => {
    const numericCep = cep.replace(/\D/g, "");
    if (numericCep.length === 8) {
      setLoadingCep(prev => ({ ...prev, [index]: true }));
      try {
        const { data } = await axios.get(`https://viacep.com.br/ws/${numericCep}/json/`);
        if (!data.erro) {
          setFieldValue(`enderecos[${index}].rua`, data.logradouro || "");
          setFieldValue(`enderecos[${index}].bairro`, data.bairro || "");
          setFieldValue(`enderecos[${index}].cidade`, data.localidade || "");
          setFieldValue(`enderecos[${index}].estado`, data.uf || "");
        }
      } finally {
        setLoadingCep(prev => ({ ...prev, [index]: false }));
      }
    }
  };

  const formatCep = (v: string) => v.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2");
  const formatPhone = (v: string) => {
    const r = v.replace(/\D/g, "");
    if (r.length > 11) return r.substring(0, 11);
    if (r.length > 10) return r.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    if (r.length > 5) return r.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
    if (r.length > 2) return r.replace(/^(\d{2})(\d{0,5})$/, "($1) $2");
    return r;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#B70F0A]" /> Unidades e Endereços
        </h3>
      </div>

      <FieldArray name="enderecos">
        {({ push, remove }) => (
          <div className="space-y-8">
            {values.enderecos?.map((endereco: any, index: number) => (
              <div key={index} className="p-6 border rounded-2xl bg-gray-50/50 space-y-6 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#B70F0A] text-white text-xs font-bold">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      name={`enderecos[${index}].nome_unidade`}
                      value={endereco.nome_unidade || ""}
                      onChange={(e) => setFieldValue(`enderecos[${index}].nome_unidade`, e.target.value)}
                      placeholder="Ex: Matriz, Filial Centro, Depósito..."
                      className="text-sm font-bold bg-transparent border-b border-dashed border-gray-300 focus:border-[#B70F0A] focus:outline-none px-1 py-0.5 min-w-[200px]"
                    />
                  </div>
                  
                  {values.enderecos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-2"
                      title="Remover Unidade"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                  <input
                    type="checkbox"
                    id={`enderecos[${index}].exibir_apenas_cidade`}
                    checked={endereco.exibir_apenas_cidade || false}
                    onChange={(e) => setFieldValue(`enderecos[${index}].exibir_apenas_cidade`, e.target.checked)}
                    className="accent-[#B70F0A] h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor={`enderecos[${index}].exibir_apenas_cidade`} className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                    Apenas exibir cidade e estado
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-[#B70F0A]" /> CEP*
                    </label>
                    <input
                      type="text"
                      name={`enderecos[${index}].cep`}
                      value={endereco.cep || ""}
                      onChange={(e) => setFieldValue(`enderecos[${index}].cep`, formatCep(e.target.value))}
                      onBlur={(e) => buscarCEP(e.target.value, index)}
                      className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
                      placeholder="00000-000"
                    />
                    {loadingCep[index] && <p className="text-xs text-gray-500 mt-1">🔄 Buscando...</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-[#B70F0A]" /> Estado*
                    </label>
                    <input
                      type="text"
                      name={`enderecos[${index}].estado`}
                      value={endereco.estado || ""}
                      onChange={(e) => setFieldValue(`enderecos[${index}].estado`, e.target.value.toUpperCase())}
                      className="border rounded-md px-3 py-2 w-full uppercase focus:ring-2 focus:ring-[#B70F0A]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#B70F0A]" /> Cidade*
                    </label>
                    <input
                      type="text"
                      name={`enderecos[${index}].cidade`}
                      value={endereco.cidade || ""}
                      onChange={(e) => setFieldValue(`enderecos[${index}].cidade`, e.target.value)}
                      className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
                    />
                  </div>

                  {index > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#B70F0A]" /> Telefone da Unidade
                      </label>
                      <input
                        type="text"
                        name={`enderecos[${index}].telefone`}
                        value={endereco.telefone || ""}
                        onChange={(e) => setFieldValue(`enderecos[${index}].telefone`, formatPhone(e.target.value))}
                        className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Map className="w-4 h-4 text-[#B70F0A]" /> Bairro*
                    </label>
                    <input
                      type="text"
                      name={`enderecos[${index}].bairro`}
                      value={endereco.bairro || ""}
                      onChange={(e) => setFieldValue(`enderecos[${index}].bairro`, e.target.value)}
                      className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Home className="w-4 h-4 text-[#B70F0A]" /> Rua*
                    </label>
                    <input
                      type="text"
                      name={`enderecos[${index}].rua`}
                      value={endereco.rua || ""}
                      onChange={(e) => setFieldValue(`enderecos[${index}].rua`, e.target.value)}
                      className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-[#B70F0A]" /> Número*
                    </label>
                    <input
                      type="text"
                      name={`enderecos[${index}].numero`}
                      value={endereco.numero || ""}
                      onChange={(e) => setFieldValue(`enderecos[${index}].numero`, e.target.value)}
                      className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#B70F0A]" /> Complemento
                    </label>
                    <input
                      type="text"
                      name={`enderecos[${index}].complemento`}
                      value={endereco.complemento || ""}
                      onChange={(e) => setFieldValue(`enderecos[${index}].complemento`, e.target.value)}
                      className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => push({
                nome_unidade: "",
                cep: "",
                estado: "",
                cidade: "",
                bairro: "",
                rua: "",
                numero: "",
                complemento: "",
                telefone: "",
                link_maps: "",
                link_waze: ""
              })}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:text-[#B70F0A] hover:border-[#B70F0A] hover:bg-red-50 transition-all flex items-center justify-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" /> Adicionar Unidade / Filial
            </button>
          </div>
        )}
      </FieldArray>
    </div>
  );
}
