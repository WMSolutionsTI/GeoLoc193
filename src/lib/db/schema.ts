import {
  pgTable,
  serial,
  varchar,
  timestamp,
  json,
  integer,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Role types for the system
export type UserRole = "ADMINISTRADOR" | "SUPERVISOR" | "ATENDENTE";

// Users table - stores all system users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(), // 'ADMINISTRADOR', 'SUPERVISOR', 'ATENDENTE'
  pa: varchar("pa", { length: 100 }), // Posto de Atendimento
  active: boolean("active").default(true),
  sessionToken: varchar("session_token", { length: 255 }), // For single session control
  allowedApps: json("allowed_apps").$type<string[]>().default([]), // List of app slugs the user can access
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Apps table - stores available apps in the system
export const apps = pgTable("apps", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  icon: varchar("icon", { length: 100 }).notNull(),
  route: varchar("route", { length: 255 }).notNull(),
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// UserApps relation table - N:N relationship between users and apps
export const userApps = pgTable("user_apps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  appId: integer("app_id").references(() => apps.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Status types for solicitacoes - new simplified flow
export type SolicitacaoStatus = "pendente" | "recebido" | "finalizado";

// Solicitacoes table - stores emergency requests
export const solicitacoes = pgTable("solicitacoes", {
  id: serial("id").primaryKey(),
  atendenteId: integer("atendente_id").references(() => users.id),
  nomeSolicitante: varchar("nome_solicitante", { length: 255 }).notNull(),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  // PA field deprecated - kept for backwards compatibility
  pa: varchar("pa", { length: 100 }),
  status: varchar("status", { length: 50 }).default("pendente"),
  linkToken: varchar("link_token", { length: 100 }).unique(),
  linkExpiracao: timestamp("link_expiracao", { withTimezone: true }),
  coordenadas: json("coordenadas").$type<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  }>(),
  endereco: varchar("endereco", { length: 500 }),
  cidade: varchar("cidade", { length: 255 }),
  logradouro: varchar("logradouro", { length: 500 }),
  plusCode: varchar("plus_code", { length: 20 }),
  // Archiving fields
  archived: boolean("archived").default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  // Chat expiration field - 2 hours after finalization
  chatExpiresAt: timestamp("chat_expires_at", { withTimezone: true }),
  // SMS status fields - deprecated but kept for backward compatibility
  smsStatus: varchar("sms_status", { length: 20 }), // 'pending', 'delivered', 'failed'
  smsErrorCode: varchar("sms_error_code", { length: 100 }),
  // Push notification subscription
  pushSubscription: json("push_subscription"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Mensagens table - stores chat messages between operators and requesters
export const mensagens = pgTable("mensagens", {
  id: serial("id").primaryKey(),
  solicitacaoId: integer("solicitacao_id")
    .references(() => solicitacoes.id)
    .notNull(),
  remetente: varchar("remetente", { length: 50 }).notNull(), // 'atendente', 'solicitante'
  conteudo: text("conteudo").notNull(),
  tipo: varchar("tipo", { length: 20 }).default("text"), // 'text', 'audio', 'image', 'file'
  mediaUrl: varchar("media_url", { length: 500 }), // URL for audio/image/file media
  fileName: varchar("file_name", { length: 255 }), // Original filename for file attachments
  lida: boolean("lida").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Midias table - stores uploaded media files
export const midias = pgTable("midias", {
  id: serial("id").primaryKey(),
  solicitacaoId: integer("solicitacao_id")
    .references(() => solicitacoes.id)
    .notNull(),
  tipo: varchar("tipo", { length: 50 }).notNull(), // 'image', 'video', 'audio'
  url: varchar("url", { length: 500 }).notNull(),
  nome: varchar("nome", { length: 255 }),
  tamanho: integer("tamanho"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Audit log table - stores all actions for auditing
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: integer("entity_id"),
  details: json("details"),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  solicitacoes: many(solicitacoes),
  auditLogs: many(auditLog),
  userApps: many(userApps),
}));

export const appsRelations = relations(apps, ({ many }) => ({
  userApps: many(userApps),
}));

export const userAppsRelations = relations(userApps, ({ one }) => ({
  user: one(users, {
    fields: [userApps.userId],
    references: [users.id],
  }),
  app: one(apps, {
    fields: [userApps.appId],
    references: [apps.id],
  }),
}));

export const solicitacoesRelations = relations(solicitacoes, ({ one, many }) => ({
  atendente: one(users, {
    fields: [solicitacoes.atendenteId],
    references: [users.id],
  }),
  mensagens: many(mensagens),
  midias: many(midias),
}));

export const mensagensRelations = relations(mensagens, ({ one }) => ({
  solicitacao: one(solicitacoes, {
    fields: [mensagens.solicitacaoId],
    references: [solicitacoes.id],
  }),
}));

export const midiasRelations = relations(midias, ({ one }) => ({
  solicitacao: one(solicitacoes, {
    fields: [midias.solicitacaoId],
    references: [solicitacoes.id],
  }),
}));

// Short URLs table - for link shortening to avoid SMS blocking
export const shortUrls = pgTable("short_urls", {
  id: serial("id").primaryKey(),
  shortCode: varchar("short_code", { length: 10 }).unique().notNull(),
  originalToken: varchar("original_token", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Short URLs relations
export const shortUrlsRelations = relations(shortUrls, ({ one }) => ({
  solicitacao: one(solicitacoes, {
    fields: [shortUrls.originalToken],
    references: [solicitacoes.linkToken],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Solicitacao = typeof solicitacoes.$inferSelect;
export type NewSolicitacao = typeof solicitacoes.$inferInsert;
export type Mensagem = typeof mensagens.$inferSelect;
export type NewMensagem = typeof mensagens.$inferInsert;
export type Midia = typeof midias.$inferSelect;
export type NewMidia = typeof midias.$inferInsert;
export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
export type UserApp = typeof userApps.$inferSelect;
export type NewUserApp = typeof userApps.$inferInsert;
export type ShortUrl = typeof shortUrls.$inferSelect;
export type NewShortUrl = typeof shortUrls.$inferInsert;