import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // ADMINISTRADOR and SUPERVISOR can list all users
    if (!["ADMINISTRADOR", "SUPERVISOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        role: users.role,
        pa: users.pa,
        active: users.active,
        allowedApps: users.allowedApps,
        createdAt: users.createdAt,
      })
      .from(users);

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Only ADMINISTRADOR can create users
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { name, username, password, role, pa, allowedApps } = body;

    if (!name || !username || !password || !role) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Nome de usuário já existe" },
        { status: 400 }
      );
    }

    // TODO: In production, hash the password with bcrypt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userData: any = {
      name,
      username,
      password, // Should be hashed in production
      role,
      pa: pa || null,
      allowedApps: allowedApps || [],
      active: true,
    };

    const newUser = await db
      .insert(users)
      .values(userData)
      .returning({
        id: users.id,
        name: users.name,
        username: users.username,
        role: users.role,
        pa: users.pa,
        active: users.active,
        allowedApps: users.allowedApps,
      });

    return NextResponse.json(newUser[0], { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
