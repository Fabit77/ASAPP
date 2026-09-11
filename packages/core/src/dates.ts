/** Interpret a Chilean wall-clock time with the IANA zone's current DST rules. */
export function chileInstant(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))
    return "";
  const base = new Date(`${date}T${time}:00Z`);
  if (Number.isNaN(base.getTime())) return "";
  let result = base;
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Santiago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(result);
    const wall = new Date(parts.replace(" ", "T") + "Z");
    result = new Date(result.getTime() + base.getTime() - wall.getTime());
  }
  return result.toISOString();
}
