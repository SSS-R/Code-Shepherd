/// <reference lib="webworker" />

// Service Worker for Web Push Notifications

const CACHE_NAME = 'code-shepherd-v1'

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html'
      ])
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  
  const options = {
    body: data.body || 'New notification',
    icon: '/icon-192.png',
    badge: '/badge-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      ...data.data
    },
    actions: [
      {
        action: 'approve',
        title: 'Approve',
        icon: '/icon-192.png'
      },
      {
        action: 'reject',
        title: 'Reject',
        icon: '/icon-192.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Code Shepherd', options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'approve') {
    // Handle approve action (would need to communicate with main thread)
    console.log('User clicked approve')
  } else if (event.action === 'reject') {
    // Handle reject action
    console.log('User clicked reject')
  } else {
    // Open the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus()
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/')
        }
      })
    )
  }
})
