import Topbar from '@/components/topbar'
import { MEMBERS } from '@/lib/mock-data'

const MEDALS = ['🥇', '🥈', '🥉']

export default function RankingPage() {
  const sorted = [...MEMBERS].sort((a, b) => b.points - a.points)

  return (
    <>
      <Topbar title="Ranking" subtitle="Leaderboard de PowerGym Santiago" />
      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f5f5f7]">
              {['#', 'Miembro', 'Nivel', 'Puntos', 'Racha', 'Último entreno'].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => (
              <tr key={m.id} className={`border-b border-[#f5f5f7] last:border-0 ${i < 3 ? 'bg-orange-50/30' : 'hover:bg-[#fafafa]'}`}>
                <td className="px-5 py-3 text-lg">{i < 3 ? MEDALS[i] : <span className="text-sm text-[#6b7280] font-bold">#{i + 1}</span>}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-xs font-extrabold text-[#FF4D00]">{m.name[0]}</div>
                    <span className="text-sm font-semibold text-[#1a1a1a]">{m.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-[#6b7280]">Nivel {m.level}</td>
                <td className="px-5 py-3 text-sm font-extrabold text-[#FF4D00]">{m.points.toLocaleString()} pts</td>
                <td className="px-5 py-3 text-sm text-[#6b7280]">🔥 {m.streak} días</td>
                <td className="px-5 py-3 text-sm text-[#6b7280]">{m.lastWorkout}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
