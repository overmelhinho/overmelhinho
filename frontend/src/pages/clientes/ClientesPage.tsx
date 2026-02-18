import { Link } from "react-router-dom";

export default function ClientesPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#B70F0A]">Clientes</h1>

        {/* Template: botão simples; você pode trocar depois */}
        <Link
          to="/leads"
          className="px-4 py-2 rounded-md bg-[#B70F0A] text-white hover:bg-[#a00d08]"
        >
          Criar a partir de Lead
        </Link>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <p className="text-gray-700">
          Página template de Clientes (placeholder) — criada para evitar redirect
          para /dashboard ao navegar para <b>/clientes</b>.
        </p>

        <p className="text-gray-500 text-sm mt-2">
          Próximo passo: listar clientes, busca, paginação e botão “Novo”.
        </p>
      </div>
    </div>
  );
}
