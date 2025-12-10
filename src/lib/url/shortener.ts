import { db } from "@/lib/db";
import { shortUrls } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Generates a random short code of specified length
 */
function generateShortCode(length: number = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Creates a short URL for a given token
 * Returns the short code to be used in the URL
 */
export async function createShortUrl(originalToken: string): Promise<string> {
  // Check if a short URL already exists for this token
  const existing = await db
    .select()
    .from(shortUrls)
    .where(eq(shortUrls.originalToken, originalToken))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].shortCode;
  }

  // Generate a unique short code
  let shortCode = generateShortCode(6);
  let attempts = 0;
  const maxAttempts = 10;

  // Ensure uniqueness
  while (attempts < maxAttempts) {
    const existingCode = await db
      .select()
      .from(shortUrls)
      .where(eq(shortUrls.shortCode, shortCode))
      .limit(1);

    if (existingCode.length === 0) {
      break;
    }
    shortCode = generateShortCode(6);
    attempts++;
  }

  // Check if we exhausted all attempts without finding a unique code
  if (attempts >= maxAttempts) {
    throw new Error("Failed to generate unique short code after maximum attempts");
  }

  // Insert the new short URL
  await db.insert(shortUrls).values({
    shortCode,
    originalToken,
  });

  return shortCode;
}

/**
 * Gets the original token from a short code
 */
export async function getOriginalToken(shortCode: string): Promise<string | null> {
  const result = await db
    .select()
    .from(shortUrls)
    .where(eq(shortUrls.shortCode, shortCode))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0].originalToken;
}

/**
 * Builds the short URL for SMS
 */
export function buildShortUrl(shortCode: string): string {
  const appUrl = process.env.APP_URL || "https://sos193.org";
  return `${appUrl}/s/${shortCode}`;
}
