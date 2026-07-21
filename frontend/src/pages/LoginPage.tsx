import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { user, isLoading, fetchUser } = useAuth();
  const [error, setError] = useState("");
  const [rateLimited, setRateLimited] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isBloqueado = new URLSearchParams(location.search).get("bloqueado") === "1";

  // ─── PWA FIX: Se já estiver logado, sai da tela de login ──────────────────
  // O PWA sempre abre na raiz ("/"). Se o AuthContext restaurou o usuário,
  // precisamos redirecionar para o dashboard automaticamente.
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const loginSchema = Yup.object().shape({
    email: Yup.string().email("E-mail inválido").required("Campo obrigatório"),
    password: Yup.string().required("Campo obrigatório"),
  });

  // Evita "piscar" a tela de login enquanto o AuthContext verifica o localStorage
  // ou enquanto o redirecionamento está sendo processado.
  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="text-center mb-6">
          <img src="/logo-overmelhinho.png" alt="O Vermelhinho" className="h-[45px] mx-auto mb-4" />
          <p className="text-sm text-gray-600">Acesse o painel administrativo</p>
        </div>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={loginSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const { data } = await axios.post("/v1/login", values);
              localStorage.setItem("token", data.token);
              await fetchUser(); // <--- CHAMA O CONTEXTO PARA POPULAR O USUÁRIO
              setError("");
              navigate("/dashboard");
            } catch (err: any) {
              if (err.response?.status === 429) {
                setError("Muitas tentativas de login. Aguarde 1 minuto para tentar novamente.");
                setRateLimited(true);
                setTimeout(() => setRateLimited(false), 60000);
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
              {isBloqueado && (
                <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm font-medium flex items-start gap-2">
                  <span className="text-lg leading-none">🔒</span>
                  <span>
                    Sua conta foi <strong>bloqueada</strong> por um administrador.
                    Entre em contato para solicitar o reacesso.
                  </span>
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm text-gray-700">E-mail</label>
                <Field
                  type="email"
                  name="email"
                  autoComplete="email"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <ErrorMessage name="email" component="div" className="text-red-600 text-sm" />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm text-gray-700">Senha</label>
                <Field
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  {isSubmitting
                    ? "Entrando..."
                    : rateLimited
                    ? "Aguardando liberação..."
                    : "Entrar"}
                </button>

              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
