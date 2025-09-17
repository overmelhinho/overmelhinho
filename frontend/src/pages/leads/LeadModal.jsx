import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormik } from "formik";
import * as Yup from "yup";

// Máscara de telefone: (99) 99999-9999
function formatPhoneNumber(value) {
  if (!value) return "";
  const onlyNums = value.replace(/\D/g, "");
  if (onlyNums.length <= 10) {
    return onlyNums.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }
  return onlyNums.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

const steps = [
  { label: "Dados Básicos" },
  { label: "Contato" },
  { label: "Responsável" }
];

function Field({ label, name, value, onChange, onBlur, error, placeholder = "", required = false, type = "text" }) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={error ? "border-red-500" : ""}
        autoComplete="off"
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export default function LeadModal({ open, onClose, onSubmit, user, comercialUsers, initialValues }) {
  const isComercial = user?.roles?.includes("Comercial");
  const [step, setStep] = useState(0);

  const formik = useFormik({
    initialValues: initialValues || {
      nome: "",
      origem: "",
      email: "",
      telefone: "",
      responsavel: isComercial ? user?.name : "",
      status: "novo"
    },
    validationSchema: Yup.object({
      nome: Yup.string().required("Obrigatório"),
      origem: Yup.string().required("Obrigatório"),
      email: Yup.string().email("E-mail inválido").nullable(),
      telefone: Yup.string().nullable(),
      responsavel: Yup.string().nullable()
    }),
    onSubmit: (values) => onSubmit(values),
    enableReinitialize: true
  });

  const nextStep = () => {
    if (step < steps.length - (isComercial ? 2 : 1)) setStep(step + 1);
    else formik.handleSubmit();
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const Stepper = () => (
    <div className="flex justify-center mb-4 gap-4">
      {steps.map((s, i) => (
        <div
          key={i}
          className={`flex flex-col items-center ${i === step ? "font-bold text-[#B70F0A]" : "text-gray-400"}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              i === step ? "border-[#B70F0A] bg-[#B70F0A] text-white" : "border-gray-300 bg-white"
            }`}
          >
            {i + 1}
          </div>
          <div className="text-xs mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <Field label="Nome do lead" name="nome" value={formik.values.nome} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.nome && formik.errors.nome} required placeholder="Digite o nome completo" />
          <div className="space-y-1">
  <label htmlFor="origem" className="block text-sm font-medium text-gray-700">
    Origem <span className="text-red-600 ml-1">*</span>
  </label>
  <select
    id="origem"
    name="origem"
    value={formik.values.origem}
    onChange={formik.handleChange}
    onBlur={formik.handleBlur}
    className={`w-full border rounded-md p-2 ${formik.touched.origem && formik.errors.origem ? "border-red-500" : ""}`}
  >
    <option value="">Selecione a origem</option>
    <optgroup label="Digital">
      <option value="site">Site</option>
      <option value="instagram">Instagram</option>
      <option value="facebook">Facebook</option>
      <option value="google_ads">Google Ads</option>
      <option value="landing_page">Landing Page</option>
      <option value="whatsapp_web">WhatsApp (automático)</option>
    </optgroup>
    <optgroup label="Indicação / Manual">
      <option value="telefone">Telefone</option>
      <option value="indicacao_cliente">Indicação de cliente</option>
      <option value="indicacao_parceiro">Indicação de parceiro</option>
      <option value="insercao_manual">Inserção manual</option>
    </optgroup>
    <optgroup label="Outros">
      <option value="evento_local">Evento ou feira</option>
      <option value="midiakit">Mídia física (panfleto, outdoor)</option>
      <option value="outro">Outro</option>
    </optgroup>
  </select>
  {formik.touched.origem && formik.errors.origem && (
    <span className="text-xs text-red-600">{formik.errors.origem}</span>
  )}
</div>
          </>
        );
      case 1:
        return (
          <>
            <Field label="E-mail" name="email" value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.email && formik.errors.email} placeholder="exemplo@email.com" type="email" />
            <Field
              label="Telefone"
              name="telefone"
              value={formik.values.telefone}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                formik.setFieldValue("telefone", formatted);
              }}
              onBlur={formik.handleBlur}
              error={formik.touched.telefone && formik.errors.telefone}
              placeholder="(99) 99999-9999"
            />
          </>
        );
      case 2:
        return !isComercial && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Responsável pelo lead</label>
            <select
              name="responsavel"
              value={formik.values.responsavel}
              onChange={formik.handleChange}
              className="w-full border rounded-md p-2"
            >
              <option value="">Selecione</option>
              {comercialUsers.map((u) => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>{initialValues ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <Stepper />
          {renderStep()}
          <DialogFooter className="flex justify-between mt-4">
            <Button type="button" onClick={prevStep} disabled={step === 0}>Voltar</Button>
            <Button type="button" onClick={nextStep}>{step < steps.length - (isComercial ? 1 : 0) ? "Avançar" : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
