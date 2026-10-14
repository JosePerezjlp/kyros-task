interface Props {
  label: string
  value: number
  tone?: 'default' | 'danger' | 'warning'
}

const TONES = {
  default: 'text-slate-900',
  danger: 'text-red-600',
  warning: 'text-amber-600',
}

export default function ReportCard({ label, value, tone = 'default' }: Props) {
  return (
    <div className="card">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${TONES[tone]}`}>{value}</p>
    </div>
  )
}
