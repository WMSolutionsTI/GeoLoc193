import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { generateToken, calculateExpirationTime } from "@/lib/utils";
import { eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const includeArchived = searchParams.get("archived") === "true";

    // Custom ordering: pendente > recebido > finalizado, then by createdAt DESC
    const statusOrder = sql`CASE status 
      WHEN 'pendente' THEN 1 
      WHEN 'recebido' THEN 2 
      WHEN 'finalizado' THEN 3 
      ELSE 4 
    END`;

    let whereClause = sql`1=1`;
    if (status) {
      whereClause = sql`${whereClause} AND status = ${status}`;
    }
    if (!includeArchived) {
      whereClause = sql`${whereClause} AND (archived = false OR archived IS NULL)`;
    }

    // Role-based filtering: ATENDENTE sees only their own solicitacoes
    // SUPERVISOR, ADMINISTRADOR, and INCLUSOR see all solicitacoes
    const userRole = session.user.role;
    const userId = parseInt(session.user.id);
    
    if (userRole === "ATENDENTE") {
      whereClause = sql`${whereClause} AND s.atendente_id = ${userId}`;
    }
    // SUPERVISOR, ADMINISTRADOR, INCLUSOR see all (no additional filter)

    const results = await db.execute(sql`
      SELECT 
        s.id,
        s.nome_solicitante as "nomeSolicitante",
        s.telefone,
        s.pa,
        s.status,
        s.coordenadas,
        s.endereco,
        s.cidade,
        s.logradouro,
        s.plus_code as "plusCode",
        s.created_at as "createdAt",
        s.updated_at as "updatedAt",
        s.link_token as "linkToken",
        s.link_expiracao as "linkExpiracao",
        s.chat_expires_at as "chatExpiresAt",
        s.atendente_id as "atendenteId",
        s.archived,
        s.archived_at as "archivedAt",
        s.sms_status as "smsStatus",
        s.sms_error_code as "smsErrorCode",
        u.name as "atendenteName",
        u.username as "atendenteUsername"
      FROM solicitacoes s
      LEFT JOIN users u ON s.atendente_id = u.id
      WHERE ${whereClause}
      ORDER BY ${statusOrder}, s.created_at DESC
    `);

    return NextResponse.json(results.rows);
  } catch (error) {
    console.error("Error fetching solicitacoes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar solicitações" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nomeSolicitante, telefone } = body;

    if (!nomeSolicitante || !telefone) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos" },
        { status: 400 }
      );
    }

    const linkToken = generateToken(16);
    const linkExpiracao = calculateExpirationTime(2);
    const atendenteId = parseInt(session.user.id);

    // Insert using raw SQL - SMS functionality removed
    const insertResult = await db.execute(sql`
      INSERT INTO solicitacoes (
        atendente_id, nome_solicitante, telefone, link_token, link_expiracao, 
        status, archived, created_at, updated_at
      ) VALUES (
        ${atendenteId}, ${nomeSolicitante}, ${telefone}, ${linkToken}, ${linkExpiracao},
        'pendente', false, NOW(), NOW()
      )
      RETURNING id, nome_solicitante as "nomeSolicitante", telefone, status, 
                link_token as "linkToken", link_expiracao as "linkExpiracao"
    `);

    const novaSolicitacao = insertResult.rows[0] as {
      id: number;
      nomeSolicitante: string;
      telefone: string;
      status: string;
      linkToken: string;
      linkExpiracao: string;
    };

    // Get atendente info
    const [atendente] = await db
      .select({ name: users.name, username: users.username })
      .from(users)
      .where(eq(users.id, atendenteId));

    return NextResponse.json({
      success: true,
      solicitacao: {
        ...novaSolicitacao,
        atendenteName: atendente?.name,
        atendenteUsername: atendente?.username,
      },
    });
  } catch (error) {
    console.error("Error creating solicitacao:", error);
    return NextResponse.json(
      { error: "Erro ao criar solicitação" },
      { status: 500 }
    );
  }
}