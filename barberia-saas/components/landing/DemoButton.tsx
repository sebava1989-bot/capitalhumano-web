interface DemoButtonProps {
  phone: string
  className?: string
}

export function DemoButton({ phone, className = '' }: DemoButtonProps) {
  const message = encodeURIComponent(
    'Hola, quiero agendar una demo gratuita de barberDesk para mi barbería.'
  )
  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block rounded-full bg-green-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-green-600 ${className}`}
    >
      Agendar demo gratuita
    </a>
  )
}
