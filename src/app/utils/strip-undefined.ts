// Firestore rejects any field whose value is `undefined` outright (it must
// be omitted entirely, or set to null) — but optional model fields left
// blank in a form (e.g. Trip.budget) end up as literal `undefined` when
// spread into a write payload. Strip them here instead of at every call site.
export function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}
