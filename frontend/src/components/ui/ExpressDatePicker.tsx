import React from "react";
import dayjs from "dayjs";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ExpressCalendarSingle } from "./ExpressCalendarSingle";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpressDatePickerProps {
    date: string | null;
    onChange: (date: string | null) => void;
    className?: string;
}

export function ExpressDatePicker({ date, onChange, className }: ExpressDatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white py-2 px-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500",
                        !date && "text-gray-400",
                        className
                    )}
                >
                    <span>
                        {date ? dayjs(date).format("DD/MM/YYYY") : "Selecione uma data"}
                    </span>
                    <CalendarIcon size={16} className="text-gray-400" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-none shadow-none bg-transparent" align="center">
                <ExpressCalendarSingle date={date} onChange={onChange} />
            </PopoverContent>
        </Popover>
    );
}
