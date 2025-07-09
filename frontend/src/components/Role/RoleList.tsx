import { useState } from "react";
import { useRoles, useDeleteRole } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import RoleForm from "./RoleForm";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function RoleList() {
  const { data: roles = [], isLoading } = useRoles();
  const deleteRole = useDeleteRole();
  const [open, setOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  function handleEdit(role) {
    setEditingRole(role);
    setOpen(true);
  }

  function handleNew() {
    setEditingRole(null);
    setOpen(true);
  }

  async function handleDelete(role) {
    if (window.confirm("Confirma a exclusão da função?")) {
      await deleteRole.mutateAsync(role.id);
      toast.success("Função excluída!");
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-red-700">Funções (Roles)</h2>
          <Button onClick={handleNew} className="bg-[#D62828] text-white rounded-full">
            <Plus size={16} className="mr-2" /> Nova Função
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border rounded-md">
            <thead className="bg-red-700 text-white">
              <tr>
                <th className="p-2 text-left">Nome</th>
                <th className="p-2 text-left">Permissões</th>
                <th className="p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{role.name}</td>
                  <td className="p-2 flex flex-wrap gap-1">
                    {role.permissions?.length > 0
                      ? role.permissions.map((p) => (
                          <span
                            key={p.id}
                            className="bg-gray-200 px-2 py-0.5 rounded-full text-xs font-medium text-gray-700"
                          >
                            {p.name}
                          </span>
                        ))
                      : <span className="text-gray-400">Nenhuma</span>
                    }
                  </td>
                  <td className="p-2 flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleEdit(role)}
                      className="text-blue-700"
                    >
                      <Pencil size={16} className="mr-1" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(role)}
                      className="text-red-700"
                    >
                      <Trash2 size={16} className="mr-1" /> Excluir
                    </Button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center p-4 text-gray-500">
                    Nenhuma função cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogTitle>{editingRole ? "Editar Função" : "Nova Função"}</DialogTitle>
            <RoleForm
              initialValues={editingRole}
              onClose={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
