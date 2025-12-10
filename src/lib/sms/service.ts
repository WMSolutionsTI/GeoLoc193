import { generateSmsMessage } from "./template-service";
import { createShortUrl, buildShortUrl } from "@/lib/url/shortener";

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface SendSMSParams {
  phoneNumber: string;
  message: string;
}

export async function sendSMS({ phoneNumber, message }: SendSMSParams): Promise<SMSResponse> {
  const username = process.env.SMSGATE_USERNAME;
  const password = process.env.SMSGATE_PASSWORD;

  if (! username || !password) {
    console.error("SMS Gateway credentials not configured");
    return { success: false, error: "SMS Gateway not configured" };
  }

  try {
    // Format phone number (ensure it has country code)
    const formattedPhone = phoneNumber.startsWith("+55")
      ? phoneNumber
      : `+55${phoneNumber.replace(/\D/g, "")}`;

    const response = await fetch("https://api.sms-gate.app/3rdparty/v1/message", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        phoneNumbers: [formattedPhone],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SMS API error:", errorText);
      return { success: false, error: `SMS API error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("SMS sending error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function buildLocationRequestMessage(
  solicitanteNome: string,
  linkToken: string
): Promise<string> {
  // Create a short URL to reduce SMS length and avoid blocking
  const shortCode = await createShortUrl(linkToken);
  const shortLink = buildShortUrl(shortCode);

  // Use rotating templates for anti-blocking strategy
  return generateSmsMessage(shortLink);
}