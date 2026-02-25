import { useFormikContext } from "formik";
import { Phone, Mail, User, CheckCircle2 } from "lucide-react";
import MaskedInput from "@/components/ui/masked-input";

export default function TabContato() {
  const { values, setFieldValue, handleChange } = useFormikContext<any>();

  const phoneFields = [
    { id: 'telefone_principal', label: 'Telefone Principal', mask: '(99) 9999-9999', placeholder: '(00) 0000-0000', showExibir: 'exibir_tel_principal' },
    { id: 'telefone_secundario', label: 'Telefone Secundário', mask: '(99) 9999-9999', placeholder: '(00) 0000-0000', showExibir: 'exibir_tel_secundario' },
    { id: 'celular', label: 'Celular', mask: '(99) 99999-9999', placeholder: '(00) 00000-0000', showExibir: 'exibir_celular' },
    { id: 'telefone_outro', label: 'Outro Telefone / 0800', mask: null, placeholder: 'Digite o número', showExibir: 'exibir_tel_outro' },
  ];

  const handlePhoneChange = (name: string, value: string) => {
    setFieldValue(name, value);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
        <Phone className="w-5 h-5 text-[#B70F0A]" /> Contato do Estabelecimento
      </h3>

      <p className="text-sm text-gray-600">
        Informe até 4 telefones. Marque qual deles é o <b>WhatsApp Principal</b> para contato direto.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {phoneFields.map((field) => (
          <div key={field.id} className="p-4 rounded-xl border bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#B70F0A]" /> {field.label}
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer group">
                <input
                  type="radio"
                  name="whatsapp_selected"
                  value={field.id}
                  checked={values.whatsapp_selected === field.id}
                  onChange={() => setFieldValue("whatsapp_selected", field.id)}
                  className="w-4 h-4 text-[#B70F0A] border-gray-300 focus:ring-[#B70F0A] accent-[#B70F0A]"
                />
                <span className={`transition-colors ${values.whatsapp_selected === field.id ? 'text-[#B70F0A]' : 'text-gray-500 group-hover:text-gray-700'}`}>
                  WhatsApp Principal
                </span>
                {values.whatsapp_selected === field.id && <CheckCircle2 className="w-3 h-3 text-[#B70F0A]" />}
              </label>
            </div>

            {field.mask ? (
              <MaskedInput
                mask={field.mask}
                maskChar=""
                name={field.id}
                value={values[field.id] || ""}
                onChange={(e: any) => handlePhoneChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A] bg-white transition-all shadow-sm"
              />
            ) : (
              <input
                type="text"
                name={field.id}
                value={values[field.id] || ""}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A] bg-white transition-all shadow-sm"
              />
            )}

            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={values[field.showExibir] || false}
                onChange={(e) => setFieldValue(field.showExibir, e.target.checked)}
                className="accent-[#B70F0A] h-3.5 w-3.5 rounded border-gray-300"
              />
              Exibir este número no site/aplicativo
            </label>
          </div>
        ))}
      </div>

      <hr className="border-gray-100" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#B70F0A]" /> E-mail (Opcional)
          </label>
          <input
            type="email"
            name="email"
            value={values.email || ""}
            onChange={handleChange}
            placeholder="contato@empresa.com"
            className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A] shadow-sm"
          />

          <label className="flex items-center gap-2 text-xs text-gray-600 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values.exibir_email || false}
              onChange={(e) => setFieldValue("exibir_email", e.target.checked)}
              className="accent-[#B70F0A] h-3.5 w-3.5 rounded border-gray-300"
            />
            Exibir e-mail no site
          </label>
        </div>

        {/* Responsável */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <User className="w-4 h-4 text-[#B70F0A]" /> Responsável*
          </label>
          <input
            type="text"
            name="responsavel"
            value={values.responsavel || ""}
            onChange={handleChange}
            placeholder="Nome do responsável"
            className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A] shadow-sm font-medium"
          />
        </div>

        {/* Preferência de Contato */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-1">Preferência de Contato</label>
          <select
            name="contact_preference"
            value={values.contact_preference || ""}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A] bg-white shadow-sm"
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
            className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A] bg-white shadow-sm"
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
