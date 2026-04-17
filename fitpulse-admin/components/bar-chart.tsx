interface BarChartProps {
  data: { day: string; count: number }[]
}

export default function BarChart({ data }: BarChartProps) {
  const max = Math.max(...data.map(d => d.count))

  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => {
        const isLast = i === data.length - 1
        const pct = (d.count / max) * 100
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-semibold text-[#6b7280]">{d.count}</span>
            <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${pct}%`,
                  background: isLast ? '#FF4D00' : 'rgba(255,77,0,0.15)',
                }}
              />
            </div>
            <span className="text-[10px] text-[#6b7280]">{d.day}</span>
          </div>
        )
      })}
    </div>
  )
}
