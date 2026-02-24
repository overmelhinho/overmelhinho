import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { X, Send, ArrowRight, MessageSquare, Clock, AlertTriangle } from "lucide-react";
import axios from "@/services/api";
import toast from "react-hot-toast";
import InputMask from "react-input-mask";

interface QuoteRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    clienteId: number;
    clienteNome: string;
}

const QuoteSchema = Yup.object().shape({
    service_requested: Yup.string()
        .min(10, "Por favor, descreva com um pouco mais de detalhes.")
        .required("Campo obrigatório"),
    urgency: Yup.string().required("Selecione a urgência"),
    customer_name: Yup.string().required("Seu nome é obrigatório"),
    customer_whatsapp: Yup.string().required("WhatsApp é obrigatório"),
});

export default function QuoteRequestModal({ isOpen, onClose, clienteId, clienteNome }: QuoteRequestModalProps) {
    const [step, setStep] = useState(1);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-[#C00000] p-8 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Solicitar Orçamento</span>
                    </div>
                    <h2 className="text-2xl font-black">{clienteNome}</h2>
                    <p className="text-red-100 text-sm opacity-90">Receba uma proposta personalizada via WhatsApp.</p>
                </div>

                <Formik
                    initialValues={{
                        cliente_id: clienteId,
                        service_requested: "",
                        urgency: "semana",
                        customer_name: "",
                        customer_whatsapp: "",
                    }}
                    validationSchema={QuoteSchema}
                    onSubmit={async (values, { setSubmitting }) => {
                        try {
                            await axios.post("/v1/quotes", values);
                            toast.success("Solicitação enviada com sucesso!");
                            onClose();
                        } catch (error) {
                            toast.error("Erro ao enviar solicitação.");
                        } finally {
                            setSubmitting(false);
                        }
                    }}
                >
                    {({ values, errors, touched, setFieldValue, isSubmitting, isValid }) => (
                        <Form className="p-8">
                            {step === 1 ? (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">
                                            O que você precisa?
                                        </label>
                                        <Field
                                            as="textarea"
                                            name="service_requested"
                                            placeholder="Ex: Preciso de uma revisão completa nos freios do meu carro modelo X..."
                                            className={`w-full h-32 p-4 bg-gray-50 border-2 rounded-2xl focus:ring-4 transition-all outline-none text-sm font-semibold resize-none ${errors.service_requested && touched.service_requested
                                                    ? "border-red-100 focus:ring-red-50"
                                                    : "border-gray-100 focus:ring-red-500/10 focus:border-[#C00000]"
                                                }`}
                                        />
                                        {errors.service_requested && touched.service_requested && (
                                            <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errors.service_requested}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">
                                            Qual a sua urgência?
                                        </label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {[
                                                { id: 'pesquisa', label: 'Apenas pesquisando', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
                                                { id: 'semana', label: 'Para esta semana', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
                                                { id: 'emergencia', label: 'Emergência (Imediato)', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setFieldValue('urgency', opt.id)}
                                                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-sm font-bold ${values.urgency === opt.id
                                                            ? 'border-[#C00000] bg-red-50/30'
                                                            : 'border-gray-100 bg-white hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className={`p-2 rounded-xl ${opt.bg} ${opt.color}`}>
                                                        <opt.icon size={18} />
                                                    </div>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={!values.service_requested || values.service_requested.length < 10}
                                        onClick={() => setStep(2)}
                                        className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                    >
                                        Continuar
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">
                                            Qual seu nome?
                                        </label>
                                        <Field
                                            name="customer_name"
                                            placeholder="Ex: João Silva"
                                            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-[#C00000] transition-all outline-none text-sm font-semibold"
                                        />
                                        {errors.customer_name && touched.customer_name && (
                                            <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errors.customer_name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">
                                            Seu WhatsApp
                                        </label>
                                        <InputMask
                                            mask="(99) 99999-9999"
                                            value={values.customer_whatsapp}
                                            onChange={(e) => setFieldValue('customer_whatsapp', e.target.value)}
                                        >
                                            {(inputProps: any) => (
                                                <input
                                                    {...inputProps}
                                                    type="text"
                                                    placeholder="(00) 00000-0000"
                                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-[#C00000] transition-all outline-none text-sm font-semibold"
                                                />
                                            )}
                                        </InputMask>
                                        {errors.customer_whatsapp && touched.customer_whatsapp && (
                                            <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errors.customer_whatsapp}</p>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="flex-1 h-14 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
                                        >
                                            Voltar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !isValid}
                                            className="flex-[2] h-14 bg-[#C00000] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-200 hover:bg-[#a00000] transition-all flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    Enviar Solicitação
                                                    <Send size={16} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}
