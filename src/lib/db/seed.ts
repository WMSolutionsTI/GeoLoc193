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

  // Create test users with bcrypt hashed passwords
  // NOTE: These are bootstrap credentials for initial system setup.
  // In production, these should be changed immediately after first login.
  // Password: admincobom
  const adminPassword = "$2a$10$5hUACW8sSG1raIy4vqq0POETN91g19ClriamFoUFEjJ5eK.lZ2JIu";
  // Password: supervisorcobom
  const supervisorPassword = "$2a$10$OR95SWxbJwzb2fRu0qQZ8eAnndnm4qiGzTyp.Y9xfOaL6VNIUnh1S";
  // Password: atendente193cobom
  const atendentePassword = "$2a$10$XEIP4pnlXLaEhQxAiYd4wuDkVMid3Nc6b0c3/RgaEisLwlfVZ4J1G";

  const seedUsers: UserInsert[] = [
    {
      username: "admin",
      password: adminPassword,
      name: "Administrador Sistema",
      role: "ADMINISTRADOR",
      pa: "PA-01",
      allowedApps: ["geoloc193", "viaturas", "contingencia", "chat", "headsets", "info-cobom", "agenda", "gestao-dejem", "mapa-offline", "auditoria"],
    },
    {
      username: "supervisor",
      password: supervisorPassword,
      name: "Carlos Supervisor",
      role: "SUPERVISOR",
      pa: "PA-01",
      allowedApps: ["geoloc193", "viaturas", "contingencia"],
    },
    {
      username: "atendente",
      password: atendentePassword,
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