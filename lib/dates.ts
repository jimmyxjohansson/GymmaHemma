// Datumhjälp i enhetens lokala tid (för klientkomponenter).

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function localYmd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Snabbval för de kommande `n` dagarna. */
export function nextDays(n: number) {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = addDays(today, i);
    const top = i === 0 ? "Idag" : i === 1 ? "Imorgon" : d.toLocaleDateString("sv-SE", { weekday: "short" });
    return { ymd: localYmd(d), top, bottom: d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) };
  });
}

/** "idag", "imorgon" eller t.ex. "fredag 13 nov." */
export function dayLabel(ymd: string) {
  if (ymd === localYmd(new Date())) return "idag";
  if (ymd === localYmd(addDays(new Date(), 1))) return "imorgon";
  return parseYmd(ymd).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "short" });
}
