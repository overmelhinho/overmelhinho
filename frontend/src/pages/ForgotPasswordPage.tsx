import { useState } from "react";
import axios from "@/services/api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-4">Recuperar Senha</h2>

        {sent ? (
          <div className="text-green-600 text-center space-y-2">
            <p>Token de redefinição gerado com sucesso.</p>
            <p className="font-mono">{token}</p>
            <p className="text-sm text-gray-500">Em produção, este token seria enviado por e-mail.</p>
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
                  <label className="block mb-1">E-mail</label>
                  <Field
                    type="email"
                    name="email"
                    className="w-full border rounded px-3 py-2"
                  />
                  <ErrorMessage name="email" component="div" className="text-red-600 text-sm" />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
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
