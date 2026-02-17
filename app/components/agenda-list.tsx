"use client";

import { useMemo, useState } from "react";
import type { Booking } from "@/core/types/booking";
import { DateTime } from "luxon";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

type Props = {
  bookings?: Booking[];
};

type ViewMode = "all" | "day" | "week";

export default function AgendaList({ bookings }: Props) {
  const [mode, setMode] = useState<ViewMode>("all");
  const [selected, setSelected] = useState(() => DateTime.now().startOf("day"));

  function toDateTime(d: Date) {
    return DateTime.fromJSDate(d);
  }

  function prev() {
    if (mode === "day") setSelected((s) => s.minus({ days: 1 }));
    else if (mode === "week") setSelected((s) => s.minus({ weeks: 1 }));
  }

  function next() {
    if (mode === "day") setSelected((s) => s.plus({ days: 1 }));
    else if (mode === "week") setSelected((s) => s.plus({ weeks: 1 }));
  }

  function goToday() {
    setSelected(DateTime.now().startOf("day"));
  }

  const groups = useMemo(() => {
    const map = new Map<string, Booking[]>();
    const arr = bookings ?? [];

    let startRange: DateTime | null = null;
    let endRange: DateTime | null = null;

    if (mode === "day") {
      startRange = selected.startOf("day");
      endRange = selected.endOf("day");
    } else if (mode === "week") {
      startRange = selected.startOf("week");
      endRange = selected.endOf("week");
    }

    for (const b of arr) {
      const dt = toDateTime(b.startTime);
      if (!dt.isValid) continue;

      if (startRange && endRange) {
        if (!(dt >= startRange && dt <= endRange)) continue;
      }

      const key = dt.toISODate();
      const group = map.get(key) ?? [];
      group.push(b);
      map.set(key, group);
    }

    // sort groups by date
    return new Map(
      Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])),
    );
  }, [bookings, mode, selected]);

  const hasBookings = Array.from(groups.values()).some(
    (group) => group.length > 0,
  );

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <ToggleGroup
          value={mode ? [mode] : []}
          onValueChange={(v) => setMode(v[0] as ViewMode)}
          variant="outline"
          spacing={2}
        >
          <ToggleGroupItem value="all">Todos</ToggleGroupItem>
          <ToggleGroupItem value="day">Día</ToggleGroupItem>
          <ToggleGroupItem value="week">Semana</ToggleGroupItem>
        </ToggleGroup>

        {(mode === "day" || mode === "week") && (
          <div className="ml-2 flex items-center gap-2">
            <button
              onClick={prev}
              className="rounded-md border px-2 py-1 text-sm"
            >
              ‹
            </button>
            <input
              type="date"
              className="rounded-md border px-2 py-1 text-sm"
              value={selected.toISODate()}
              onChange={(e) =>
                setSelected(
                  DateTime.fromISO(e.target.value).startOf(
                    "day",
                  ) as DateTime<true>,
                )
              }
            />
            <button
              onClick={next}
              className="rounded-md border px-2 py-1 text-sm"
            >
              ›
            </button>
            <button
              onClick={goToday}
              className="rounded-md border px-2 py-1 text-sm"
            >
              Hoy
            </button>
          </div>
        )}
      </div>

      {!hasBookings && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No hay reservas activas</EmptyTitle>
            <EmptyDescription>
              Revisa tu calendario o crea un servicio para recibir reservas.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {hasBookings && (
        <div className="mt-4 flex flex-col gap-4">
          {Array.from(groups.entries()).map(([date, items]) => (
            <div key={date} className="rounded-md border p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-semibold">
                  {DateTime.fromISO(date).toLocaleString(DateTime.DATE_HUGE)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {items.length} reservas
                </div>
              </div>

              <ul className="flex flex-col gap-2">
                {items
                  .sort((a, b) => +a.startTime - +b.startTime)
                  .map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between rounded p-2 bg-background/50"
                    >
                      <div>
                        <div className="font-medium">
                          {b.serviceName ?? "Servicio"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {b.guestName ?? "Cliente"}
                          {b.guestEmail ? ` • ${b.guestEmail}` : ""}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {toDateTime(b.startTime).toLocaleString(
                          DateTime.DATETIME_MED,
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
