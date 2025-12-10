ALTER TABLE "mensagens" ADD COLUMN "file_name" varchar(255);--> statement-breakpoint
ALTER TABLE "solicitacoes" ADD COLUMN "cidade" varchar(255);--> statement-breakpoint
ALTER TABLE "solicitacoes" ADD COLUMN "logradouro" varchar(500);--> statement-breakpoint
ALTER TABLE "solicitacoes" ADD COLUMN "chat_expires_at" timestamp with time zone;