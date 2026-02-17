import type { Booking } from "@/core/types/booking";
import { DateTime } from "luxon";
import { useMemo, useState } from "react";

type Props = {
  bookings?: Booking[];
};

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function AgendaCalendar({ bookings }: Props) {
  const [viewMonth, setViewMonth] = useState(() =>
    DateTime.now().startOf("month"),
  );

  function toDateTime(value: Date) {
    return DateTime.fromJSDate(value);
  }

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings ?? []) {
      const dt = toDateTime(b.startTime);
      if (!dt.isValid) continue;
      const key = dt.toISODate();
      const arr = map.get(key) ?? [];
      arr.push(b);
      map.set(key, arr);
    }
    return map;
  }, [bookings]);

  const monthStart = viewMonth.startOf("month");
  const calendarStart = monthStart.startOf("week");

  const days = useMemo(
    () =>
      Array.from({ length: 42 }).map((_, i) => calendarStart.plus({ days: i })),
    [calendarStart],
  );

  function prevMonth() {
    setViewMonth((m) => m.minus({ months: 1 }));
  }

  function nextMonth() {
    setViewMonth((m) => m.plus({ months: 1 }));
  }

  function onMonthChange(monthIndex: number) {
    setViewMonth((m) => m.set({ month: monthIndex + 1 }));
  }

  function onYearChange(year: number) {
    setViewMonth((m) => m.set({ year }));
  }

  return (
    <div className="mt-4 grid gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-md border px-2 py-1 text-sm"
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <div className="text-sm font-semibold">
            {MONTH_NAMES[monthStart.month - 1]} {monthStart.year}
          </div>
          <button
            type="button"
            onClick={() => setViewMonth(DateTime.now().startOf("month"))}
            className="rounded-md border px-2 py-1 text-sm"
            aria-label="Ir al mes actual"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-md border px-2 py-1 text-sm"
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Mes"
            className="rounded-md border px-2 py-1 text-sm"
            value={String(monthStart.month - 1)}
            onChange={(e) => onMonthChange(Number(e.target.value))}
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          <input
            aria-label="Año"
            type="number"
            className="w-20 rounded-md border px-2 py-1 text-sm"
            value={String(monthStart.year)}
            onChange={(e) => onYearChange(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const key = day.toISODate();
          const items = bookingsByDate.get(key) ?? [];
          const isCurrentMonth = day.month === monthStart.month;

          return (
            <div
              key={key}
              className={`relative min-h-20 rounded-md border p-2 text-sm ${isCurrentMonth ? "bg-background" : "bg-muted/30"}`}
            >
              {items.length > 0 && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-white">
                    {items.length}
                  </span>
                </div>
              )}

              <div className="text-xs text-muted-foreground">{day.day}</div>
              <div className="mt-1 flex flex-col gap-1">
                {items.slice(0, 3).map((it) => (
                  <div
                    key={it.id}
                    className="rounded px-2 py-1 text-xs bg-primary/5"
                  >
                    <div className="font-medium">
                      {it.serviceName ?? "Servicio"}
                    </div>
                    <div className="text-muted-foreground">
                      {toDateTime(it.startTime).toLocaleString(
                        DateTime.TIME_SIMPLE,
                      )}{" "}
                      • {it.guestName ?? "Cliente"}
                    </div>
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{items.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
