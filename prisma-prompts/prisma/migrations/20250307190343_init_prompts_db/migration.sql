-- CreateTable
CREATE TABLE "prompts" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysis" TEXT,
    "prompt_created" TEXT,
    "prompt_removed" TEXT,
    "prompt_complete" TEXT,
    "quality_checks" JSONB,

    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);
