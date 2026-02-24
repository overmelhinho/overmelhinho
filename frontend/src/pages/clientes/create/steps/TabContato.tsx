import { useFormikContext } from "formik";
import { Phone, Mail, User } from "lucide-react";
import MaskedInput from "@/components/ui/masked-input";

export default function TabContato() {
  const { values, setFieldValue, handleChange } = useFormikContext<any>();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
        <Phone className="w-5 h-5 text-[#B70F0A]" /> Contato do Estabelecimento
      </h3>

      <p className="text-sm text-gray-600">
        Informe os contatos principais. Telefones e e-mails podem ser marcados para exibição no site.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Telefone Principal */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#B70F0A]" /> Telefone Principal*
          </label>
          <MaskedInput
            mask="(99) 9999-9999"
            maskChar=""
            name="telefone_principal"
            value={values.telefone_principal || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue("telefone_principal", e.target.value)}
            placeholder="(00) 0000-0000"
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
          />

          <div className="flex items-center gap-4 mt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={values.exibir_tel_principal || false}
                onChange={(e) => setFieldValue("exibir_tel_principal", e.target.checked)}
                className="accent-[#B70F0A] h-4 w-4"
              />
              Exibir no site
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={values.whatsapp_principal || false}
                onChange={(e) => setFieldValue("whatsapp_principal", e.target.checked)}
                className="accent-[#B70F0A] h-4 w-4"
              />
              WhatsApp
            </label>
          </div>
        </div>

        {/* Celular */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#B70F0A]" /> Celular
          </label>
          <MaskedInput
            mask="(99) 99999-9999"
            maskChar=""
            name="celular"
            value={values.celular || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue("celular", e.target.value)}
            placeholder="(00) 00000-0000"
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
          />

          <div className="flex items-center gap-4 mt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={values.exibir_celular || false}
                onChange={(e) => setFieldValue("exibir_celular", e.target.checked)}
                className="accent-[#B70F0A] h-4 w-4"
              />
              Exibir no site
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={values.whatsapp_celular || false}
                onChange={(e) => setFieldValue("whatsapp_celular", e.target.checked)}
                className="accent-[#B70F0A] h-4 w-4"
              />
              WhatsApp
            </label>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#B70F0A]" /> E-mail
          </label>
          <input
            type="email"
            name="email"
            value={values.email || ""}
            onChange={handleChange}
            placeholder="contato@empresa.com"
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
          />

          <div className="flex items-center gap-4 mt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={values.exibir_email || false}
                onChange={(e) => setFieldValue("exibir_email", e.target.checked)}
                className="accent-[#B70F0A] h-4 w-4"
              />
              Exibir no site
            </label>
          </div>
        </div>

        {/* Responsável */}
        <div className="md:col-span-1">
          <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
            <User className="w-4 h-4 text-[#B70F0A]" /> Responsável
          </label>
          <input
            type="text"
            name="responsavel"
            value={values.responsavel || ""}
            onChange={handleChange}
            placeholder="Nome do responsável"
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
          />
        </div>

        {/* Preferência de Contato */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-1">Preferência de Contato</label>
          <select
            name="contact_preference"
            value={values.contact_preference || ""}
            onChange={handleChange}
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
          >
            <option value="">Selecione...</option>
            <option value="presential">Presencial 🏢</option>
            <option value="call">Ligação 📞</option>
            <option value="email">E-mail 📧</option>
            <option value="whatsapp">WhatsApp 💬</option>
          </select>
        </div>

        {/* Melhor Turno */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-1">Melhor Turno para Contato</label>
          <select
            name="best_contact_shift"
            value={values.best_contact_shift || ""}
            onChange={handleChange}
            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A]"
          >
            <option value="">Selecione...</option>
            <option value="morning">Manhã 🌅</option>
            <option value="afternoon">Tarde ☀️</option>
          </select>
        </div>
      </div>
    </div>
  );
}
