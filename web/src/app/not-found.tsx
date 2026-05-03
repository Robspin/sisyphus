export default function NotFound() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="text-sm text-muted-foreground">
        That page does not exist. The vault may be out of sync — try refreshing.
      </p>
    </div>
  );
}
