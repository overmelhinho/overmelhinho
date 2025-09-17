import { useFormik } from "formik";
import * as Yup from "yup";
import api from "@/services/api";

export default function UsuarioModal({ user, roles, permissions, onClose, onSave }) {
  const isEdit = !!user?.id;
  const formik = useFormik({
    initialValues: {
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      roles: user?.roles?.map(r => r.name) || [],
      permissions: user?.permissions?.map(p => p.name) || [],
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Nome obrigatório"),
      email: Yup.string().email("E-mail inválido").required("E-mail obrigatório"),
      ...(isEdit ? {} : { password: Yup.string().required("Senha obrigatória") }),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit) {
          await api.put(`/users/${user.id}`, values);
        } else {
          await api.post("/users", values);
        }
        onSave && onSave();
      } catch (e) {
        alert("Erro ao salvar usuário!");
      }
    },
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <form onSubmit={formik.handleSubmit} className="bg-white p-6 rounded-lg shadow w-[400px] space-y-4">
        <h3 className="text-lg font-bold">{isEdit ? "Editar Usuário" : "Novo Usuário"}</h3>
        <div>
          <label className="block text-gray-700 mb-1">Nome</label>
          <input name="name" value={formik.values.name} onChange={formik.handleChange} className="input w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">E-mail</label>
          <input name="email" type="email" value={formik.values.email} onChange={formik.handleChange} className="input w-full border rounded px-2 py-1" />
        </div>
        {!isEdit && (
          <div>
            <label className="block text-gray-700 mb-1">Senha</label>
            <input name="password" type="password" value={formik.values.password} onChange={formik.handleChange} className="input w-full border rounded px-2 py-1" />
          </div>
        )}
        <div>
          <label className="block text-gray-700 mb-1">Perfis</label>
          <select multiple name="roles" value={formik.values.roles} onChange={formik.handleChange} className="input w-full border rounded px-2 py-1">
            {roles?.map(role => (
              <option key={role.id} value={role.name}>{role.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Permissões Extras</label>
          <select multiple name="permissions" value={formik.values.permissions} onChange={formik.handleChange} className="input w-full border rounded px-2 py-1">
            {permissions?.map(perm => (
              <option key={perm.id} value={perm.name}>{perm.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded">{isEdit ? "Salvar" : "Criar"}</button>
          <button type="button" className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
