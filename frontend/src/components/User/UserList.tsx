import { useState } from "react";
import {
  useUsers,
  useDeleteUser,
  useCreateUser,
  useUpdateUser,
  useToggleUserActive,
} from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Plus, Pencil, ShieldOff, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserForm, UserFormValues } from "./UserForm";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function UserList() {
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const toggleActive = useToggleUserActive();

  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [confirmToggle, setConfirmToggle] = useState<any>(null);

  const handleSaveUser = async (values: UserFormValues) => {
    if (editingUser) {
      await updateUser.mutateAsync({ id: editingUser.id, ...values });
    } else {
      await createUser.mutateAsync(values);
    }
    setOpen(false);
    setEditingUser(null);
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete) {
      await deleteUser.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const handleConfirmToggle = async () => {
    if (!confirmToggle) return;
    try {
      await toggleActive.mutateAsync(confirmToggle.id);
      toast.success(
        confirmToggle.is_active
          ? `Usuário ${confirmToggle.name} foi bloqueado.`
          : `Usuário ${confirmToggle.name} foi reativado.`
      );
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao alterar status do usuário.");
    } finally {
      setConfirmToggle(null);
    }
  };

  if (usersLoading || rolesLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-red-700" size={32} />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-red-700">Lista de Usuários</h2>

          <Dialog open={open && !editingUser} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#D62828] hover:bg-[#8B0000] text-white font-semibold rounded-full px-6"
                onClick={() => setEditingUser(null)}
              >
                <Plus size={16} className="mr-2" /> Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogTitle>Cadastro de Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo para criar um novo usuário.
              </DialogDescription>
              <UserForm
                roles={roles}
                onSubmit={handleSaveUser}
                loading={createUser.isLoading || updateUser.isLoading}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border rounded-md">
            <thead className="bg-red-700 text-white">
              <tr>
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">Nome</th>
                <th className="text-left p-2">E-mail</th>
                <th className="text-left p-2">Funções</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr
                  key={user.id}
                  className={cn(
                    "border-t transition-colors",
                    user.is_active === false
                      ? "bg-gray-50 opacity-70"
                      : "hover:bg-gray-50"
                  )}
                >
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2 font-medium">{user.name}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.roles?.map((r) => r.name).join(", ") || "—"}</td>
                  <td className="p-2">
                    {user.is_active === false ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                        <ShieldOff size={11} /> Bloqueado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700">
                        <ShieldCheck size={11} /> Ativo
                      </span>
                    )}
                  </td>
                  <td className="p-2 space-x-1">
                    <Dialog open={open && editingUser?.id === user.id} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => setEditingUser(user)}
                        >
                          <Pencil size={16} className="mr-1" /> Editar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogTitle>Editar Usuário</DialogTitle>
                        <DialogDescription>
                          Atualize os dados abaixo para o usuário selecionado.
                        </DialogDescription>
                        <UserForm
                          roles={roles}
                          initialValues={{
                            name: user.name,
                            email: user.email,
                            roles: user.roles ? user.roles.map(r => r.id) : [],
                          }}
                          onSubmit={handleSaveUser}
                          loading={createUser.isLoading || updateUser.isLoading}
                        />
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      className={cn(
                        "text-xs font-semibold",
                        user.is_active === false
                          ? "text-green-600 hover:text-green-800 hover:bg-green-50"
                          : "text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                      )}
                      onClick={() => setConfirmToggle(user)}
                      disabled={toggleActive.isLoading}
                    >
                      {user.is_active === false ? (
                        <><ShieldCheck size={14} className="mr-1" /> Reativar</>
                      ) : (
                        <><ShieldOff size={14} className="mr-1" /> Bloquear</>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => setConfirmDelete(user)}
                    >
                      <Trash2 size={16} className="mr-1" /> Excluir
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center p-4 text-gray-500">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Modal de Confirmar Exclusão */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          </AlertDialogHeader>
          <p>
            Tem certeza que deseja excluir o usuário <strong>{confirmDelete?.name}</strong>?
          </p>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmDelete} className="bg-red-600 text-white hover:bg-red-700">
              Confirmar Exclusão
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmar Bloquear/Reativar */}
      <AlertDialog open={!!confirmToggle} onOpenChange={(open) => !open && setConfirmToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmToggle?.is_active === false ? "Reativar usuário?" : "Bloquear usuário?"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-gray-600">
            {confirmToggle?.is_active === false
              ? <>O usuário <strong>{confirmToggle?.name}</strong> voltará a ter acesso ao sistema.</>
              : <>O usuário <strong>{confirmToggle?.name}</strong> perderá o acesso ao sistema imediatamente. Ele não conseguirá fazer login até ser reativado.</>
            }
          </p>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirmToggle(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmToggle}
              disabled={toggleActive.isLoading}
              className={cn(
                "text-white",
                confirmToggle?.is_active === false
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-orange-600 hover:bg-orange-700"
              )}
            >
              {toggleActive.isLoading
                ? "Aguarde..."
                : confirmToggle?.is_active === false
                  ? "Sim, Reativar"
                  : "Sim, Bloquear"
              }
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
