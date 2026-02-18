import React, { useState, useEffect } from "react";
import axios from "@/services/api";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, X } from "lucide-react";

interface Segment {
  id: number;
  nome: string;
}

interface SegmentMultiSelectProps {
  value: number[];
  onChange: (val: number[]) => void;
}

export default function SegmentMultiSelect({ value, onChange }: SegmentMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [segmentos, setSegmentos] = useState<Segment[]>([]);

  useEffect(() => {
    axios.get("/v1/segmentos").then(({ data }) => setSegmentos(data));
  }, []);

  const toggleSegment = (id: number) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value.length > 0 ? `${value.length} segmento(s) selecionado(s)` : "Selecionar segmentos..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar segmento..." className="h-9" />
            <CommandEmpty>Nenhum segmento encontrado.</CommandEmpty>
            <CommandGroup>
              {segmentos.map((segmento) => (
                <CommandItem
                  key={segmento.id}
                  onSelect={() => toggleSegment(segmento.id)}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${value.includes(segmento.id) ? "opacity-100" : "opacity-0"}`}
                  />
                  {segmento.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((id) => {
            const label = segmentos.find((s) => s.id === id)?.nome || id;
            return (
              <Badge key={id} variant="secondary" className="flex items-center gap-1">
                {label}
                <X className="h-3 w-3 cursor-pointer" onClick={() => toggleSegment(id)} />
              </Badge>
            );
          })}
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Limpar tudo
          </Button>
        </div>
      )}
    </div>
  );
}
