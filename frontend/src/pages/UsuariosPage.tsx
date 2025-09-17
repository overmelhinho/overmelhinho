import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useState } from "react";
import UsuarioModal from "@/components/UsuarioModal";
import Table from "@/components/Table";
import Badge from "@/components/Badge";

export default function UsuariosPage() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery("users", () => api.get("/users").then(res => res.data));
  const { data: roles } = useQuery("roles", () => api.get("/roles").then(res => res.data));
  const { data: permissions } = useQuery("permissions", () => api.get("/permissions").then(res => res.data));
  const [modalUser, setModalUser] = useState(null);

  const deleteMutation = useMutation(
    (id) => api.delete(`/users/${id}`),
    { 
      onSuccess: () => queryClient.invalidateQueries("users"),
      onError: () => alert("Erro ao excluir usuário!")
    }
  );

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <button className="bg-red-700 hover:bg-red-800 text-white rounded-lg px-4 py-2 font-semibold" onClick={() => setModalUser({})}>
          Novo Usuário
        </button>
      </div>
      <Table
        columns={[
          { label: "Nome", render: (u) => u.name },
          { label: "E-mail", render: (u) => u.email },
          { label: "Perfis", render: (u) => u.roles?.map(r => <Badge key={r.id} color="red">{r.name}</Badge>) },
          { label: "Permissões", render: (u) => u.permissions?.length > 0 ? u.permissions.map(p => <Badge key={p.id} color="gray">{p.name}</Badge>) : <span className="text-gray-400">-</span> },
          { label: "Ações", render: (u) => (
              <div className="flex gap-2">
                <button className="text-blue-600" onClick={() => setModalUser(u)}>Editar</button>
                <button className="text-red-600" onClick={() => {
                  if(window.confirm("Excluir este usuário?")) deleteMutation.mutate(u.id);
                }}>Excluir</button>
              </div>
            )
          }
        ]}
        data={users}
      />
      {modalUser && (
        <UsuarioModal
          user={modalUser}
          roles={roles}
          permissions={permissions}
          onClose={() => setModalUser(null)}
          onSave={() => {
            setModalUser(null);
            queryClient.invalidateQueries("users");
          }}
        />
      )}
    </div>
  );
}
