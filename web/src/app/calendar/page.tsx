import { listGoals, vaultRoot } from '@/lib/vault';
import { calendarEvents } from '@/lib/schedule';
import { CalendarView } from '@/components/calendar-view';
import { SectionHeading } from '@/components/section-heading';

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
    <div>
      <SectionHeading
        eyebrow="60-day window"
        title="Calendar"
        description="Past 30 and next 30 days. Standups and research runs across active goals."
      />
      <CalendarView events={events} />
    </div>
  );
}
