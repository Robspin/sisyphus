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
    <div className="flex h-1.5 w-32 overflow-hidden rounded">
      <div className="bg-emerald-500" style={{ width: `${e}%` }} title={`extracted: ${extracted}`} />
      <div className="bg-amber-500"   style={{ width: `${i}%` }} title={`inferred: ${inferred}`} />
      <div className="bg-red-500"     style={{ width: `${a}%` }} title={`ambiguous: ${ambiguous}`} />
    </div>
  );
}
