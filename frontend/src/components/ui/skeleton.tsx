// src/components/ui/skeleton.tsx
export default function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-300 rounded ${className}`} />
  );
}
