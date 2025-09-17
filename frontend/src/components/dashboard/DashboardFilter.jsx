import { useState } from "react";
import dayjs from "dayjs";

export default function DashboardFilter({ onChange }) {
  const [start, setStart] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [end, setEnd] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <input
        type="date"
        value={start}
        onChange={e => setStart(e.target.value)}
        className="input border px-3 py-2 rounded-xl"
      />
      <span>a</span>
      <input
        type="date"
        value={end}
        onChange={e => setEnd(e.target.value)}
        className="input border px-3 py-2 rounded-xl"
      />
      <button
        onClick={() => onChange({ start, end })}
        className="ml-2 bg-primary text-white rounded-xl px-4 py-2 font-semibold hover:bg-primary/80 transition"
      >
        Filtrar
      </button>
    </div>
  );
}
