'use client';

import { useState, useMemo } from 'react';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EventDot } from './event-dot';
import type { DayButtonProps } from 'react-day-picker';
import type { CalendarEvent, CalendarEventKind } from '@/lib/types';

const KIND_LABEL: Record<CalendarEventKind, string> = {
  'standup-done':   'standup completed',
  'standup-missed': 'standup missed',
  'standup-due':    'standup due',
  'research-done':  'research run',
  'research-due':   'research scheduled',
};

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [sheetOpen, setSheetOpen] = useState(false);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return map;
  }, [events]);

  const selectedKey = selected?.toISOString().slice(0, 10);
  const selectedEvents = (selectedKey && byDate.get(selectedKey)) || [];

  function handleSelect(d: Date | undefined) {
    setSelected(d);
    if (d && (byDate.get(d.toISOString().slice(0, 10))?.length ?? 0) > 0) {
      setSheetOpen(true);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <div className="rounded-lg border border-border bg-card p-3">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          modifiers={{ hasEvents: (d) => byDate.has(d.toISOString().slice(0, 10)) }}
          modifiersClassNames={{ hasEvents: 'font-semibold' }}
          components={{
            DayButton: (props: DayButtonProps) => {
              const key = props.day.isoDate;
              const dayEvents = byDate.get(key) ?? [];
              return (
                <CalendarDayButton {...props}>
                  <span>{props.day.date.getDate()}</span>
                  {dayEvents.length > 0 && (
                    <span className="flex gap-0.5 h-2">
                      {dayEvents.slice(0, 4).map((e, i) => (
                        <EventDot key={i} kind={e.kind} />
                      ))}
                    </span>
                  )}
                </CalendarDayButton>
              );
            },
          }}
        />
      </div>

      <div className="hidden lg:block flex-1 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-1 w-1 rounded-full bg-signal" />
          <span className="label-mono">Legend</span>
        </div>
        <ul className="grid grid-cols-1 gap-2">
          {(Object.entries(KIND_LABEL) as [CalendarEventKind, string][]).map(([kind, label]) => (
            <li key={kind} className="flex items-center gap-2 text-xs text-muted-foreground">
              <EventDot kind={kind} />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="font-mono">{selectedKey}</SheetTitle>
          </SheetHeader>
          <ul className="space-y-2 px-4">
            {selectedEvents.map((e, i) => (
              <li key={i} className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                <EventDot kind={e.kind} />
                <span className="font-mono text-xs text-foreground">{e.goalSlug}</span>
                <span className="ml-auto label-mono">{KIND_LABEL[e.kind]}</span>
              </li>
            ))}
            {selectedEvents.length === 0 && (
              <li className="text-sm text-muted-foreground px-3 py-2">No events on this day.</li>
            )}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  );
}
