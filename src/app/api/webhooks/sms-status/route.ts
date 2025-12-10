import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { status, errorCode, phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Clean up phone number for matching
    const cleanPhone = phoneNumber.replace(/\D/g, "").slice(-11);

    // Find the most recent solicitacao for this phone number and update it
    const smsStatusValue = status === "delivered" ? "delivered" : "failed";
    const errorCodeValue = errorCode || null;

    const result = await db.execute(sql`
      UPDATE solicitacoes 
      SET sms_status = ${smsStatusValue}, 
          sms_error_code = ${errorCodeValue},
          updated_at = NOW()
      WHERE id = (
        SELECT id FROM solicitacoes 
        WHERE telefone LIKE ${'%' + cleanPhone + '%'}
        ORDER BY created_at DESC 
        LIMIT 1
      )
      RETURNING id
    `);

    if (result.rowCount === 0) {
      console.warn("No solicitacao found for phone:", phoneNumber);
      return NextResponse.json({ success: true, matched: false });
    }

    const updatedId = (result.rows[0] as { id: number }).id;
    console.log(`SMS status updated for solicitacao ${updatedId}: ${status}`);

    return NextResponse.json({
      success: true,
      matched: true,
      solicitacaoId: updatedId,
    });
  } catch (error) {
    console.error("Error processing SMS webhook:", error);
    return NextResponse.json(
      { error: "Erro ao processar webhook" },
      { status: 500 }
    );
  }
}
