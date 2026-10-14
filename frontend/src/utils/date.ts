// Due dates travel as UTC midnight ISO strings; only the calendar day matters,
// so we work with the 'YYYY-MM-DD' part to avoid timezone shifts.

export function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : ''
}

export function formatDate(iso: string | null): string {
  if (!iso) return 'Sin fecha'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export function todayInput(): string {
  return new Date().toISOString().slice(0, 10)
}
