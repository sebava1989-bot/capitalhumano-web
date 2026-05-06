const stats = [
  { value: '24/7', label: 'Reservas online' },
  { value: '0', label: 'WhatsApps de agenda' },
  { value: '$15K', label: 'Al mes, todo incluido' },
]

export function Stats() {
  return (
    <div
      style={{
        backgroundColor: '#111111',
        borderTop: '1px solid rgba(245,158,11,0.2)',
        borderBottom: '1px solid rgba(245,158,11,0.2)',
      }}
    >
      <div className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-amber-400/20">
        {stats.map((s) => (
          <div key={s.label} className="px-6 py-10 text-center">
            <div
              className="leading-none text-amber-400"
              style={{ fontFamily: 'var(--font-anton)', fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
            >
              {s.value}
            </div>
            <div
              className="mt-2 text-sm text-zinc-500"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
