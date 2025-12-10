import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; filename: string } }
) {
  try {
    const { type, filename } = params;

    // Validate type
    if (!["audio", "image", "file"].includes(type)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    // Sanitize filename to prevent path traversal
    // Only allow alphanumeric, dash, underscore, and dot
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "");
    if (sanitizedFilename !== filename || filename.includes("..")) {
      return NextResponse.json({ error: "Nome de arquivo inválido" }, { status: 400 });
    }

    // Construct file path
    const filepath = join(process.cwd(), "uploads", type, sanitizedFilename);

    // Check if file exists
    if (!existsSync(filepath)) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
    }

    // Read file
    const fileBuffer = await readFile(filepath);

    // Determine content type
    let contentType = "application/octet-stream";
    const ext = filename.split(".").pop()?.toLowerCase();
    
    const contentTypes: Record<string, string> = {
      // Images
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      // Audio
      webm: "audio/webm",
      ogg: "audio/ogg",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      // Documents
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      txt: "text/plain",
    };

    if (ext && contentTypes[ext]) {
      contentType = contentTypes[ext];
    }

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json(
      { error: "Erro ao servir arquivo" },
      { status: 500 }
    );
  }
}
