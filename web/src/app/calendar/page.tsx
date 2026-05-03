import { listGoals, vaultRoot } from '@/lib/vault';
import { calendarEvents } from '@/lib/schedule';
import { CalendarView } from '@/components/calendar-view';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const root = vaultRoot();
  const goals = await listGoals(root);
  const active = goals.filter(g => g.frontmatter.status === 'active');
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 30);
  const to = new Date(today);
  to.setDate(to.getDate() + 30);
  const events = await calendarEvents(root, active, { from, to, now: today });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Calendar</h1>
      <CalendarView events={events} />
    </div>
  );
}
