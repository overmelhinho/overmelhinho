import { useFormikContext } from "formik";
import {
  CreditCard,
  DollarSign,
  Smartphone,
  Clock,
  Bike,
  Utensils,
  Banknote,
  Coins,
  CheckCircle2,
} from "lucide-react";

interface Beneficio {
  id: string;
  label: string;
  icon: React.ElementType;
}

export default function TabBeneficios() {
  const { values, setFieldValue } = useFormikContext<any>();

  const beneficios: Beneficio[] = [
    { id: "24h", label: "24 horas", icon: Clock },
    { id: "tele_entrega", label: "Tele-entrega", icon: Bike },
    { id: "meio_dia", label: "Aberto ao meio-dia", icon: Utensils },
    { id: "credito", label: "Crédito", icon: CreditCard },
    { id: "debito", label: "Débito", icon: DollarSign },
    { id: "pix", label: "Pix", icon: Smartphone },
    { id: "boleto", label: "Boleto Bancário", icon: Banknote },
    { id: "dinheiro", label: "Dinheiro", icon: Coins },
  ];

  const toggleBeneficio = (id: string) => {
    const current = values.beneficios || [];
    if (current.includes(id)) {
      setFieldValue(
        "beneficios",
        current.filter((b: string) => b !== id)
      );
    } else {
      setFieldValue("beneficios", [...current, id]);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
        Benefícios e Formas de Pagamento
      </h3>

      <p className="text-sm text-gray-600">
        Selecione os benefícios e meios de pagamento oferecidos pelo cliente.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {beneficios.map(({ id, label, icon: Icon }) => {
          const ativo = values.beneficios?.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleBeneficio(id)}
              className={`relative flex flex-col items-center justify-center border rounded-xl p-4 transition-all duration-200 shadow-sm hover:shadow-md ${
                ativo
                  ? "bg-[#B70F0A]/10 border-[#B70F0A] scale-[1.03]"
                  : "bg-white border-gray-200 hover:border-[#B70F0A]/40"
              }`}
            >
              {/* Ícone principal */}
              <Icon
                className={`w-6 h-6 mb-2 transition ${
                  ativo ? "text-[#B70F0A]" : "text-gray-500"
                }`}
              />

              {/* Texto do benefício */}
              <span
                className={`text-sm font-medium transition ${
                  ativo ? "text-[#B70F0A]" : "text-gray-700"
                }`}
              >
                {label}
              </span>

              {/* Badge de seleção (check) */}
              {ativo && (
                <div className="absolute top-2 right-2 text-[#B70F0A]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
