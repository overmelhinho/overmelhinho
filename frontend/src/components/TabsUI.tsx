import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TabItem {
  id: number;
  label: string;
  icon?: React.ReactNode;
}

interface TabsUIProps {
  tabs: TabItem[];
  currentStep: number;
  setCurrentStep: (index: number) => void;
}

/**
 * TabsUI sem dependência de estado externo instável.
 * Inclui fallback de segurança e progress bar animada.
 */
export default function TabsUI({ tabs, currentStep, setCurrentStep }: TabsUIProps) {
  const progressWidth = tabs.length
    ? ((currentStep + 1) / tabs.length) * 100
    : 0;

  return (
    <div className="w-full">
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
        <motion.div
          className="absolute left-0 top-0 h-2 bg-[#B70F0A] rounded-full"
          animate={{ width: `${progressWidth}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
        />
      </div>

<div className="flex flex-wrap justify-center md:justify-start gap-2 overflow-x-auto scrollbar-hide">

        {tabs.map((tab, index) => {
          const active = index === currentStep;
          const completed = index < currentStep;

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium",
                active
                  ? "bg-[#B70F0A] text-white border-[#B70F0A]"
                  : completed
                  ? "bg-green-100 text-green-700 border-green-300"
                  : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
              )}
              type="button"
            >
              <div
                className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-full font-bold",
                  active
                    ? "bg-white text-[#B70F0A]"
                    : completed
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-white"
                )}
              >
                {tab.id}
              </div>
              <span>{tab.label}</span>
              {tab.icon && <span className="ml-1">{tab.icon}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
