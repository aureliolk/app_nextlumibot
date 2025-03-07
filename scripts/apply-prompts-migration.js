import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar Prisma
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando migração da tabela de prompts...');
    
    // Criar tabela de prompts
    console.log('Criando tabela prompts...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS prompts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        analysis TEXT,
        prompt_created TEXT,
        prompt_removed TEXT,
        prompt_complete TEXT,
        quality_checks JSONB
      )
    `);
    
    // Criar índice para account_id
    console.log('Criando índice para account_id...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS prompts_account_id_idx ON prompts(account_id)
    `);
    
    // Criar índice para ordenação por data
    console.log('Criando índice para ordenação por data...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS prompts_created_at_desc_idx ON prompts(created_at DESC)
    `);
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao executar migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();