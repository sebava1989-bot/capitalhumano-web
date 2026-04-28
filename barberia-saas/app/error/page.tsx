export default function ErrorPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl mb-4">⚠️</p>
      <h1 className="text-2xl font-bold mb-2">Link inválido o expirado</h1>
      <p className="text-zinc-400 mb-6">El link que usaste ya no es válido. Intenta de nuevo.</p>
      <a href="/" className="px-6 py-3 bg-yellow-400 text-black font-bold rounded-full hover:bg-yellow-300 transition-colors">
        Volver al inicio
      </a>
    </main>
  )
}
