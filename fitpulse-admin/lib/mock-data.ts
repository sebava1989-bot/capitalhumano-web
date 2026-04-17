// lib/mock-data.ts

export const GYM_INFO = {
  name: 'PowerGym Santiago',
  code: 'GYM01',
  ownerName: 'Pedro González',
  plan: 'PRO',
}

export type PaymentStatus = 'paid' | 'overdue' | 'due_soon' | 'pending'

export interface Member {
  id: number
  name: string
  rut: string
  level: number
  points: number
  streak: number
  lastWorkout: string
  active: boolean
  phone: string
  email: string
  subscriptionPrice: number
  paymentDueDay: number    // día del mes en que vence su pago
  lastPaymentDate: string  // fecha del último pago realizado
}

const TODAY = new Date('2026-04-16')

export function getPaymentStatus(member: Member): PaymentStatus {
  const dueDate = new Date(TODAY.getFullYear(), TODAY.getMonth(), member.paymentDueDay)
  const lastPaid = new Date(member.lastPaymentDate)

  // Pagó este mes si lastPaymentDate es del mes actual
  const paidThisMonth =
    lastPaid.getFullYear() === TODAY.getFullYear() &&
    lastPaid.getMonth() === TODAY.getMonth()

  if (paidThisMonth) return 'paid'

  const daysUntilDue = Math.floor((dueDate.getTime() - TODAY.getTime()) / 86400000)

  if (daysUntilDue < 0) return 'overdue'      // ya pasó la fecha
  if (daysUntilDue <= 3) return 'due_soon'    // vence en 3 días o menos
  return 'pending'                             // aún falta tiempo
}

export function getDaysOverdue(member: Member): number {
  const dueDate = new Date(TODAY.getFullYear(), TODAY.getMonth(), member.paymentDueDay)
  const diff = Math.floor((TODAY.getTime() - dueDate.getTime()) / 86400000)
  return diff > 0 ? diff : 0
}

export function getDaysUntilDue(member: Member): number {
  const dueDate = new Date(TODAY.getFullYear(), TODAY.getMonth(), member.paymentDueDay)
  const diff = Math.floor((dueDate.getTime() - TODAY.getTime()) / 86400000)
  return diff >= 0 ? diff : 0
}

export const MEMBERS: Member[] = [
  {
    id: 1, name: 'Carlos Muñoz', rut: '12345678-9', level: 7, points: 2840, streak: 21,
    lastWorkout: '2026-04-16', active: true,
    phone: '+56912345678', email: 'carlos@email.cl',
    subscriptionPrice: 35000, paymentDueDay: 5, lastPaymentDate: '2026-03-05',   // OVERDUE
  },
  {
    id: 2, name: 'Valentina Ríos', rut: '23456789-0', level: 6, points: 2610, streak: 18,
    lastWorkout: '2026-04-16', active: true,
    phone: '+56923456789', email: 'valentina@email.cl',
    subscriptionPrice: 35000, paymentDueDay: 18, lastPaymentDate: '2026-03-18',  // DUE_SOON (18 abr, faltan 2 días)
  },
  {
    id: 3, name: 'Diego Soto', rut: '34567890-1', level: 6, points: 2340, streak: 14,
    lastWorkout: '2026-04-15', active: true,
    phone: '+56934567890', email: 'diego@email.cl',
    subscriptionPrice: 35000, paymentDueDay: 10, lastPaymentDate: '2026-04-10',  // PAID (pagó el 10 de abril)
  },
  {
    id: 4, name: 'Camila Torres', rut: '45678901-2', level: 5, points: 1980, streak: 9,
    lastWorkout: '2026-04-15', active: true,
    phone: '+56945678901', email: 'camila@email.cl',
    subscriptionPrice: 25000, paymentDueDay: 19, lastPaymentDate: '2026-03-19',  // DUE_SOON (19 abr, faltan 3 días)
  },
  {
    id: 5, name: 'Matías Lagos', rut: '56789012-3', level: 4, points: 1750, streak: 12,
    lastWorkout: '2026-04-14', active: true,
    phone: '+56956789012', email: 'matias@email.cl',
    subscriptionPrice: 25000, paymentDueDay: 25, lastPaymentDate: '2026-03-25',  // PENDING
  },
  {
    id: 6, name: 'Fernanda Vera', rut: '67890123-4', level: 4, points: 1520, streak: 7,
    lastWorkout: '2026-04-13', active: true,
    phone: '+56967890123', email: 'fernanda@email.cl',
    subscriptionPrice: 25000, paymentDueDay: 1, lastPaymentDate: '2026-03-01',   // OVERDUE
  },
  {
    id: 7, name: 'Sebastián Paz', rut: '78901234-5', level: 3, points: 1380, streak: 5,
    lastWorkout: '2026-04-12', active: true,
    phone: '+56978901234', email: 'sebas@email.cl',
    subscriptionPrice: 20000, paymentDueDay: 20, lastPaymentDate: '2026-03-20',  // PENDING (faltan 4 días)
  },
  {
    id: 8, name: 'Javiera Fuentes', rut: '89012345-6', level: 3, points: 1200, streak: 0,
    lastWorkout: '2026-04-04', active: true,
    phone: '+56989012345', email: 'javiera@email.cl',
    subscriptionPrice: 20000, paymentDueDay: 15, lastPaymentDate: '2026-04-15',  // PAID
  },
  {
    id: 9, name: 'Nicolás Araya', rut: '90123456-7', level: 2, points: 980, streak: 0,
    lastWorkout: '2026-04-06', active: true,
    phone: '+56990123456', email: 'nicolas@email.cl',
    subscriptionPrice: 20000, paymentDueDay: 8, lastPaymentDate: '2026-03-08',   // OVERDUE
  },
  {
    id: 10, name: 'Isidora Méndez', rut: '01234567-8', level: 2, points: 720, streak: 0,
    lastWorkout: '2026-04-08', active: false,
    phone: '+56901234567', email: 'isidora@email.cl',
    subscriptionPrice: 20000, paymentDueDay: 30, lastPaymentDate: '2026-03-30',  // PENDING
  },
]

export const WORKOUTS_PER_DAY = [
  { day: 'L', count: 8 },
  { day: 'M', count: 12 },
  { day: 'X', count: 6 },
  { day: 'J', count: 15 },
  { day: 'V', count: 17 },
  { day: 'S', count: 10 },
  { day: 'D', count: 12 },
]

export const ROUTINES = [
  {
    id: 1,
    name: 'Pecho y Tríceps',
    day: 'Martes / Viernes',
    exercises: [
      { name: 'Press banca plano', sets: 4, reps: 10, rest: 90 },
      { name: 'Press inclinado mancuernas', sets: 3, reps: 12, rest: 75 },
      { name: 'Aperturas en máquina', sets: 3, reps: 15, rest: 60 },
      { name: 'Fondos en paralelas', sets: 3, reps: 12, rest: 75 },
      { name: 'Press francés', sets: 3, reps: 12, rest: 60 },
    ],
  },
  {
    id: 2,
    name: 'Piernas y Glúteos',
    day: 'Lunes / Jueves',
    exercises: [
      { name: 'Sentadilla libre', sets: 4, reps: 8, rest: 120 },
      { name: 'Prensa de piernas', sets: 4, reps: 12, rest: 90 },
      { name: 'Hip thrust', sets: 4, reps: 12, rest: 90 },
      { name: 'Curl femoral', sets: 3, reps: 12, rest: 60 },
    ],
  },
  {
    id: 3,
    name: 'Espalda y Bíceps',
    day: 'Miércoles / Sábado',
    exercises: [
      { name: 'Dominadas asistidas', sets: 4, reps: 8, rest: 90 },
      { name: 'Remo con barra', sets: 4, reps: 10, rest: 90 },
      { name: 'Curl bíceps barra', sets: 3, reps: 12, rest: 60 },
    ],
  },
  {
    id: 4,
    name: 'Cardio HIIT',
    day: 'Miércoles',
    exercises: [
      { name: 'Burpees', sets: 4, reps: 10, rest: 60 },
      { name: 'Mountain climbers', sets: 4, reps: 20, rest: 45 },
      { name: 'Saltos de caja', sets: 3, reps: 12, rest: 60 },
    ],
  },
]

export const RECENT_ACTIVITY = [
  { emoji: '✅', text: 'Carlos completó "Pecho y Tríceps"', time: 'hace 2h' },
  { emoji: '🆕', text: 'Nuevo miembro: Ana González', time: 'hoy' },
  { emoji: '🏆', text: 'Valentina alcanzó Nivel 6', time: 'ayer' },
  { emoji: '✅', text: 'Diego completó "Piernas y Glúteos"', time: 'ayer' },
]

export const AT_RISK = MEMBERS.filter(m => {
  const last = new Date(m.lastWorkout)
  const today = new Date('2026-04-16')
  const diff = Math.floor((today.getTime() - last.getTime()) / 86400000)
  return diff >= 7
})

export const DASHBOARD_STATS = {
  activeMembers: MEMBERS.filter(m => m.active).length,
  workoutsToday: 12,
  avgStreak: parseFloat((MEMBERS.reduce((s, m) => s + m.streak, 0) / MEMBERS.length).toFixed(1)),
  atRisk: AT_RISK.length,
  overduePayments: MEMBERS.filter(m => getPaymentStatus(m) === 'overdue').length,
  dueSoonPayments: MEMBERS.filter(m => getPaymentStatus(m) === 'due_soon').length,
}
