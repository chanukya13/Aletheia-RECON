const units: Record<
  string,
  { dimension: string; factor: number; base: string }
> = {
  g: { dimension: "mass", factor: 1, base: "g" },
  mg: { dimension: "mass", factor: 0.001, base: "g" },
  kg: { dimension: "mass", factor: 1000, base: "g" },
  L: { dimension: "volume", factor: 1000, base: "mL" },
  mL: { dimension: "volume", factor: 1, base: "mL" },
  µL: { dimension: "volume", factor: 0.001, base: "mL" },
  μL: { dimension: "volume", factor: 0.001, base: "mL" },
  second: { dimension: "time", factor: 1, base: "second" },
  minute: { dimension: "time", factor: 60, base: "second" },
  hour: { dimension: "time", factor: 3600, base: "second" },
  day: { dimension: "time", factor: 86400, base: "second" },
};
export function convertQuantity(
  value: number,
  from: string,
  to: string,
): number {
  if (!Number.isFinite(value)) throw new Error("NONFINITE_QUANTITY");
  const a = units[from],
    b = units[to];
  if (!a || !b || a.dimension !== b.dimension)
    throw new Error("INCOMMENSURATE_UNITS");
  return Number(((value * a.factor) / b.factor).toPrecision(14));
}
export function normalizedQuantity(value: number, unit: string) {
  const u = units[unit];
  if (!u) return { value, unit, dimension: "unknown", normalized: false };
  return {
    value: convertQuantity(value, unit, u.base),
    unit: u.base,
    dimension: u.dimension,
    normalized: true,
  };
}
