import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  try {
    const path = params.path || [];
    const filePath = join(process.cwd(), "uploads", ...path);

    // Security: prevent directory traversal
    const uploadsDir = join(process.cwd(), "uploads");
    if (!filePath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read and return file
    const file = await readFile(filePath);
    
    // Determine content type based on extension
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const contentTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      webm: 'audio/webm',
      ogg: 'audio/ogg',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json(
      { error: "Error serving file" },
      { status: 500 }
    );
  }
}
