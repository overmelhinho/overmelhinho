export default function DashboardDefault({ user }) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">Dashboard Padrão</h2>
      <p>Bem-vindo(a), {user?.name || "usuário"}! Seu dashboard será personalizado em breve.</p>
    </div>
  );
}
