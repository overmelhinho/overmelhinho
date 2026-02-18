import { useFormikContext } from "formik";
import { useState } from "react";
import { MapPin, Home, Building, Hash, Map, Landmark } from "lucide-react";
import axios from "@/services/api";

export default function TabEndereco() {
  const { values, setFieldValue } = useFormikContext<any>();
  const [loadingCep, setLoadingCep] = useState(false);

  const buscarCEP = async (cep: string) => {
    const numericCep = cep.replace(/\D/g, "");
    if (numericCep.length === 8) {
      setLoadingCep(true);
      try {
        const { data } = await axios.get(`https://viacep.com.br/ws/${numericCep}/json/`);
        if (!data.erro) {
          setFieldValue("rua", data.logradouro || "");
          setFieldValue("bairro", data.bairro || "");
          setFieldValue("cidade", data.localidade || "");
          setFieldValue("estado", data.uf || "");
        }
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const formatCep = (v: string) => v.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2");

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
        <MapPin className="w-5 h-5 text-[#B70F0A]" /> Endereço
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#B70F0A]" /> CEP*
          </label>
          <input
            type="text"
            name="cep"
            value={values.cep || ""}
            onChange={(e) => setFieldValue("cep", formatCep(e.target.value))}
            onBlur={(e) => buscarCEP(e.target.value)}
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
            placeholder="00000-000"
          />
          {loadingCep && <p className="text-xs text-gray-500 mt-1">🔄 Buscando endereço...</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#B70F0A]" /> Estado*
          </label>
          <input
            type="text"
            name="estado"
            value={values.estado || ""}
            onChange={(e) => setFieldValue("estado", e.target.value.toUpperCase())}
            className="border rounded-md px-3 py-2 w-full uppercase focus:ring-2 focus:ring-[#B70F0A]"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Building className="w-4 h-4 text-[#B70F0A]" /> Cidade*
          </label>
          <input
            type="text"
            name="cidade"
            value={values.cidade || ""}
            onChange={(e) => setFieldValue("cidade", e.target.value)}
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Map className="w-4 h-4 text-[#B70F0A]" /> Bairro*
          </label>
          <input
            type="text"
            name="bairro"
            value={values.bairro || ""}
            onChange={(e) => setFieldValue("bairro", e.target.value)}
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Home className="w-4 h-4 text-[#B70F0A]" /> Rua*
          </label>
          <input
            type="text"
            name="rua"
            value={values.rua || ""}
            onChange={(e) => setFieldValue("rua", e.target.value)}
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#B70F0A]" /> Número*
          </label>
          <input
            type="text"
            name="numero"
            value={values.numero || ""}
            onChange={(e) => setFieldValue("numero", e.target.value)}
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
          />
        </div>

        <div className="md:col-span-3">
          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Building className="w-4 h-4 text-[#B70F0A]" /> Complemento
          </label>
          <input
            type="text"
            name="complemento"
            value={values.complemento || ""}
            onChange={(e) => setFieldValue("complemento", e.target.value)}
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
          />
        </div>
      </div>
    </div>
  );
}
