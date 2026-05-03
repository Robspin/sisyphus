'use client';

import { useState, useMemo } from 'react';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EventDot } from './event-dot';
import type { DayButtonProps } from 'react-day-picker';
import type { CalendarEvent } from '@/lib/types';

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const [selected, setSelected] = useState<Date | undefined>(new Date());

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

  return (
    <div className="flex gap-6">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={setSelected}
        modifiers={{ hasEvents: (d) => byDate.has(d.toISOString().slice(0, 10)) }}
        modifiersClassNames={{ hasEvents: 'font-bold' }}
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
      <Sheet open={selectedEvents.length > 0} onOpenChange={() => {}}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedKey}</SheetTitle>
          </SheetHeader>
          <ul className="space-y-2 mt-4">
            {selectedEvents.map((e, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <EventDot kind={e.kind} />
                <span className="font-medium">{e.goalSlug}</span>
                <span className="text-muted-foreground">{e.kind}</span>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  );
}
