// c:\Dev\overmelhinho\frontend\src\components\ui\ImageCropper.tsx
import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import getCroppedImg from "@/utils/cropImage";
import { X, Scissors, ZoomIn } from "lucide-react";

interface ImageCropperProps {
  image: string | null;
  aspect: number;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  title?: string;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  image,
  aspect,
  onCropComplete,
  onCancel,
  title = "Ajustar Imagem",
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteCallback = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    try {
      if (!image || !croppedAreaPixels) return;
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!image) return null;

  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white rounded-[32px] border-none shadow-2xl">
        <DialogHeader className="p-6 border-b border-gray-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-[#B70F0A] rounded-xl">
               <Scissors size={20} />
            </div>
            <DialogTitle className="text-xl font-black text-gray-900 font-serif italic tracking-tight">
              {title}
            </DialogTitle>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </DialogHeader>

        <div className="px-6 py-3 bg-red-50/50 border-b border-red-50 flex items-start gap-3">
          <div className="p-1.5 bg-red-100 text-[#B70F0A] rounded-lg">
            <Scissors size={14} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-[#B70F0A] uppercase tracking-wider">Ajuste Obrigatório</p>
            <p className="text-[11px] text-gray-600 font-medium leading-tight">
              Sua imagem será ajustada para a proporção ideal do portal. Selecione a melhor área abaixo.
            </p>
          </div>
        </div>

        <div className="relative w-full h-[400px] bg-gray-900">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={onZoomChange}
            classes={{
                containerClassName: "rounded-b-[32px]",
            }}
          />
        </div>

        <div className="p-8 bg-white space-y-6">
          <div className="flex items-center gap-4">
            <ZoomIn size={18} className="text-gray-400" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(vals) => setZoom(vals[0])}
              className="flex-1"
            />
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-12 rounded-2xl font-bold border-gray-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="flex-[2] h-12 rounded-2xl bg-[#B70F0A] hover:bg-red-700 text-white font-black shadow-lg shadow-red-100 transition-all"
            >
              Finalizar Recorte
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  async function handleSave() {
    await handleCrop();
  }
};
