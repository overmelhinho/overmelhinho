import { cn } from "@/lib/utils";

export default function KpiCard({ icon: Icon, value, label, color, text }) {
  return (
    <div className={`relative group overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-transform duration-200 hover:-translate-y-1`}>
      {/* Glow por trás do ícone */}
      <div className={`absolute -top-4 -left-4 w-20 h-20 rounded-full blur-2xl opacity-30 z-0 ${color}`}></div>
      {/* Ícone principal */}
      <div className={`relative z-10 mb-3 flex h-12 w-12 items-center justify-center rounded-xl shadow-lg ${color}`}>
        <Icon className={`w-7 h-7 ${text}`} />
      </div>
      <div className="relative z-10">
        <div className="text-3xl font-extrabold tracking-tight text-gray-800">{value}</div>
        <div className="text-sm font-semibold text-gray-500">{label}</div>
      </div>
    </div>
  );
}
