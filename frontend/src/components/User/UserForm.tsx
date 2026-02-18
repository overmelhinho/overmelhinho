import { useFormik } from "formik";
import * as Yup from "yup";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DialogFooter } from "@/components/ui/dialog";
import Select from "react-select";

export type UserFormValues = {
  name: string;
  email: string;
  password?: string;
  roles: string[];
};

interface Props {
  initialValues?: UserFormValues;
  roles: { id: string; name: string }[];
  onSubmit: (values: UserFormValues) => void;
  loading?: boolean;
}

export function UserForm({ initialValues, roles, onSubmit, loading }: Props) {
  // 🔒 Monta as opções de forma segura
  const roleOptions = Array.isArray(roles)
    ? roles.map((role) => ({
        value: String(role.id),
        label: role.name,
      }))
    : [];

  const formik = useFormik<UserFormValues>({
    initialValues: initialValues || {
      name: "",
      email: "",
      password: "",
      roles: [],
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().required("Nome é obrigatório"),
      email: Yup.string().email("Email inválido").required("Email é obrigatório"),
      password: !initialValues
        ? Yup.string().min(6, "Mínimo 6 caracteres").required("Senha obrigatória")
        : Yup.string(),
      roles: Yup.array().min(1, "Selecione pelo menos uma função"),
    }),
    onSubmit: (values) => {
      onSubmit(values);
    },
  });

  useEffect(() => {
    if (formik.status === "success") {
      toast.success("Usuário salvo com sucesso!");
    }
  }, [formik.status]);

  // 🔒 Evita falha ao montar value do react-select
  const safeSelected =
    Array.isArray(roleOptions) && Array.isArray(formik.values.roles)
      ? roleOptions.filter((opt) => formik.values.roles.includes(opt.value))
      : [];

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl shadow-lg"
    >
      <div>
        <Label htmlFor="name" className="text-[#212529]">
          Nome completo
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Digite o nome"
          className="mt-1"
          value={formik.values.name}
          onChange={formik.handleChange}
          autoComplete="name"
        />
        {formik.touched.name && formik.errors.name && (
          <p className="text-red-500 text-sm mt-1">{formik.errors.name}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email" className="text-[#212529]">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="email@exemplo.com"
          className="mt-1"
          value={formik.values.email}
          onChange={formik.handleChange}
          autoComplete="email"
        />
        {formik.touched.email && formik.errors.email && (
          <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>
        )}
      </div>

      {!initialValues && (
        <div className="md:col-span-2">
          <Label htmlFor="password" className="text-[#212529]">
            Senha de acesso
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="********"
            className="mt-1"
            autoComplete="new-password"
            value={formik.values.password}
            onChange={formik.handleChange}
          />
          {formik.touched.password && formik.errors.password && (
            <p className="text-red-500 text-sm mt-1">{formik.errors.password}</p>
          )}
        </div>
      )}

      <div className="md:col-span-2">
        <Label htmlFor="roles" className="text-[#212529]">
          Funções do usuário
        </Label>
        <Select
          id="roles"
          isMulti
          options={roleOptions}
          value={safeSelected}
          onChange={(selected) => {
            const values = Array.isArray(selected)
              ? selected.map((opt) => opt.value)
              : [];
            formik.setFieldValue("roles", values);
          }}
          className="mt-1 text-sm"
          classNamePrefix="react-select"
          placeholder="Selecione uma ou mais funções"
          isDisabled={!!loading}
        />
        {formik.touched.roles && formik.errors.roles && (
          <p className="text-red-500 text-sm mt-1">
            {formik.errors.roles as string}
          </p>
        )}
      </div>

      <DialogFooter className="md:col-span-2">
        <Button
          type="submit"
          className="bg-[#D62828] hover:bg-[#8B0000] text-white font-semibold px-6 rounded-full"
          disabled={!!loading}
        >
          {loading ? "Salvando..." : "Salvar Usuário"}
        </Button>
      </DialogFooter>
    </form>
  );
}
