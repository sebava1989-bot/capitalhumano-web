'use client'
interface Props { referralCode: string; slug: string }
export function CopyReferralButton({ referralCode, slug }: Props) {
  function copy() {
    navigator.clipboard.writeText(`${window.location.origin}/${slug}/reservar?ref=${referralCode}`)
  }
  return (
    <button onClick={copy}
      className="text-xs bg-zinc-800 px-3 py-1 rounded-lg text-yellow-400 hover:bg-zinc-700">
      Copiar link
    </button>
  )
}
