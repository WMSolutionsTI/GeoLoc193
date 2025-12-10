import webpush from "web-push";

// VAPID keys for web push notifications
// IMPORTANT: In production, always use environment variables
// Generate keys with: npx web-push generate-vapid-keys
const DEFAULT_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
const DEFAULT_PRIVATE_KEY = "UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || DEFAULT_PRIVATE_KEY;

// Warn if using default keys in production
if (process.env.NODE_ENV === "production" && 
    (vapidPublicKey === DEFAULT_PUBLIC_KEY || vapidPrivateKey === DEFAULT_PRIVATE_KEY)) {
  console.warn("⚠️  WARNING: Using default VAPID keys in production! Generate and set custom keys for security.");
}

webpush.setVapidDetails(
  "mailto:admin@geoloc193.com",
  vapidPublicKey,
  vapidPrivateKey
);

export { vapidPublicKey as VAPID_PUBLIC_KEY };

export type PushNotificationPayload = {
  title: string;
  body: string;
  url?: string;
  solicitacaoId?: number;
  icon?: string;
  badge?: string;
};

export async function sendPushNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscription: any,
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    if (!subscription) {
      console.warn("No push subscription available");
      return false;
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/",
      solicitacaoId: payload.solicitacaoId,
      icon: payload.icon || "/images/logo.png",
      badge: payload.badge || "/images/logo.png",
    });

    await webpush.sendNotification(subscription, notificationPayload);
    console.log("Push notification sent successfully");
    return true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    
    // If the subscription is no longer valid, we should remove it
    if (error.statusCode === 410) {
      console.log("Push subscription expired or invalid");
      return false;
    }
    
    return false;
  }
}
