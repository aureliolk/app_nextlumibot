// lib/db.ts
import { PrismaClient } from '@prisma/client';

// Inicializar com a URL específica para produtos
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_PRODUCTS
    }
  }
});

export default prisma;

function removeAccents(text: string): string {
  return text
    .normalize("NFD") // Decompõe os caracteres acentuados
    .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
    .toLowerCase(); // Converte para minúsculas
}

export function normalizeSearchText(text: string): string {
  let normalized = removeAccents(text.trim());

  // Substituições para variações comuns
  const replacements: { [key: string]: string } = {
    sutian: "sutia",
    sutia: "sutia", // Já sem acento, mas garantimos
    bikini: "biquini",
    biquini: "biquini", // Já sem acento
    calsinha: "calcinha",
    calcinhas: "calcinha", // Plural para singular
    calcinha: "calcinha",
  };

  // Substituir palavras conhecidas
  const words = normalized.split(" ");
  const correctedWords = words.map((word) => replacements[word] || word);

  // Juntar as palavras e remover espaços extras
  normalized = correctedWords.join(" ").trim();

  // Opcional: remover plural se necessário (ex.: "sutiãs" → "sutiã")
  if (normalized.endsWith("s")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

