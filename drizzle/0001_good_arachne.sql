CREATE TABLE "short_urls" (
	"id" serial PRIMARY KEY NOT NULL,
	"short_code" varchar(10) NOT NULL,
	"original_token" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "short_urls_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
ALTER TABLE "apps" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "apps" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "mensagens" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "midias" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "solicitacoes" ALTER COLUMN "pa" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "solicitacoes" ALTER COLUMN "status" SET DEFAULT 'pendente';--> statement-breakpoint
ALTER TABLE "solicitacoes" ALTER COLUMN "link_expiracao" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "solicitacoes" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "solicitacoes" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_apps" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "mensagens" ADD COLUMN "tipo" varchar(20) DEFAULT 'text';--> statement-breakpoint
ALTER TABLE "mensagens" ADD COLUMN "media_url" varchar(500);--> statement-breakpoint
ALTER TABLE "solicitacoes" ADD COLUMN "archived" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "solicitacoes" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "solicitacoes" ADD COLUMN "sms_status" varchar(20);--> statement-breakpoint
ALTER TABLE "solicitacoes" ADD COLUMN "sms_error_code" varchar(100);