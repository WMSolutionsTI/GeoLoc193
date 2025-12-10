import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mensagens, solicitacoes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendPushNotification } from "@/lib/push/send";

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

    // Check if chat has expired (for finalized solicitacoes)
    if (solicitacao.chatExpiresAt && new Date(solicitacao.chatExpiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Chat expirado. Por favor, entre em contato com o 193 para uma nova solicitação." },
        { status: 403 }
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
    const { conteudo, remetente, tipo, mediaUrl, fileName } = body;

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

    // Check if chat has expired (for finalized solicitacoes)
    if (solicitacao.chatExpiresAt && new Date(solicitacao.chatExpiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Chat expirado. Por favor, entre em contato com o 193 para uma nova solicitação." },
        { status: 403 }
      );
    }

    type MensagemInsert = {
      solicitacaoId: number;
      remetente: string;
      conteudo: string;
      tipo?: string;
      mediaUrl?: string;
      fileName?: string;
      lida?: boolean;
    };

    const insertData: MensagemInsert = {
      solicitacaoId: solicitacao.id,
      remetente,
      conteudo,
      tipo: tipo || "text",
      mediaUrl: mediaUrl || null,
      fileName: fileName || null,
      lida: false,
    };

    const [newMessage] = await db
      .insert(mensagens)
      .values(insertData as typeof mensagens.$inferInsert)
      .returning();

    // Send push notification if the message is from atendente and solicitacao has push subscription
    if (remetente === "atendente" && solicitacao.pushSubscription) {
      try {
        const pushPayload = {
          title: "Nova mensagem do Atendente",
          body: tipo === "text" ? conteudo : `Mensagem de ${tipo}`,
          url: `/solicitacao/${solicitacao.linkToken}`,
          solicitacaoId: solicitacao.id,
        };
        
        await sendPushNotification(solicitacao.pushSubscription, pushPayload);
      } catch (pushError) {
        console.error("Error sending push notification:", pushError);
        // Don't fail the message creation if push fails
      }
    }

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Erro ao criar mensagem" },
      { status: 500 }
    );
  }
}
