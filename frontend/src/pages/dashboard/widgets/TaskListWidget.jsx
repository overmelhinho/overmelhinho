export default function TaskListWidget({ tasks = [] }) {
  return (
    <div>
      {tasks.length === 0 && <p className="text-gray-400">Nenhuma tarefa encontrada.</p>}
      <ul className="space-y-2">
        {tasks.map((task, idx) => (
          <li key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-200">
            <input type="checkbox" checked={task.done} readOnly className="accent-primary" />
            <span className={task.done ? "line-through text-gray-400" : "font-medium"}>{task.titulo}</span>
            <span className="ml-auto text-xs text-gray-400">{task.prazo}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
