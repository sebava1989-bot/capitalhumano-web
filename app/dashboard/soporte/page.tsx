'use client';
import { useState } from 'react';
import { HeadphonesIcon, Smartphone, Mail, CheckCircle } from 'lucide-react';

export default function SoportePage() {
  const [form, setForm] = useState({ nombre: '', email: '', mensaje: '' });
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent('Soporte CapitalHumano - ' + form.nombre);
    const body = encodeURIComponent(`Nombre: ${form.nombre}\nEmail: ${form.email}\n\nMensaje:\n${form.mensaje}`);
    window.open(`mailto:soporte@tuamigodigital.cl?subject=${subject}&body=${body}`);
    setSent(true);
  }

  return (
    <div className="p-8 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Soporte</h2>
      <p className="text-gray-500 mb-8">Estamos aquí para ayudarte. Respuesta en menos de 24 horas hábiles.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HeadphonesIcon size={18} className="text-sky-600" /> Contactar soporte
          </h3>
          {sent ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle size={40} className="text-green-500 mb-3" />
              <p className="font-medium text-gray-900">¡Mensaje enviado!</p>
              <p className="text-sm text-gray-500 mt-1">Te responderemos pronto.</p>
              <button onClick={() => setSent(false)} className="mt-4 text-sm text-sky-600 hover:underline">
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tu nombre</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Juan Pérez" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email de contacto</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="tu@correo.cl" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">¿En qué podemos ayudarte?</label>
                <textarea value={form.mensaje} onChange={e => setForm({ ...form, mensaje: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                  rows={4} placeholder="Describe tu consulta o problema..." required />
              </div>
              <button type="submit"
                className="w-full bg-sky-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-sky-700 transition-colors">
                Enviar mensaje
              </button>
            </form>
          )}
        </div>

        <div className="bg-gradient-to-br from-sky-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <Smartphone size={24} className="text-white" />
          </div>
          <h3 className="font-bold text-lg mb-2">¿Necesitas una app a medida?</h3>
          <p className="text-sky-100 text-sm mb-4">
            CapitalHumano es desarrollada por <strong>Tu Amigo Digital SpA</strong>. Si necesitas una solución digital personalizada para tu empresa — una app, sistema de gestión, o automatización — podemos ayudarte.
          </p>
          <ul className="text-sky-100 text-sm space-y-1 mb-5">
            <li>✓ Apps móviles iOS y Android</li>
            <li>✓ Sistemas web a medida</li>
            <li>✓ Automatización de procesos</li>
            <li>✓ Integraciones y APIs</li>
          </ul>
          <a
            href="mailto:contacto@tuamigodigital.cl?subject=Consulta%20app%20a%20medida"
            className="block w-full bg-white text-sky-700 text-center rounded-lg py-2.5 text-sm font-bold hover:bg-sky-50 transition-colors"
          >
            <Mail size={14} className="inline mr-1" />
            Solicitar cotización gratis
          </a>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-600">
        <p className="font-medium text-gray-800 mb-1">Contacto directo</p>
        <p>Email soporte: <a href="mailto:soporte@tuamigodigital.cl" className="text-sky-600 hover:underline">soporte@tuamigodigital.cl</a></p>
        <p className="mt-0.5">Desarrollo a medida: <a href="mailto:contacto@tuamigodigital.cl" className="text-sky-600 hover:underline">contacto@tuamigodigital.cl</a></p>
      </div>
    </div>
  );
}
