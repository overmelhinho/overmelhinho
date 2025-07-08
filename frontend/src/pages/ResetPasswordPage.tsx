import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "@/services/api";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const schema = Yup.object().shape({
    password: Yup.string().min(6, "Mínimo 6 caracteres").required("Obrigatório"),
    password_confirmation: Yup.string()
      .oneOf([Yup.ref("password")], "Senhas não conferem")
      .required("Obrigatório"),
  });

  if (!token) {
    return <p className="text-red-500 text-center mt-10">Token inválido.</p>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Redefinir Senha</h2>

        <Formik
          initialValues={{ password: "", password_confirmation: "" }}
          validationSchema={schema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              await axios.post("/v1/password/reset", {
                ...values,
                token,
              });
              setSuccess("Senha redefinida com sucesso.");
              setTimeout(() => navigate("/"), 2000);
            } catch (err: any) {
              setError(err.response?.data?.message || "Erro ao redefinir senha.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label htmlFor="password" className="block mb-1">Nova Senha</label>
                <Field
                  type="password"
                  name="password"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <ErrorMessage name="password" component="div" className="text-red-600 text-sm" />
              </div>

              <div>
                <label htmlFor="password_confirmation" className="block mb-1">Confirme a Senha</label>
                <Field
                  type="password"
                  name="password_confirmation"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <ErrorMessage name="password_confirmation" component="div" className="text-red-600 text-sm" />
              </div>

              {error && <div className="text-red-600 text-sm text-center">{error}</div>}
              {success && <div className="text-green-600 text-sm text-center">{success}</div>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
              >
                {isSubmitting ? "Salvando..." : "Redefinir Senha"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
