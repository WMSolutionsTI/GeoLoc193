import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const telefone = searchParams.get("telefone");

    // Validate phone: must be at least 8 digits
    if (!telefone || telefone.length < 8) {
      return NextResponse.json(
        { error: "Telefone inválido" },
        { status: 400 }
      );
    }

    // Ensure only digits are present (security validation)
    if (!/^\d+$/.test(telefone)) {
      return NextResponse.json(
        { error: "Telefone inválido" },
        { status: 400 }
      );
    }

    // Buscar solicitação ativa (não arquivada, não finalizada, não expirada) 
    // que termine com os dígitos fornecidos (últimos 8 dígitos)
    // Check for active conversation within 2 hours
    const result = await db.execute(sql`
      SELECT 
        id, 
        link_token as "linkToken",
        nome_solicitante as "nomeSolicitante",
        status,
        link_expiracao as "linkExpiracao",
        coordenadas
      FROM solicitacoes 
      WHERE RIGHT(REGEXP_REPLACE(telefone, '[^0-9]', '', 'g'), 8) = RIGHT(${telefone}, 8)
        AND (archived = false OR archived IS NULL)
        AND status != 'finalizado'
        AND (
          link_expiracao > NOW() OR 
          (coordenadas IS NOT NULL AND created_at > NOW() - INTERVAL '2 hours')
        )
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma solicitação ativa encontrada para este telefone." },
        { status: 404 }
      );
    }

    const solicitacao = result.rows[0] as {
      id: number;
      linkToken: string;
      nomeSolicitante: string;
      status: string;
      linkExpiracao: string;
      coordenadas: { latitude: number; longitude: number } | null;
    };

    return NextResponse.json({
      success: true,
      linkToken: solicitacao.linkToken,
      nomeSolicitante: solicitacao.nomeSolicitante,
      hasLocation: !!solicitacao.coordenadas,
    });
  } catch (error) {
    console.error("Error searching solicitacao by phone:", error);
    return NextResponse.json(
      { error: "Erro ao buscar solicitação" },
      { status: 500 }
    );
  }
}
