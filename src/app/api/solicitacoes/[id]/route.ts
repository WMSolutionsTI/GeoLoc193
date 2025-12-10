import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { solicitacoes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function isNumericId(id: string): boolean {
  return /^\d+$/.test(id);
}

// Helper function to convert Date to ISO string format
function toISOStringOrNull(date: Date | null | undefined): string | null {
  return date ? new Date(date).toISOString() : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isNumeric = isNumericId(params.id);
    const solicitacao = await db.query.solicitacoes.findFirst({
      where: isNumeric
        ? eq(solicitacoes.id, parseInt(params.id, 10))
        : eq(solicitacoes.linkToken, params.id),
    });

    if (!solicitacao) {
      return NextResponse.json(
        { error: "Solicitação não encontrada" },
        { status: 404 }
      );
    }

    // Ensure dates are returned in ISO format with timezone
    const response = {
      ...solicitacao,
      linkExpiracao: toISOStringOrNull(solicitacao.linkExpiracao),
      createdAt: toISOStringOrNull(solicitacao.createdAt),
      updatedAt: toISOStringOrNull(solicitacao.updatedAt),
      archivedAt: toISOStringOrNull(solicitacao.archivedAt),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching solicitacao:", error);
    return NextResponse.json(
      { error: "Erro ao buscar solicitação" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { coordenadas, endereco, plusCode, status, atendenteId } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (status !== undefined) updateData.status = status;
    if (coordenadas !== undefined) {
      updateData.coordenadas = coordenadas;
      // When location is received, automatically set status to 'recebido' if still 'pendente'
      if (coordenadas && !status) {
        // Get current status first
        const isNumeric = isNumericId(params.id);
        const current = await db.query.solicitacoes.findFirst({
          where: isNumeric
            ? eq(solicitacoes.id, parseInt(params.id, 10))
            : eq(solicitacoes.linkToken, params.id),
        });
        if (current && current.status === "pendente") {
          updateData.status = "recebido";
        }
      }
    }
    if (endereco !== undefined) updateData.endereco = endereco;
    if (plusCode !== undefined) updateData.plusCode = plusCode;
    if (atendenteId !== undefined) updateData.atendenteId = atendenteId;

    const isNumeric = isNumericId(params.id);
    const whereClause = isNumeric
      ? eq(solicitacoes.id, parseInt(params.id, 10))
      : eq(solicitacoes.linkToken, params.id);

    const [updated] = await db
      .update(solicitacoes)
      .set(updateData)
      .where(whereClause)
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Solicitação não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, solicitacao: updated });
  } catch (error) {
    console.error("Error updating solicitacao:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar solicitação" },
      { status: 500 }
    );
  }
}