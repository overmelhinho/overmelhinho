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
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await api.post("/login", values);
        navigate("/verify-code", { state: { email: values.email } });
      } catch (error) {
        console.error("❌ Erro no formulário de login:", error);
        alert("Erro ao fazer login. Verifique as credenciais.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <h2>Login</h2>
      <input
        name="email"
        type="email"
        placeholder="Email"
        onChange={formik.handleChange}
        value={formik.values.email}
      />
      <input
        name="password"
        type="password"
        placeholder="Senha"
        onChange={formik.handleChange}
        value={formik.values.password}
      />
      <button type="submit" disabled={formik.isSubmitting}>
        {formik.isSubmitting ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
};

export default Login;
