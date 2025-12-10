import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Only ADMINISTRADOR can update users
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    const { name, username, password, role, pa, allowedApps } = body;

    if (!name || !username || !role) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Check if username is taken by another user
    const userWithSameUsername = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (userWithSameUsername && userWithSameUsername.id !== userId) {
      return NextResponse.json(
        { error: "Nome de usuário já está em uso" },
        { status: 400 }
      );
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      name,
      username,
      role,
      pa: pa || null,
      allowedApps: allowedApps || [],
      updatedAt: new Date(),
    };

    // Only update password if provided
    // TODO: In production, hash the password with bcrypt
    if (password) {
      updateData.password = password;
    }

    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        username: users.username,
        role: users.role,
        pa: users.pa,
        active: users.active,
        allowedApps: users.allowedApps,
      });

    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Only ADMINISTRADOR can delete users
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Prevent deleting self
    if (parseInt(session.user.id, 10) === userId) {
      return NextResponse.json(
        { error: "Você não pode excluir sua própria conta" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Erro ao excluir usuário" },
      { status: 500 }
    );
  }
}
