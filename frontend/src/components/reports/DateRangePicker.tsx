import React, { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
    Calendar as CalendarIcon, 
    ChevronLeft, 
    ChevronRight,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onRangeChange: (start: string, end: string) => void;
}

export function DateRangePicker({ startDate, endDate, onRangeChange }: DateRangePickerProps) {
    const [open, setOpen] = useState(false);

    const presets = [
        { label: "Hoje", getRange: () => ({ start: new Date(), end: new Date() }) },
        { label: "Ontem", getRange: () => ({ start: subDays(new Date(), 1), end: subDays(new Date(), 1) }) },
        { label: "Este Mês", getRange: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
        { label: "Mês Passado", getRange: () => {
            const prev = subMonths(new Date(), 1);
            return { start: startOfMonth(prev), end: endOfMonth(prev) };
        }},
        { label: "Últimos 7 dias", getRange: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
        { label: "Últimos 30 dias", getRange: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
        { label: "Todo o Ano", getRange: () => ({ start: startOfYear(new Date()), end: endOfYear(new Date()) }) },
    ];

    const handlePreset = (getRange: () => { start: Date, end: Date }) => {
        const { start, end } = getRange();
        onRangeChange(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
        setOpen(false);
    };

    const displayRange = () => {
        if (!startDate || !endDate) return "Selecionar Período";
        const start = new Date(startDate + "T00:00:00");
        const end = new Date(endDate + "T00:00:00");
        return `${format(start, "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                        "w-full justify-between rounded-xl border-gray-100 bg-gray-50/50 h-10 px-4 text-xs font-bold transition-all hover:bg-white hover:border-red-200",
                        !startDate && "text-muted-foreground"
                    )}
                >
                    <div className="flex items-center gap-2 text-gray-700">
                        <CalendarIcon className="h-4 w-4 text-red-600" />
                        {displayRange()}
                    </div>
                    <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[480px] p-0 rounded-2xl border-gray-100 shadow-2xl overflow-hidden" align="start">
                <div className="flex flex-col md:flex-row">
                    {/* Presets Sidebar */}
                    <div className="w-full md:w-36 bg-gray-50/50 border-r border-gray-100 p-3 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 px-2">Atalhos</p>
                        {presets.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => handlePreset(preset.getRange)}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {/* Custom Inputs and Info */}
                    <div className="flex-1 p-5 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Search className="h-4 w-4 text-red-600" />
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Período Personalizado</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Data Inicial</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => onRangeChange(e.target.value, endDate)}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Data Final</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => onRangeChange(startDate, e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex justify-end">
                            <Button 
                                onClick={() => setOpen(false)}
                                className="bg-[#B70F0A] hover:bg-[#8e0c08] text-white rounded-xl font-bold text-xs h-9 px-6"
                            >
                                Aplicar Filtro
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
