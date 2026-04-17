interface StatCardProps {
  label: string
  value: string | number
  sub: string
  color?: string
}

export default function StatCard({ label, value, sub, color = '#1a1a1a' }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
      <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-black mb-1" style={{ color }}>{value}</p>
      <p className="text-[11px] text-[#6b7280]">{sub}</p>
    </div>
  )
}
