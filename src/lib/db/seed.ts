import "dotenv/config";
import { db } from "./index";
import { users } from "./schema";

type UserInsert = {
  username: string;
  password: string;
  name: string;
  role: string;
  pa?: string | null;
  active?: boolean | null;
  allowedApps?: string[];
};

async function seed() {
  console.log("Seeding database...");

  // Criar usuários de teste com novos papéis
  const seedUsers: UserInsert[] = [
    {
      username: "admin",
      password: "123456", // Em produção, usar hash bcrypt
      name: "Administrador Sistema",
      role: "ADMINISTRADOR",
      pa: "PA-01",
      allowedApps: ["geoloc193", "viaturas", "contingencia", "chat", "headsets", "info-cobom", "agenda", "gestao-dejem", "mapa-offline", "auditoria"],
    },
    {
      username: "supervisor",
      password: "123456",
      name: "Carlos Supervisor",
      role: "SUPERVISOR",
      pa: "PA-01",
      allowedApps: ["geoloc193", "viaturas", "contingencia"],
    },
    {
      username: "atendente",
      password: "123456",
      name: "João Atendente",
      role: "ATENDENTE",
      pa: "PA-01",
      allowedApps: ["geoloc193"],
    },
  ];
  
  await db.insert(users).values(seedUsers as (typeof users.$inferInsert)[]).onConflictDoNothing();

  console.log("Seed completed!");
}

seed()
  .catch(console.error)
  .finally(() => process.exit());