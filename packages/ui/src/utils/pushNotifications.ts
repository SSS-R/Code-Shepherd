/**
 * Web Push Notifications Utility
 * 
 * Subscribe to push notifications from the relay server
 */

// VAPID public key (will be fetched from server)
let vapidPublicKey = ''

/**
 * Set the VAPID public key from the server
 */
export function setVapidPublicKey(key: string) {
  vapidPublicKey = key
}

/**
 * Request permission and subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  // Check if browser supports push
  if (!('PushManager' in window)) {
    console.warn('Push notifications not supported')
    return null
  }

  // Request permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.log('Notification permission denied')
    return null
  }

  // Register service worker
  const registration = await navigator.serviceWorker.register('/service-worker.js')

  // Get VAPID key from server if not set
  if (!vapidPublicKey) {
    try {
      const res = await fetch('http://localhost:3000/health')
      const data = await res.json()
      // VAPID key would need to be exposed via an endpoint
      // For now, it needs to be configured manually
      console.warn('VAPID public key not configured')
      return null
    } catch (error) {
      console.error('Failed to fetch VAPID key:', error)
      return null
    }
  }

  // Subscribe to push notifications
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any
  })

  // Send subscription to server
  await fetch('http://localhost:3000/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  })

  console.log('Subscribed to push notifications')
  return subscription
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  
  if (!subscription) {
    return false
  }

  const success = await subscription.unsubscribe()
  
  if (success) {
    // Notify server
    await fetch('http://localhost:3000/notifications/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    })
  }

  return success
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
