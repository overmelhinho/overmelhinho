export default function DashboardMarketing({ user }) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Dashboard Marketing</h2>
      <p>Bem-vindo(a), {user?.name || "usuário"}!</p>
      {/* Coloque widgets específicos para marketing depois */}
    </div>
  );
}
