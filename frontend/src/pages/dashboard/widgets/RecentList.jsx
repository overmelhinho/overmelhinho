export default function RecentList() {
  // Troque depois para buscar da API
  const items = [
    { type: "Lead", name: "João Silva", info: "Entrou no sistema" },
    { type: "Oportunidade", name: "Empresa XPTO", info: "Proposta enviada" },
    { type: "Cliente", name: "Maria Soluções", info: "Fechou negócio" },
  ];
  return (
    <div>
      <div className="text-lg font-semibold mb-3">Últimas Movimentações</div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="font-bold">{item.type}:</span>
            <span>{item.name}</span>
            <span className="text-gray-500 text-xs">{item.info}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
