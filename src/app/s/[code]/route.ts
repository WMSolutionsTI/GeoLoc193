import { NextRequest, NextResponse } from "next/server";
import { getOriginalToken } from "@/lib/url/shortener";

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const shortCode = params.code;

    if (!shortCode) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const originalToken = await getOriginalToken(shortCode);

    if (!originalToken) {
      // Short code not found, redirect to homepage
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Redirect to the full solicitacao page
    return NextResponse.redirect(
      new URL(`/solicitacao/${originalToken}`, request.url)
    );
  } catch (error) {
    console.error("Error resolving short URL:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
