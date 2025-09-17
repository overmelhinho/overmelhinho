export default function Table({ columns, data }) {
  return (
    <div className="overflow-x-auto rounded-lg shadow bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.label} className="p-3 text-left text-gray-600 font-bold">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data?.length ? data.map((row, idx) => (
            <tr key={row.id || idx} className="border-t hover:bg-gray-50">
              {columns.map((col, i) => (
                <td key={i} className="p-3">{col.render(row)}</td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} className="p-4 text-center text-gray-400">Nenhum registro encontrado</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
