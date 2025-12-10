import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, solicitacaoId } = body;

    if (!subscription || !solicitacaoId) {
      return NextResponse.json(
        { error: "Subscription e solicitacaoId são obrigatórios" },
        { status: 400 }
      );
    }

    // Store the push subscription in the database
    // We'll add it to the solicitacoes table as a JSON field
    await db.execute(sql`
      UPDATE solicitacoes 
      SET push_subscription = ${JSON.stringify(subscription)}::jsonb
      WHERE id = ${solicitacaoId}
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json(
      { error: "Erro ao salvar inscrição de push" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { solicitacaoId } = body;

    if (!solicitacaoId) {
      return NextResponse.json(
        { error: "solicitacaoId é obrigatório" },
        { status: 400 }
      );
    }

    // Remove the push subscription from the database
    await db.execute(sql`
      UPDATE solicitacoes 
      SET push_subscription = NULL
      WHERE id = ${solicitacaoId}
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing push subscription:", error);
    return NextResponse.json(
      { error: "Erro ao remover inscrição de push" },
      { status: 500 }
    );
  }
}
