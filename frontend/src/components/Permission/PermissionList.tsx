import { useState } from "react";
import { usePermissions } from "@/hooks/useRoles"; // aproveite esse hook se já buscar /v1/permissions
import { useCreatePermission, useUpdatePermission, useDeletePermission } from "@/hooks/usePermissions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import PermissionForm from "./PermissionForm";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PermissionList() {
  const { data: permissions = [], isLoading } = usePermissions();
  const deletePermission = useDeletePermission();
  const [open, setOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<any>(null);

  function handleEdit(permission) {
    setEditingPermission(permission);
    setOpen(true);
  }

  function handleNew() {
    setEditingPermission(null);
    setOpen(true);
  }

  async function handleDelete(permission) {
    if (window.confirm("Confirma a exclusão da permissão?")) {
      try {
        await deletePermission.mutateAsync(permission.id);
        toast.success("Permissão excluída!");
      } catch {
        toast.error("Erro ao excluir permissão!");
      }
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-red-700">Permissões</h2>
          <Button onClick={handleNew} className="bg-[#D62828] text-white rounded-full">
            <Plus size={16} className="mr-2" /> Nova Permissão
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border rounded-md">
            <thead className="bg-red-700 text-white">
              <tr>
                <th className="p-2 text-left">Nome</th>
                <th className="p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={2} className="text-center p-4">
                    <Loader2 className="mx-auto animate-spin" size={28} />
                  </td>
                </tr>
              ) : (
                permissions.map((permission) => (
                  <tr key={permission.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">
                      <span
                        className={
                          `px-2 py-0.5 rounded-full text-xs font-medium
                          ${permission.name.startsWith('manage')
                            ? 'bg-blue-100 text-blue-700'
                            : permission.name.startsWith('view')
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'}`
                        }
                      >
                        {/* Aqui prioriza o display_name_pt se houver */}
                        {permission.display_name_pt
                          ? permission.display_name_pt
                          : permission.name}
                      </span>
                      {/* Mostra o slug técnico embaixo, se tiver nome em português */}
                      {permission.display_name_pt && (
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          <span className="font-mono">({permission.name})</span>
                        </div>
                      )}
                    </td>
                    <td className="p-2 flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => handleEdit(permission)}
                        className="text-blue-700"
                      >
                        <Pencil size={16} className="mr-1" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(permission)}
                        className="text-red-700"
                        disabled={deletePermission.isLoading}
                      >
                        {deletePermission.isLoading ? (
                          <Loader2 className="animate-spin mr-1" size={16} />
                        ) : (
                          <Trash2 size={16} className="mr-1" />
                        )}
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))
              )}
              {(!isLoading && permissions.length === 0) && (
                <tr>
                  <td colSpan={2} className="text-center p-4 text-gray-500">
                    Nenhuma permissão cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogTitle>{editingPermission ? "Editar Permissão" : "Nova Permissão"}</DialogTitle>
            <PermissionForm
              initialValues={editingPermission}
              onClose={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
