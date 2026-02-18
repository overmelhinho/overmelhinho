import { motion } from "framer-motion";

interface StepProgressProps {
  steps: string[];
  currentStep: number;
}

export default function StepProgress({ steps, currentStep }: StepProgressProps) {
  const progress = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="relative w-full mb-8">
      {/* Linha de fundo */}
      <div className="absolute top-1/2 left-0 w-full h-[4px] bg-gray-200 rounded-full -translate-y-1/2" />

      {/* Linha de progresso animada */}
      <motion.div
        className="absolute top-1/2 left-0 h-[4px] bg-[#B70F0A] rounded-full -translate-y-1/2"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      />

      {/* Marcadores */}
      <div className="flex justify-between relative z-10">
        {steps.map((label, i) => {
          const isActive = i <= currentStep;
          const isCurrent = i === currentStep;

          return (
            <div key={i} className="flex flex-col items-center text-center w-full">
              <motion.div
                className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                  isActive
                    ? "bg-[#B70F0A] border-[#B70F0A] text-white"
                    : "bg-white border-gray-300 text-gray-500"
                }`}
                initial={{ scale: 0.9 }}
                animate={{ scale: isCurrent ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
              >
                {i + 1}
              </motion.div>
              <span
                className={`mt-2 text-xs ${
                  isActive ? "text-[#B70F0A] font-medium" : "text-gray-500"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
