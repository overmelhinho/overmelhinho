import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface TabItem {
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export default function Tabs({ tabs, activeIndex, onChange }: TabsProps) {
  return (
    <div className="w-full">
      {/* Cabeçalho das Abas */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-4">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => onChange(index)}
            className={`relative px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
              activeIndex === index
                ? "bg-[#B70F0A] text-white shadow-md"
                : "text-gray-700 hover:text-[#B70F0A] hover:bg-gray-100"
            }`}
          >
            {tab.label}
            {activeIndex === index && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 w-full h-[3px] bg-[#B70F0A] rounded-t-md"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo da Aba */}
      <div className="relative bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm min-h-[250px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full"
          >
            {tabs[activeIndex]?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
