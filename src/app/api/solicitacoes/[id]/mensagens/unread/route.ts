import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mensagens, solicitacoes } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const remetente = searchParams.get("remetente"); // 'atendente' or 'solicitante'

    // First find the solicitacao by linkToken or id
    let solicitacao = await db.query.solicitacoes.findFirst({
      where: eq(solicitacoes.linkToken, params.id),
    });

    if (!solicitacao) {
      const numId = parseInt(params.id);
      if (!isNaN(numId)) {
        solicitacao = await db.query.solicitacoes.findFirst({
          where: eq(solicitacoes.id, numId),
        });
      }
    }

    if (!solicitacao) {
      return NextResponse.json(
        { error: "Solicitação não encontrada" },
        { status: 404 }
      );
    }

    // Count unread messages from the opposite remetente
    const oppositeRemetente = remetente === "atendente" ? "solicitante" : "atendente";
    
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(mensagens)
      .where(
        and(
          eq(mensagens.solicitacaoId, solicitacao.id),
          eq(mensagens.lida, false),
          eq(mensagens.remetente, oppositeRemetente)
        )
      );

    const unreadCount = result[0]?.count || 0;

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json(
      { error: "Erro ao buscar mensagens não lidas" },
      { status: 500 }
    );
  }
}

// Mark messages as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { remetente } = body; // Current user type

    // First find the solicitacao by linkToken or id
    let solicitacao = await db.query.solicitacoes.findFirst({
      where: eq(solicitacoes.linkToken, params.id),
    });

    if (!solicitacao) {
      const numId = parseInt(params.id);
      if (!isNaN(numId)) {
        solicitacao = await db.query.solicitacoes.findFirst({
          where: eq(solicitacoes.id, numId),
        });
      }
    }

    if (!solicitacao) {
      return NextResponse.json(
        { error: "Solicitação não encontrada" },
        { status: 404 }
      );
    }

    // Mark messages from opposite remetente as read
    const oppositeRemetente = remetente === "atendente" ? "solicitante" : "atendente";
    
    // Use raw SQL to avoid TypeScript type issues with update
    await db.execute(sql`
      UPDATE mensagens 
      SET lida = true 
      WHERE solicitacao_id = ${solicitacao.id} 
        AND lida = false 
        AND remetente = ${oppositeRemetente}
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Erro ao marcar mensagens como lidas" },
      { status: 500 }
    );
  }
}
