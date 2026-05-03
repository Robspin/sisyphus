import Link from 'next/link';
import { Home, Target, Calendar, Search, ScrollText } from 'lucide-react';

const ITEMS = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/research', label: 'Research', icon: Search },
  { href: '/log', label: 'Log', icon: ScrollText },
];

export function Sidebar() {
  return (
    <nav className="w-56 border-r bg-muted/40 p-3 flex flex-col gap-1">
      <div className="px-2 py-2 text-sm font-semibold">Sisyphus</div>
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
