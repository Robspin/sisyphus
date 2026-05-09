import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-signal">Error · 404</div>
      <h1 className="mt-3 font-mono text-7xl font-semibold tracking-tight text-foreground tabular-nums">
        404
      </h1>
      <p className="mt-4 max-w-sm text-sm text-muted-foreground">
        That page does not exist. The vault may be out of sync — try refreshing,
        or head back to a known surface.
      </p>
      <div className="mt-6 flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-signal/60 hover:text-signal transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/goals"
          className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Goals
        </Link>
      </div>
    </div>
  );
}
