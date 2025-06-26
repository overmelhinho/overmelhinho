import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

const Login = () => {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Email inválido").required("Obrigatório"),
      password: Yup.string().required("Obrigatório"),
    }),
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      try {
        await api.post("/login", values);
        navigate("/verify-code", { state: { email: values.email } });
      } catch (error) {
        console.error("❌ Erro no formulário de login:", error);
        setStatus("Erro ao fazer login. Verifique as credenciais.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-6">
          <img
            src="/logo-vermelhinho.png"
            alt="Logo O Vermelhinho"
            className="mx-auto w-24 mb-2"
          />
          <h1 className="text-2xl font-bold text-red-600">O Vermelhinho</h1>
          <p className="text-sm text-gray-500 mt-1">Acesse o painel administrativo</p>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input
              name="email"
              type="email"
              placeholder="Email"
              onChange={formik.handleChange}
              value={formik.values.email}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-xs text-red-500 mt-1">{formik.errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              name="password"
              type="password"
              placeholder="Senha"
              onChange={formik.handleChange}
              value={formik.values.password}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            {formik.touched.password && formik.errors.password && (
              <p className="text-xs text-red-500 mt-1">{formik.errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {formik.isSubmitting ? "Entrando..." : "Entrar"}
          </button>

          {formik.status && (
            <p className="text-sm text-red-500 text-center mt-2">{formik.status}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
