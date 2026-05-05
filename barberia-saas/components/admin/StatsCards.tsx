interface Stat { label: string; value: string; sub?: string; color?: string }
export function StatsCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(s => (
        <div key={s.label}
          className="bg-gradient-to-b from-zinc-800/80 to-zinc-900 border border-zinc-700/60
            rounded-2xl p-4 transition-all duration-200
            shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]
            hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">{s.label}</p>
          <p className={`text-2xl font-bold ${s.color ?? 'text-white'}`}>{s.value}</p>
          {s.sub && <p className="text-zinc-500 text-xs mt-1">{s.sub}</p>}
        </div>
      ))}
    </div>
  )
}
