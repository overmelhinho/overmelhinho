import { useFormikContext, FieldArray } from "formik";
import { useState } from "react";
import { MapPin, Home, Building, Hash, Map, Landmark, Plus, Trash2, Phone, DollarSign, AlertCircle } from "lucide-react";
import axios from "@/services/api";
import { cn } from "@/lib/utils";

export default function TabEndereco() {
  const { values, setFieldValue } = useFormikContext<any>();
  const [loadingCep, setLoadingCep] = useState<Record<number, boolean>>({});

  const extractCoordinates = (url: string, index: number) => {
    setFieldValue(`enderecos[${index}].link_maps`, url);
    if (!url) {
      setFieldValue(`enderecos[${index}].latitude`, "");
      setFieldValue(`enderecos[${index}].longitude`, "");
      return;
    }
    
    // Tenta encontrar o pino exato (!3d e !4d)
    const pinMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (pinMatch) {
      setFieldValue(`enderecos[${index}].latitude`, pinMatch[1]);
      setFieldValue(`enderecos[${index}].longitude`, pinMatch[2]);
      return;
    }
    
    // Fallback: Centro da tela (@lat,lng)
    const centerMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (centerMatch) {
      setFieldValue(`enderecos[${index}].latitude`, centerMatch[1]);
      setFieldValue(`enderecos[${index}].longitude`, centerMatch[2]);
    }
  };

  const buscarCEP = async (cep: string, index: number) => {
    const numericCep = cep.replace(/\D/g, "");
    if (numericCep.length === 8) {
      setLoadingCep(prev => ({ ...prev, [index]: true }));
      try {
        const { data } = await axios.get(`https://viacep.com.br/ws/${numericCep}/json/`);
        if (!data.erro) {
          let ruaCompleta = data.logradouro || "";
          let tipo = "";
          let rua = ruaCompleta;

          const tiposComuns = ["Rua", "Avenida", "Travessa", "Rodovia", "Estrada", "Alameda", "Viela", "Praça", "Beco"];
          for (const t of tiposComuns) {
            if (ruaCompleta.toLowerCase().startsWith(t.toLowerCase() + " ")) {
              tipo = t;
              rua = ruaCompleta.substring(t.length + 1).trim();
              break;
            }
          }

          const bairro = data.bairro || "";

          setFieldValue(`enderecos[${index}].tipo_logradouro`, tipo);
          setFieldValue(`enderecos[${index}].rua`, rua);
          setFieldValue(`enderecos[${index}].bairro`, bairro);
          setFieldValue(`enderecos[${index}].cidade`, data.localidade || "");
          setFieldValue(`enderecos[${index}].estado`, data.uf || "");

          // Se for cobrança e os campos de cobrança estiverem vazios, sugere o truncado
          if (values.enderecos[index].is_cobranca) {
              if (!values.enderecos[index].rua_cobranca) {
                  setFieldValue(`enderecos[${index}].rua_cobranca`, rua.substring(0, 40));
              }
              if (!values.enderecos[index].bairro_cobranca) {
                  setFieldValue(`enderecos[${index}].bairro_cobranca`, bairro.substring(0, 40));
              }
          }
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

  const generateCompactAddress = (end: any) => {
      const parts = [];
      let rua = end.rua || "";
      if (end.tipo_logradouro) {
          rua = `${end.tipo_logradouro} ${rua}`;
      }
      if (rua) parts.push(rua);
      if (end.numero) parts.push(end.numero);
      if (end.bairro) parts.push(end.bairro);
      if (end.cidade) parts.push(`${end.cidade}/${end.estado || ""}`);
      if (end.cep) parts.push(end.cep);
      return parts.join(", ").substring(0, 100); // Sugestão inicial
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

                <div className="flex flex-wrap items-center gap-4 mb-2 bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`enderecos[${index}].exibir_apenas_cidade`}
                      checked={endereco.exibir_apenas_cidade || false}
                      onChange={(e) => setFieldValue(`enderecos[${index}].exibir_apenas_cidade`, e.target.checked)}
                      className="accent-[#B70F0A] h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor={`enderecos[${index}].exibir_apenas_cidade`} className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                      Ocultar endereço no site
                    </label>
                  </div>

                  <div className="flex items-center gap-2 border-l border-yellow-200 pl-4">
                    <input
                      type="checkbox"
                      id={`enderecos[${index}].is_cobranca`}
                      checked={endereco.is_cobranca !== false} // True por padrão
                      onChange={(e) => {
                          const isChecked = e.target.checked;
                          if (isChecked) {
                              // Desmarcar outros
                              values.enderecos.forEach((_: any, idx: number) => {
                                  if (idx !== index) setFieldValue(`enderecos[${idx}].is_cobranca`, false);
                              });
                              
                              if (!endereco.endereco_compacto) {
                                  setFieldValue(`enderecos[${index}].endereco_compacto`, generateCompactAddress(endereco));
                              }
                          }
                          setFieldValue(`enderecos[${index}].is_cobranca`, isChecked);
                      }}
                      className="accent-[#B70F0A] h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor={`enderecos[${index}].is_cobranca`} className="text-sm font-black text-gray-800 cursor-pointer select-none flex items-center gap-1.5 uppercase tracking-tighter">
                      <DollarSign className="w-4 h-4 text-emerald-600" /> Endereço de Cobrança
                    </label>
                  </div>
                </div>

                {/* Campo Único de Cobrança Compacto */}
                {(endereco.is_cobranca !== false) && (
                    <div className={cn(
                        "p-5 rounded-xl border transition-all space-y-3",
                        (endereco.endereco_compacto?.length || 0) > 40 
                            ? "bg-red-50 border-red-200 shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
                            : "bg-emerald-50 border-emerald-100 shadow-sm"
                    )}>
                        <div className="flex items-center justify-between">
                            <label className={cn(
                                "text-[11px] font-black uppercase tracking-widest flex items-center gap-2",
                                (endereco.endereco_compacto?.length || 0) > 40 ? "text-red-700" : "text-emerald-800"
                            )}>
                                <DollarSign size={16} /> Endereço de Cobrança (Máx 40 Caracteres)
                            </label>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFieldValue(`enderecos[${index}].endereco_compacto`, generateCompactAddress(endereco))}
                                    className="text-[10px] font-bold text-emerald-700 hover:underline bg-emerald-100 px-2 py-1 rounded"
                                >
                                    Gerar da União dos Campos
                                </button>
                                <span className={cn(
                                    "text-xs font-black px-2 py-0.5 rounded-full",
                                    (endereco.endereco_compacto?.length || 0) > 40 ? "bg-red-200 text-red-700 animate-pulse" : "bg-emerald-200 text-emerald-700"
                                )}>
                                    {(endereco.endereco_compacto?.length || 0)} / 40
                                </span>
                            </div>
                        </div>

                        <textarea
                            value={endereco.endereco_compacto || ""}
                            onChange={(e) => setFieldValue(`enderecos[${index}].endereco_compacto`, e.target.value)}
                            rows={2}
                            className={cn(
                                "w-full rounded-lg text-sm font-bold p-3 transition-all outline-none",
                                (endereco.endereco_compacto?.length || 0) > 40 
                                    ? "border-2 border-red-500 focus:ring-red-500 text-red-900" 
                                    : "border border-emerald-200 focus:ring-emerald-500 text-emerald-900"
                            )}
                            placeholder="Rua, Num - Bairro - Cidade/UF - CEP"
                        />

                        {(endereco.endereco_compacto?.length || 0) > 40 && (
                            <div className="flex items-center gap-2 text-[10px] font-black text-red-600 uppercase animate-bounce">
                                <AlertCircle size={14} />
                                Atenção: O endereço excede o limite de 40 caracteres para bancos!
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-[#B70F0A]" /> CEP{!endereco.exibir_apenas_cidade && "*"}
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
                      <Map className="w-4 h-4 text-[#B70F0A]" /> Bairro{!endereco.exibir_apenas_cidade && "*"}
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
                      <Home className="w-4 h-4 text-[#B70F0A]" /> Endereço (Tipo e Rua){!endereco.exibir_apenas_cidade && "*"}
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        name={`enderecos[${index}].tipo_logradouro`}
                        value={endereco.tipo_logradouro || ""}
                        onChange={(e) => setFieldValue(`enderecos[${index}].tipo_logradouro`, e.target.value)}
                        className="border rounded-md px-3 py-2 w-1/3 focus:ring-2 focus:ring-[#B70F0A] bg-white"
                      >
                        <option value="">Selecione...</option>
                        <option value="Rua">Rua</option>
                        <option value="Avenida">Avenida</option>
                        <option value="Travessa">Travessa</option>
                        <option value="Rodovia">Rodovia</option>
                        <option value="Estrada">Estrada</option>
                        <option value="Alameda">Alameda</option>
                        <option value="Viela">Viela</option>
                        <option value="Praça">Praça</option>
                        <option value="Beco">Beco</option>
                        <option value="Outro">Outro</option>
                      </select>
                      <input
                        type="text"
                        name={`enderecos[${index}].rua`}
                        value={endereco.rua || ""}
                        onChange={(e) => setFieldValue(`enderecos[${index}].rua`, e.target.value)}
                        className="border rounded-md px-3 py-2 w-2/3 focus:ring-2 focus:ring-[#B70F0A]"
                        placeholder="Ex: Pinheiro Machado"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-[#B70F0A]" /> Número{!endereco.exibir_apenas_cidade && "*"}
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

                  <div className="md:col-span-3">
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Map className="w-4 h-4 text-emerald-600" /> Link do Google Maps (Opcional - Extrai as coordenadas)
                    </label>
                    <input
                      type="text"
                      name={`enderecos[${index}].link_maps`}
                      value={endereco.link_maps || ""}
                      onChange={(e) => extractCoordinates(e.target.value, index)}
                      className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500"
                      placeholder="Cole aqui o link do Google Maps para obter latitude e longitude"
                    />
                    {endereco.latitude && endereco.longitude && (
                      <p className="text-xs text-emerald-600 mt-1 font-medium">
                        ✓ Coordenadas extraídas com sucesso: {endereco.latitude}, {endereco.longitude}
                      </p>
                    )}
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
                tipo_logradouro: "",
                rua: "",
                numero: "",
                complemento: "",
                telefone: "",
                link_maps: "",
                link_waze: "",
                exibir_apenas_cidade: false,
                is_cobranca: false,
                rua_cobranca: "",
                bairro_cobranca: ""
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


