import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Users can only update their own name
    if (parseInt(session.user.id, 10) !== userId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Nome inválido" },
        { status: 400 }
      );
    }

    const updatedUser = await db
      .update(users)
      .set({
        name: name.trim(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
      });

    if (!updatedUser || updatedUser.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, name: updatedUser[0].name });
  } catch (error) {
    console.error("Error updating user name:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar nome" },
      { status: 500 }
    );
  }
}
