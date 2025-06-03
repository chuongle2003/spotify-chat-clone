"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    date: {
        from: Date | undefined;
        to: Date | undefined;
    };
    setDate: (date: { from: Date | undefined; to: Date | undefined }) => void;
}

export function DatePicker({ date, setDate }: DatePickerProps) {
    return (
        <div className={cn("grid gap-2")}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "justify-start text-left font-normal bg-zinc-700 border-zinc-600",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "dd/MM/y", { locale: vi })} -{" "}
                                    {format(date.to, "dd/MM/y", { locale: vi })}
                                </>
                            ) : (
                                format(date.from, "dd/MM/y", { locale: vi })
                            )
                        ) : (
                            <span>Chọn ngày</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-zinc-800 border-zinc-700" align="center">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={{ from: date?.from, to: date?.to }}
                        onSelect={setDate}
                        numberOfMonths={2}
                        className="bg-zinc-800 text-white"
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
} 