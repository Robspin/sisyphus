interface Props {
  extracted: number;
  inferred: number;
  ambiguous: number;
}

export function ProvenanceBar({ extracted, inferred, ambiguous }: Props) {
  const total = Math.max(1, extracted + inferred + ambiguous);
  const e = (extracted / total) * 100;
  const i = (inferred / total) * 100;
  const a = (ambiguous / total) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-1 w-24 overflow-hidden rounded-full bg-muted ring-1 ring-border">
        <div className="bg-success transition-all" style={{ width: `${e}%` }} title={`extracted: ${extracted}`} />
        <div className="bg-warning transition-all" style={{ width: `${i}%` }} title={`inferred: ${inferred}`} />
        <div className="bg-danger transition-all"  style={{ width: `${a}%` }} title={`ambiguous: ${ambiguous}`} />
      </div>
      <span className="label-mono tabular-nums">{extracted}·{inferred}·{ambiguous}</span>
    </div>
  );
}
