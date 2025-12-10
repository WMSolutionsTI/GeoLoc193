import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    // Archive requests that are finalized and were created more than 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    // Use raw SQL for the update to avoid TypeScript issues with new columns
    const result = await db.execute(sql`
      UPDATE solicitacoes 
      SET archived = true, archived_at = NOW() 
      WHERE status = 'finalizado' 
        AND created_at < ${twoHoursAgo} 
        AND (archived = false OR archived IS NULL)
      RETURNING id
    `);

    return NextResponse.json({
      success: true,
      archivedCount: result.rowCount || 0,
    });
  } catch (error) {
    console.error("Error archiving requests:", error);
    return NextResponse.json(
      { error: "Erro ao arquivar solicitações" },
      { status: 500 }
    );
  }
}
