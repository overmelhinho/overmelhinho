// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/ui/ProgressBar.tsx
export default function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div className="h-full rounded-full bg-gray-900 transition-[width] duration-500" style={{ width: `${v}%` }} />
    </div>
  );
}
