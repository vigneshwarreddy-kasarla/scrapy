export function formatMoney(value: string | number | null | undefined): string {
  if (value == null) return "₹ 0.00";
  if (typeof value === "number") return `₹ ${value.toFixed(2)}`;

  const raw = value.trim();
  if (!raw) return "₹ 0.00";
  if (raw === "—") return raw;
  if (raw.includes("₹")) return raw;
  if (/^rs\.?\s*/i.test(raw)) return raw.replace(/^rs\.?\s*/i, "₹ ");
  return `₹ ${raw}`;
}
