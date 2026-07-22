import React, { useState, useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { ChevronLeft, ChevronRight } from "lucide-react";

dayjs.locale("pt-br");
import { cn } from "@/lib/utils";

interface ExpressCalendarSingleProps {
    date: string | null;
    onChange: (date: string | null) => void;
}

export function ExpressCalendarSingle({ date, onChange }: ExpressCalendarSingleProps) {
    const [currentMonth, setCurrentMonth] = useState(dayjs(date || undefined).startOf("month"));
    
    const days = useMemo(() => {
        const start = currentMonth.startOf("month").startOf("week");
        const end = currentMonth.endOf("month").endOf("week");
        const res = [];
        let curr = start;
        while (curr.isBefore(end) || curr.isSame(end, "day")) {
            res.push(curr);
            curr = curr.add(1, "day");
        }
        return res;
    }, [currentMonth]);

    const handleDateClick = (clickedDate: dayjs.Dayjs) => {
        const dateStr = clickedDate.format("YYYY-MM-DD");
        onChange(dateStr);
    };

    const isSelected = (d: dayjs.Dayjs) => {
        return d.format("YYYY-MM-DD") === date;
    };

    return (
        <div className="w-[300px] bg-white rounded-3xl p-4 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 px-2">
                <button 
                    onClick={() => setCurrentMonth(prev => prev.subtract(1, "month"))}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft size={18} className="text-gray-500" />
                </button>
                <h4 className="font-bold text-gray-900 capitalize">
                    {currentMonth.format("MMMM YYYY")}
                </h4>
                <button 
                    onClick={() => setCurrentMonth(prev => prev.add(1, "month"))}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronRight size={18} className="text-gray-500" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                    <div key={i} className="text-[10px] font-black text-gray-300 text-center uppercase py-2">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => {
                    const active = isSelected(day);
                    const isOutside = !day.isSame(currentMonth, "month");
                    
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => handleDateClick(day)}
                            className={cn(
                                "h-9 w-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all relative",
                                isOutside ? "text-gray-200" : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-600",
                                active && "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-100 z-10"
                            )}
                        >
                            {day.date()}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Data Selecionada</span>
                </div>
                <button 
                    onClick={() => onChange(dayjs().format("YYYY-MM-DD"))}
                    className="text-[10px] font-bold text-gray-400 hover:text-emerald-600 uppercase"
                >
                    Hoje
                </button>
            </div>
        </div>
    );
}
