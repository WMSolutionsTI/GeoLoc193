import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mensagens, solicitacoes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const messages = await db
      .select()
      .from(mensagens)
      .where(eq(mensagens.solicitacaoId, solicitacao.id))
      .orderBy(mensagens.createdAt);

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Erro ao buscar mensagens" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { conteudo, remetente } = body;

    if (!conteudo || !remetente) {
      return NextResponse.json(
        { error: "Conteúdo e remetente são obrigatórios" },
        { status: 400 }
      );
    }

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

    type MensagemInsert = {
      solicitacaoId: number;
      remetente: string;
      conteudo: string;
      lida?: boolean;
    };

    const insertData: MensagemInsert = {
      solicitacaoId: solicitacao.id,
      remetente,
      conteudo,
      lida: false,
    };

    const [newMessage] = await db
      .insert(mensagens)
      .values(insertData as typeof mensagens.$inferInsert)
      .returning();

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Erro ao criar mensagem" },
      { status: 500 }
    );
  }
}
