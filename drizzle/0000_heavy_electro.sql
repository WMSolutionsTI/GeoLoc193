-- USERS
CREATE TABLE "users" (
  "id" serial PRIMARY KEY,
  "username" varchar(255) UNIQUE NOT NULL,
  "password" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "role" varchar(50) NOT NULL,
  "pa" varchar(100),
  "active" boolean DEFAULT true,
  "session_token" varchar(255),
  "allowed_apps" json DEFAULT '[]',
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

-- APPS
CREATE TABLE "apps" (
  "id" serial PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "slug" varchar(100) UNIQUE NOT NULL,
  "icon" varchar(100) NOT NULL,
  "route" varchar(255) NOT NULL,
  "description" text,
  "active" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

-- USER_APPS (RELATION USERS <-> APPS)
CREATE TABLE "user_apps" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "app_id" integer NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

ALTER TABLE "user_apps"
  ADD CONSTRAINT "user_apps_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "user_apps"
  ADD CONSTRAINT "user_apps_app_id_fkey"
  FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE no action ON UPDATE no action;

-- SOLICITACOES
CREATE TABLE "solicitacoes" (
  "id" serial PRIMARY KEY,
  "atendente_id" integer,
  "nome_solicitante" varchar(255) NOT NULL,
  "telefone" varchar(20) NOT NULL,
  "pa" varchar(100),
  "status" varchar(50) DEFAULT 'pendente',
  "link_token" varchar(100) UNIQUE,
  "link_expiracao" timestamptz,
  "coordenadas" json,
  "endereco" varchar(500),
  "plus_code" varchar(20),
  "archived" boolean DEFAULT false,
  "archived_at" timestamptz,
  "sms_status" varchar(20),
  "sms_error_code" varchar(100),
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

ALTER TABLE "solicitacoes"
  ADD CONSTRAINT "solicitacoes_atendente_id_fkey"
  FOREIGN KEY ("atendente_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

-- MENSAGENS
CREATE TABLE "mensagens" (
  "id" serial PRIMARY KEY,
  "solicitacao_id" integer NOT NULL,
  "remetente" varchar(50) NOT NULL,
  "conteudo" text NOT NULL,
  "tipo" varchar(20) DEFAULT 'text',
  "media_url" varchar(500),
  "lida" boolean DEFAULT false,
  "created_at" timestamptz DEFAULT now()
);

ALTER TABLE "mensagens"
  ADD CONSTRAINT "mensagens_solicitacao_id_fkey"
  FOREIGN KEY ("solicitacao_id") REFERENCES "solicitacoes"("id") ON DELETE no action ON UPDATE no action;

-- MIDIAS
CREATE TABLE "midias" (
  "id" serial PRIMARY KEY,
  "solicitacao_id" integer NOT NULL,
  "tipo" varchar(50) NOT NULL,
  "url" varchar(500) NOT NULL,
  "nome" varchar(255),
  "tamanho" integer,
  "created_at" timestamptz DEFAULT now()
);

ALTER TABLE "midias"
  ADD CONSTRAINT "midias_solicitacao_id_fkey"
  FOREIGN KEY ("solicitacao_id") REFERENCES "solicitacoes"("id") ON DELETE no action ON UPDATE no action;

-- AUDIT LOG
CREATE TABLE "audit_log" (
  "id" serial PRIMARY KEY,
  "user_id" integer,
  "action" varchar(100) NOT NULL,
  "entity" varchar(100) NOT NULL,
  "entity_id" integer,
  "details" json,
  "ip_address" varchar(50),
  "created_at" timestamptz DEFAULT now()
);

ALTER TABLE "audit_log"
  ADD CONSTRAINT "audit_log_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

-- SHORT_URLS
CREATE TABLE "short_urls" (
  "id" serial PRIMARY KEY,
  "short_code" varchar(10) UNIQUE NOT NULL,
  "original_token" varchar(100) NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

ALTER TABLE "short_urls"
  ADD CONSTRAINT "short_urls_original_token_fkey"
  FOREIGN KEY ("original_token") REFERENCES "solicitacoes"("link_token") ON DELETE no action ON UPDATE no action;
