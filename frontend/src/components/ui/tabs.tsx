// src/components/ui/tabs.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TabsProps {
  selectedIndex: number;
  onChange: (index: number) => void;
  children: ReactNode[];
}

interface TabProps {
  title: ReactNode;
  children: ReactNode;
}

export function Tabs({ selectedIndex, onChange, children }: TabsProps) {
  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {children.map((child: any, index: number) => (
          <button
            key={index}
            onClick={() => onChange(index)}
            className={cn(
              "flex items-center px-4 py-2 rounded-2xl text-sm shadow-sm whitespace-nowrap transition-all duration-200",
              selectedIndex === index
                ? 'bg-[#B70F0A] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
            aria-selected={selectedIndex === index}
          >
            {child.props.title}
          </button>
        ))}
      </div>

      {/* Exibe apenas a aba ativa sem qualquer efeito */}
      <div>{children[selectedIndex]}</div>
    </div>
  );
}

export function Tab({ children }: TabProps) {
  return <div>{children}</div>;
}
