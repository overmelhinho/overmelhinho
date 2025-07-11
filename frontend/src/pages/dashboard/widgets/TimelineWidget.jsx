// src/pages/dashboard/widgets/TimelineWidget.jsx
export default function TimelineWidget({ eventos = [] }) {
  return (
    <div className="space-y-4">
      {eventos.length === 0 && <p className="text-gray-400">Nenhuma atividade recente.</p>}
      {eventos.map((evt, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-primary"></span>
          <div>
            <span className="font-bold">{evt.titulo}</span>
            <span className="ml-2 text-xs text-gray-400">{evt.data}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
