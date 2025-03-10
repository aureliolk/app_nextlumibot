import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;

function removeAccents(text: string): string {
    return text
      .normalize("NFD") // Decompõe os caracteres acentuados
      .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
      .toLowerCase(); // Converte para minúsculas
  }
  
  export function normalizeSearchText(text: string): string {
    // Verificar se o texto é válido
    if (!text || typeof text !== 'string') {
      return '';
    }

    let normalized = removeAccents(text.trim());
  
    // Substituições para variações comuns e termos relacionados
    const replacements: { [key: string]: string } = {
      // Lingerie
      'sutian': 'sutia',
      'sutia': 'sutia', 
      'sutiãs': 'sutia',
      'calcinha': 'calcinha',
      'calcinhas': 'calcinha',
      
      // Tipos de peças
      'tomara que caia': 'tomara_que_caia',
      'sem bojo': 'sem_bojo',
      'com bojo': 'com_bojo',
      
      // Cores
      'preto': 'preto',
      'branco': 'branco',
      'nude': 'nude',
      
      // Tamanhos
      'p': 'p',
      'm': 'm',
      'g': 'g',
      'gg': 'gg',
      
      // Marcas
      'duhellen': 'duhellen'
    };
  
    // Substituir palavras conhecidas
    const words = normalized.split(" ");
    const correctedWords = words.map((word) => replacements[word] || word);
  
    // Juntar as palavras e remover espaços extras
    normalized = correctedWords.join(" ").trim();
  
    // Remover plurais se necessário
    if (normalized.endsWith("s")) {
      normalized = normalized.slice(0, -1);
    }
  
    return normalized;
  }

// Função para gerar URL amigável
export function generateFriendlyUrl(text: string): string {
  return removeAccents(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // Remove caracteres especiais
    .replace(/\s+/g, '-')      // Substitui espaços por hífens
    .replace(/-+/g, '-')       // Remove hífens duplicados
    .trim();
}