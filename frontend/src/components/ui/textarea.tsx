// src/components/ui/textarea.tsx
import React from 'react';

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function Textarea({ className = '', ...props }: Props) {
  return (
    <textarea
      className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#B70F0A] focus:ring-[#B70F0A] focus:outline-none focus:ring-1 ${className}`}
      {...props}
    />
  );
}
