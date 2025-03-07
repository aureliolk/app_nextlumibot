// genprompt/_lib/db.ts
import { PrismaClient } from '@prisma/client';

// Criar uma instância específica para o banco de dados de prompts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_PROMPTS
    }
  }
});

export default prisma;

// Interface para os prompts
export interface PromptData {
  id: string;
  account_id: string;
  prompt: string;
  created_at: Date;
  analysis?: string;
  prompt_created?: string;
  prompt_removed?: string;
  prompt_complete?: string;
  quality_checks?: any;
}

// Função para obter todos os prompts de uma conta
export async function getPromptsByAccountId(accountId: string): Promise<PromptData[]> {
  try {
    const prompts = await prisma.prompt.findMany({
      where: {
        account_id: accountId
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    return prompts;
  } catch (error) {
    console.error('Erro ao buscar prompts:', error);
    return [];
  }
}

// Função para obter um prompt específico
export async function getPromptById(promptId: string): Promise<PromptData | null> {
  try {
    const prompt = await prisma.prompt.findUnique({
      where: {
        id: promptId
      }
    });
    
    return prompt;
  } catch (error) {
    console.error('Erro ao buscar prompt por ID:', error);
    return null;
  }
}

// Função para salvar um novo prompt
export async function savePrompt(promptData: {
  account_id: string;
  prompt: string;
  analysis?: string;
  prompt_created?: string;
  prompt_removed?: string;
  prompt_complete?: string;
  quality_checks?: any;
}): Promise<PromptData | null> {
  try {
    const newPrompt = await prisma.prompt.create({
      data: promptData
    });
    
    return newPrompt;
  } catch (error) {
    console.error('Erro ao salvar prompt:', error);
    return null;
  }
}

// Função para processar a resposta da API e extrair as seções
export function processApiResponse(response: string): {
  analysis: string;
  prompt_created: string;
  prompt_removed: string;
  prompt_complete: string;
  quality_checks: string[];
} {
  console.log('Processando resposta bruta:', response.substring(0, 100) + '...');
  
  try {
    const sections = response.split('---').filter(section => section.trim());
    console.log(`Encontradas ${sections.length} seções na resposta`);
    
    let analysis = '';
    let prompt_created = '';
    let prompt_removed = '';
    let prompt_complete = '';
    let quality_checks: string[] = [];
    
    for (const section of sections) {
      // Log de debug para identificar o tipo de seção
      const firstLine = section.split('\n')[0].trim();
      console.log('Processando seção:', firstLine);
      
      if (section.includes('## ANÁLISE:')) {
        analysis = section.trim();
        console.log('Análise encontrada');
      } else if (section.includes('### Parte do prompt que vai ser criada ou alterada:') || 
                section.includes('## ### Parte do prompt que vai ser criada ou alterada:')) {
        // Extrair o conteúdo do bloco de código Markdown
        const markdownCodeBlockMatch = section.match(/```markdown\s+([\s\S]*?)\s+```/);
        
        if (markdownCodeBlockMatch && markdownCodeBlockMatch[1]) {
          // Se encontrou o bloco de código, use apenas o conteúdo dentro dele
          prompt_created = markdownCodeBlockMatch[1].trim();
          console.log('Prompt criado extraído do bloco Markdown');
        } else {
          // Caso não encontre o bloco de código, use a seção inteira
          prompt_created = section.trim();
          console.log('Prompt criado encontrado (sem bloco Markdown)');
        }
      } else if (section.includes('### Parte do prompt que foi removida do prompt original:') ||
                section.includes('## ### Parte do prompt que foi removida do prompt original:')) {
        // Extrair o conteúdo do bloco de código Markdown
        const markdownCodeBlockMatch = section.match(/```markdown\s+([\s\S]*?)\s+```/);
        
        if (markdownCodeBlockMatch && markdownCodeBlockMatch[1]) {
          // Se encontrou o bloco de código, use apenas o conteúdo dentro dele
          prompt_removed = markdownCodeBlockMatch[1].trim();
          console.log('Prompt removido extraído do bloco Markdown');
        } else {
          // Caso não encontre o bloco de código, use a seção inteira
          prompt_removed = section.trim();
          console.log('Prompt removido encontrado (sem bloco Markdown)');
        }
      } else if (section.includes('### Prompt completo atualizado com a correção:') ||
                section.includes('## ### Prompt completo atualizado com a correção:')) {
        // Extrair o conteúdo do bloco de código Markdown
        const markdownCodeBlockMatch = section.match(/```markdown\s+([\s\S]*?)\s+```/);
        
        if (markdownCodeBlockMatch && markdownCodeBlockMatch[1]) {
          // Se encontrou o bloco de código, use apenas o conteúdo dentro dele
          prompt_complete = markdownCodeBlockMatch[1].trim();
          console.log('Prompt completo extraído do bloco Markdown');
        } else {
          // Caso não encontre o bloco de código, use a seção inteira
          prompt_complete = section.trim();
          console.log('Prompt completo encontrado (sem bloco Markdown)');
        }
      } else if (section.includes('## Checklist de Qualidade')) {
        const checklistLines = section.split('\n')
          .filter(line => line.includes('- [x]'))
          .map(line => line.replace('- [x]', '').trim());
        quality_checks = checklistLines;
        console.log(`Checklist de qualidade encontrado com ${checklistLines.length} itens`);
      }
    }
    
    return {
      analysis,
      prompt_created,
      prompt_removed,
      prompt_complete,
      quality_checks
    };
  } catch (error) {
    console.error('Erro ao processar resposta da API:', error);
    // Retornar objeto vazio em caso de erro para não quebrar o fluxo
    return {
      analysis: '',
      prompt_created: '',
      prompt_removed: '',
      prompt_complete: '',
      quality_checks: []
    };
  }
}