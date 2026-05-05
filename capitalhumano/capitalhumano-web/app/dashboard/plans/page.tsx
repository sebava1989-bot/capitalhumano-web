'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, Zap } from 'lucide-react';

const PLANS = [
  {
    key: 'freemium',
    name: 'Gratis',
    price: '$0',
    period: '30 días',
    workers: 'hasta 5 trabajadores',
    features: ['Panel de administrador', 'Gestión de trabajadores', 'Solicitudes básicas'],
  },
  {
    key: 'pyme',
    name: 'Pyme',
    price: '$14.990',
    period: '/mes',
    workers: 'hasta 25 trabajadores',
    features: ['Todo lo del plan Gratis', 'Documentos y liquidaciones', 'Certificados con firma digital', 'Soporte prioritario'],
    highlight: true,
  },
  {
    key: 'empresa',
    name: 'Empresa',
    price: '$34.990',
    period: '/mes',
    workers: 'Trabajadores ilimitados',
    features: ['Todo lo del plan Pyme', 'App Flutter para trabajadores', 'Notificaciones push', 'API acceso'],
  },
];

export default function PlansPage() {
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem('ch_company');
    if (data) setCompany(JSON.parse(data));
  }, []);

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Mi Plan</h2>
      <p className="text-gray-500 mb-8">
        Plan actual: <span className="font-semibold capitalize text-sky-700">{company?.plan || 'freemium'}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        {PLANS.map(plan => (
          <div key={plan.key}
            className={`bg-white rounded-xl border-2 p-6 flex flex-col ${
              plan.highlight ? 'border-sky-500 shadow-lg' : 'border-gray-200'
            } ${company?.plan === plan.key ? 'ring-2 ring-sky-300' : ''}`}>
            {plan.highlight && (
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-2">Recomendado</span>
            )}
            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
            <div className="my-3">
              <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
              <span className="text-gray-500 text-sm ml-1">{plan.period}</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">{plan.workers}</p>
            <ul className="space-y-2 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle size={16} className="text-sky-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {company?.plan === plan.key ? (
                <div className="w-full text-center py-2 text-sm font-medium text-sky-700 bg-sky-50 rounded-lg">
                  Plan actual
                </div>
              ) : (
                <button
                  className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? 'bg-sky-600 text-white hover:bg-sky-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => alert('Integración Stripe disponible próximamente (Fase 4)')}
                >
                  <Zap size={14} className="inline mr-1" />
                  Upgrade a {plan.name}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-6">* Precios en CLP. IVA incluido.</p>
    </div>
  );
}
