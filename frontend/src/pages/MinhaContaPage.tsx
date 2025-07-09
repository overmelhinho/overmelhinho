import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function MinhaContaPage() {
  const { user } = useAuth();
  const [nome, setNome] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensagem("");
    setLoading(true);

    // Implemente a chamada API para atualizar nome/email/senha
    // Exemplo de PATCH: /v1/user
    try {
      // TODO: Substituir por chamada real do backend
      setTimeout(() => {
        setMensagem("Dados atualizados com sucesso!");
        setLoading(false);
        setSenhaAtual("");
        setNovaSenha("");
      }, 1200);
    } catch (err: any) {
      setMensagem("Ocorreu um erro ao salvar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-red-700 mb-6">Minha Conta</h2>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700 font-medium">Nome</label>
            <input
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-red-400"
              value={nome}
              onChange={e => setNome(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium">E-mail</label>
            <input
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-red-400"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <hr className="my-4" />
          <div className="text-lg text-gray-700 font-medium">Alterar senha</div>
          <div>
            <label className="block text-gray-700">Senha atual</label>
            <input
              className="w-full px-3 py-2 border rounded"
              type="password"
              value={senhaAtual}
              onChange={e => setSenhaAtual(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-gray-700">Nova senha</label>
            <input
              className="w-full px-3 py-2 border rounded"
              type="password"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
          <button
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
            type="submit"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar alterações"}
          </button>
          {mensagem && (
            <div className="text-green-600 mt-2 text-center">{mensagem}</div>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
}
