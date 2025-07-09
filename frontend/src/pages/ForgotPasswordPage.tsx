import { useState } from "react";
import axios from "@/services/api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="text-center mb-6">
          <img src="/logo.svg" alt="Logo" className="h-10 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-red-600">O Vermelhinho</h1>
          <p className="text-sm text-gray-600">Recuperação de senha</p>
        </div>

        {sent ? (
          <div className="text-center space-y-3">
            <p className="text-green-600 font-medium">Token de redefinição gerado com sucesso.</p>
            <p className="bg-gray-100 border font-mono text-sm px-3 py-2 rounded">{token}</p>
            <p className="text-xs text-gray-500">
              Em produção, este token seria enviado por e-mail.
            </p>
          </div>
        ) : (
          <Formik
            initialValues={{ email: "" }}
            validationSchema={Yup.object({
              email: Yup.string().email("E-mail inválido").required("Campo obrigatório"),
            })}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                const { data } = await axios.post("/v1/password/email", values);
                setToken(data.token);
                setSent(true);
              } catch {
                alert("Erro ao solicitar redefinição.");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm text-gray-700">
                    E-mail
                  </label>
                  <Field
                    type="email"
                    name="email"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <ErrorMessage name="email" component="div" className="text-red-600 text-sm" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition disabled:opacity-60"
                >
                  {isSubmitting ? "Enviando..." : "Enviar link"}
                </button>
              </Form>
            )}
          </Formik>
        )}
      </div>
    </div>
  );
}
