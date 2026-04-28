// Firebase Messaging Service Worker
// Requiere configurar NEXT_PUBLIC_FIREBASE_* en Vercel

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// La config se inyecta vía /api/firebase-config o se hardcodea aquí
// En producción: reemplaza estos valores con los del proyecto Firebase
firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY || '',
  authDomain: self.FIREBASE_AUTH_DOMAIN || '',
  projectId: self.FIREBASE_PROJECT_ID || '',
  storageBucket: self.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: self.FIREBASE_APP_ID || '',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification ?? {}
  self.registration.showNotification(title ?? 'Barbería', {
    body: body ?? '',
    icon: icon ?? '/icon-192.png',
  })
})
