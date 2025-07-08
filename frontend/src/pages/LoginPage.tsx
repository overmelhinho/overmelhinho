import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "@/services/api";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [rateLimited, setRateLimited] = useState(false);
  const navigate = useNavigate();

  const loginSchema = Yup.object().shape({
    email: Yup.string().email("E-mail inválido").required("Campo obrigatório"),
    password: Yup.string().required("Campo obrigatório"),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Acesso à Plataforma</h2>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={loginSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const { data } = await axios.post("/v1/login", values);
              localStorage.setItem("token", data.token);
              navigate("/dashboard");
              setError(""); // Limpa erro anterior se login for OK
            } catch (err: any) {
              if (err.response?.status === 429) {
                setError("Muitas tentativas de login. Aguarde 1 minuto para tentar novamente.");
                setRateLimited(true);
                setTimeout(() => setRateLimited(false), 60000); // 60s de bloqueio
              } else if (err.response?.status === 401) {
                setError("E-mail ou senha inválidos.");
              } else {
                setError(err.response?.data?.message || "Erro ao autenticar. Tente novamente.");
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label htmlFor="email" className="block mb-1">E-mail</label>
                <Field
                  type="email"
                  name="email"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <ErrorMessage name="email" component="div" className="text-red-600 text-sm" />
              </div>

              <div>
                <label htmlFor="password" className="block mb-1">Senha</label>
                <Field
                  type="password"
                  name="password"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <ErrorMessage name="password" component="div" className="text-red-600 text-sm" />
              </div>

              {error && <div className="text-red-600 text-sm text-center">{error}</div>}

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting || rateLimited}
                  className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition disabled:opacity-60"
                >
                  {isSubmitting ? "Entrando..." : rateLimited ? "Aguardando liberação..." : "Entrar"}
                </button>

                <div className="text-center">
                  <a href="/forgot-password" className="text-sm text-red-600 hover:underline">
                    Esqueci minha senha
                  </a>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
