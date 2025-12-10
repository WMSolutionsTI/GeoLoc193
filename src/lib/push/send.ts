import webpush from "web-push";

// Configure web-push with VAPID keys
// These should be stored in environment variables in production
// Generate keys with: npx web-push generate-vapid-keys
const vapidKeys = {
  publicKey:
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U",
  privateKey:
    process.env.VAPID_PRIVATE_KEY ||
    "UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls",
};

webpush.setVapidDetails(
  "mailto:admin@geoloc193.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

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
