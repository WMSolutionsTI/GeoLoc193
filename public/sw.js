// Service Worker for Push Notifications
// This enables background notifications even when the browser is closed

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  // Ensure the service worker takes control of all pages immediately
  event.waitUntil(self.clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let notificationData = {
    title: 'GeoLoc193',
    body: 'Nova mensagem recebida',
    icon: '/images/logo.png',
    badge: '/images/logo.png',
    data: {
      url: '/',
    },
  };

  // Parse the push event data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: {
          url: data.url || notificationData.data.url,
          solicitacaoId: data.solicitacaoId,
        },
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
      // Use text content if JSON parsing fails
      notificationData.body = event.data.text();
    }
  }

  // Show the notification
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      tag: `solicitacao-${notificationData.data.solicitacaoId || 'general'}`,
      renotify: true,
      requireInteraction: false,
      vibrate: [200, 100, 200],
    }
  );

  event.waitUntil(promiseChain);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  // Get the URL from the notification data
  const urlToOpen = event.notification.data?.url || '/';

  // Focus on existing window or open a new one
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with this URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed:', event);
  
  // Re-subscribe to push notifications
  // Note: Without access to solicitacaoId here, we cannot update the subscription
  // The client-side code should handle re-registration when the user returns
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription?.options || { userVisibleOnly: true })
      .then((subscription) => {
        console.log('New subscription obtained:', subscription);
        // The subscription will be updated when the user next opens the chat
        return Promise.resolve();
      })
      .catch((error) => {
        console.error('Failed to re-subscribe:', error);
      })
  );
});
