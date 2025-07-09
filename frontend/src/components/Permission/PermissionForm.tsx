import { useFormik } from "formik";
import * as Yup from "yup";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCreatePermission, useUpdatePermission } from "@/hooks/usePermissions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function PermissionForm({ initialValues, onClose }) {
  const createPermission = useCreatePermission();
  const updatePermission = useUpdatePermission();
  const isLoading = createPermission.isLoading || updatePermission.isLoading;

  const formik = useFormik({
    initialValues: initialValues
      ? { 
          name: initialValues.name || "",
          display_name_pt: initialValues.display_name_pt || "",
        }
      : { 
          name: "",
          display_name_pt: "",
        },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().required("Nome obrigatório"),
      display_name_pt: Yup.string().max(255, "Máximo 255 caracteres"),
    }),
    onSubmit: async (values) => {
      try {
        if (initialValues && initialValues.id) {
          await updatePermission.mutateAsync({ id: initialValues.id, ...values });
        } else {
          await createPermission.mutateAsync(values);
        }
        toast.success("Permissão salva com sucesso!");
        onClose();
      } catch (e) {
        toast.error("Erro ao salvar permissão");
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome técnico (slug)</Label>
        <Input
          id="name"
          name="name"
          value={formik.values.name}
          onChange={formik.handleChange}
          disabled={isLoading}
        />
        {formik.touched.name && formik.errors.name && (
          <div className="text-red-500 text-sm mt-1">
            {formik.errors.name}
          </div>
        )}
      </div>
      <div>
        <Label htmlFor="display_name_pt">Nome em português</Label>
        <Input
          id="display_name_pt"
          name="display_name_pt"
          value={formik.values.display_name_pt}
          onChange={formik.handleChange}
          disabled={isLoading}
          placeholder="Ex: Aprovar Lead"
        />
        {formik.touched.display_name_pt && formik.errors.display_name_pt && (
          <div className="text-red-500 text-sm mt-1">
            {formik.errors.display_name_pt}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-red-700 text-white" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
          {initialValues ? "Salvar alterações" : "Criar Permissão"}
        </Button>
      </div>
    </form>
  );
}
