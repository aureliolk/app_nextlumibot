-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "prompt";

-- CreateTable
CREATE TABLE "public"."products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "gender" TEXT,
    "image" TEXT,
    "categories" JSONB NOT NULL,
    "variations" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt"."prompts" (
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
