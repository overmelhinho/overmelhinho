import { useFormik } from "formik";
import * as Yup from "yup";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Select from "react-select";
import { usePermissions, useCreateRole, useUpdateRole } from "@/hooks/useRoles";

export default function RoleForm({ initialValues, onClose }) {
  const { data: permissions = [] } = usePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const permissionOptions = permissions.map(p => ({
    value: p.id,
    label: p.name
  }));

  const formik = useFormik({
    initialValues: initialValues ? {
      name: initialValues.name,
      permissions: initialValues.permissions ? initialValues.permissions.map(p => p.id) : []
    } : {
      name: "",
      permissions: []
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().required("Nome obrigatório"),
      permissions: Yup.array().min(1, "Selecione pelo menos uma permissão"),
    }),
    onSubmit: async (values) => {
      if (initialValues && initialValues.id) {
        await updateRole.mutateAsync({ id: initialValues.id, ...values });
      } else {
        await createRole.mutateAsync(values);
      }
      onClose();
    }
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome da função</Label>
        <Input
          id="name"
          name="name"
          value={formik.values.name}
          onChange={formik.handleChange}
        />
        {formik.touched.name && formik.errors.name && (
          <div className="text-red-500 text-sm">{formik.errors.name}</div>
        )}
      </div>
      <div>
        <Label>Permissões</Label>
        <Select
          isMulti
          options={permissionOptions}
          value={permissionOptions.filter(opt => formik.values.permissions.includes(opt.value))}
          onChange={selected => formik.setFieldValue("permissions", selected.map(opt => opt.value))}
          placeholder="Selecione as permissões"
        />
        {formik.touched.permissions && formik.errors.permissions && (
          <div className="text-red-500 text-sm">{formik.errors.permissions}</div>
        )}
      </div>
      <Button type="submit" className="bg-red-700 text-white">{initialValues ? "Salvar alterações" : "Criar Função"}</Button>
    </form>
  );
}
