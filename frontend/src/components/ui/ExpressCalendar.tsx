import React, { useState, useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

dayjs.locale("pt-br");
import { cn } from "@/lib/utils";

interface ExpressCalendarProps {
    startDate: string | null;
    endDate: string | null;
    onChange: (start: string | null, end: string | null) => void;
}

export function ExpressCalendar({ startDate, endDate, onChange }: ExpressCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(dayjs(startDate || undefined).startOf("month"));
    
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

    const handleDateClick = (date: dayjs.Dayjs) => {
        const dateStr = date.format("YYYY-MM-DD");
        
        if (!startDate || (startDate && endDate)) {
            onChange(dateStr, null);
        } else {
            if (date.isBefore(dayjs(startDate))) {
                onChange(dateStr, null);
            } else {
                onChange(startDate, dateStr);
            }
        }
    };

    const isSelected = (date: dayjs.Dayjs) => {
        const d = date.format("YYYY-MM-DD");
        return d === startDate || d === endDate;
    };

    const isInRange = (date: dayjs.Dayjs) => {
        if (!startDate || !endDate) return false;
        return date.isAfter(dayjs(startDate)) && date.isBefore(dayjs(endDate));
    };

    return (
        <div className="w-[320px] bg-white rounded-3xl p-4 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
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

            <div className="flex gap-2 mb-4 px-2">
                <div className="flex-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Início</label>
                    <input 
                        type="date" 
                        value={startDate || ""}
                        onChange={(e) => {
                            const val = e.target.value || null;
                            onChange(val, endDate);
                            if (val) setCurrentMonth(dayjs(val).startOf("month"));
                        }}
                        className="w-full text-xs font-bold text-gray-700 bg-gray-50 border border-gray-100 rounded-xl px-2 py-1.5 outline-none focus:border-[#B70F0A] focus:bg-white transition-all"
                    />
                </div>
                <div className="flex-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Fim</label>
                    <input 
                        type="date" 
                        value={endDate || ""}
                        onChange={(e) => {
                            const val = e.target.value || null;
                            onChange(startDate, val);
                            if (!startDate && val) setCurrentMonth(dayjs(val).startOf("month"));
                        }}
                        className="w-full text-xs font-bold text-gray-700 bg-gray-50 border border-gray-100 rounded-xl px-2 py-1.5 outline-none focus:border-[#B70F0A] focus:bg-white transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {["D", "S", "T", "Q", "Q", "S", "S"].map(d => (
                    <div key={d} className="text-[10px] font-black text-gray-300 text-center uppercase py-2">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => {
                    const active = isSelected(day);
                    const range = isInRange(day);
                    const isOutside = !day.isSame(currentMonth, "month");
                    
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => handleDateClick(day)}
                            className={cn(
                                "h-9 w-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all relative",
                                isOutside ? "text-gray-200" : "text-gray-700 hover:bg-red-50 hover:text-[#B70F0A]",
                                active && "bg-[#B70F0A] text-white hover:bg-[#B70F0A] shadow-lg shadow-red-100 z-10",
                                range && "bg-red-50 text-[#B70F0A] rounded-none first:rounded-l-xl last:rounded-r-xl"
                            )}
                        >
                            {day.date()}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#B70F0A]" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Período Selecionado</span>
                </div>
                <button 
                    onClick={() => onChange(null, null)}
                    className="text-[10px] font-bold text-gray-400 hover:text-red-600 uppercase"
                >
                    Limpar
                </button>
            </div>
        </div>
    );
}
