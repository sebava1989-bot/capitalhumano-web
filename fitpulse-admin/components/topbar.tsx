export default function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-extrabold text-[#1a1a1a]">{title}</h1>
      {subtitle && <p className="text-sm text-[#6b7280] mt-1">{subtitle}</p>}
    </div>
  )
}
