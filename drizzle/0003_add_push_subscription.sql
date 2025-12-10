-- Add push_subscription column to solicitacoes table
ALTER TABLE "solicitacoes" ADD COLUMN "push_subscription" jsonb;

-- Add comment to describe the column
COMMENT ON COLUMN "solicitacoes"."push_subscription" IS 'Web Push subscription object for sending notifications to the requester';
