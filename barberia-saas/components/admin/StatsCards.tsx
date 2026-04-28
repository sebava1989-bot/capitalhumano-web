interface Stat { label: string; value: string; sub?: string; color?: string }
export function StatsCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(s => (
        <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">{s.label}</p>
          <p className={`text-2xl font-bold ${s.color ?? 'text-white'}`}>{s.value}</p>
          {s.sub && <p className="text-zinc-500 text-xs mt-1">{s.sub}</p>}
        </div>
      ))}
    </div>
  )
}
