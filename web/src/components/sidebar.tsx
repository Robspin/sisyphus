'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Target, Calendar, Search, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/', label: 'Dashboard', icon: Home, key: 'dashboard' },
  { href: '/goals', label: 'Goals', icon: Target, key: 'goals' },
  { href: '/calendar', label: 'Calendar', icon: Calendar, key: 'calendar' },
  { href: '/research', label: 'Research', icon: Search, key: 'research' },
  { href: '/log', label: 'Log', icon: ScrollText, key: 'log' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname() ?? '/';
  return (
    <nav className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground p-4 flex flex-col gap-6 sticky top-0 h-screen">
      <div className="flex items-center gap-2.5 px-1">
        <div className="relative h-7 w-7 rounded-md bg-foreground text-background flex items-center justify-center overflow-hidden ring-1 ring-foreground/20">
          <span className="font-mono font-bold text-[13px] leading-none">S</span>
          <span className="absolute inset-x-0 bottom-0 h-px bg-signal" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-semibold text-sm tracking-tight">Sisyphus</span>
          <span className="label-mono mt-1">vault · v0.1</span>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <div className="label-mono px-2 mb-2">Navigation</div>
        {ITEMS.map(({ href, label, icon: Icon, key }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={key}
              href={href}
              data-active={active}
              className={cn(
                'group relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                'hover:bg-sidebar-accent',
                active
                  ? 'bg-sidebar-accent text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 -translate-x-4 rounded-r bg-signal" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="label-mono">Operational</span>
        </div>
      </div>
    </nav>
  );
}
