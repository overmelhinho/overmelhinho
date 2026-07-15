import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { PenTool, Trash2, Check } from "lucide-react";

type SignaturePadProps = {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
};

export default function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const handleEnd = () => {
    setIsEmpty(sigCanvas.current?.isEmpty() ?? true);
  };

  const save = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      try {
        // Usar getCanvas direto é mais seguro no mobile para evitar erros de CORS/Limites no getTrimmedCanvas
        const dataUrl = sigCanvas.current.getCanvas().toDataURL("image/png");
        onSave(dataUrl);
      } catch (e) {
        console.error("Erro ao gerar imagem da assinatura", e);
        alert("Ocorreu um erro ao salvar a assinatura. Tente novamente.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="w-full flex items-center justify-between px-2">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <PenTool size={18} /> Assinatura do Cliente
        </h3>
        <button 
          onClick={clear}
          className="text-slate-400 hover:text-red-500 flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
        >
          <Trash2 size={14} /> Limpar
        </button>
      </div>

      <div className="w-full bg-white border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden shadow-inner relative h-[300px]">
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <span className="text-xl font-medium text-slate-400">Assine aqui</span>
          </div>
        )}
        <SignatureCanvas
          ref={sigCanvas}
          onEnd={handleEnd}
          penColor="#0f172a"
          canvasProps={{
            className: "w-full h-full",
          }}
        />
      </div>

      <div className="w-full flex gap-3 mt-4">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={save}
          disabled={isEmpty}
          className="flex-[2] py-3 px-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check size={20} />
          Confirmar Assinatura
        </button>
      </div>
    </div>
  );
}
