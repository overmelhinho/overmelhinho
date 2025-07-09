export default function Badge({ color = "red", children }) {
  const colorClass = {
    red: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-800",
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    yellow: "bg-yellow-100 text-yellow-800",
  }[color] || "bg-gray-100 text-gray-800";

  return (
    <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold mr-1 ${colorClass}`}>
      {children}
    </span>
  );
}
