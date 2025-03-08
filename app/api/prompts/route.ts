// app/api/prompts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPromptsByAccountId, savePrompt } from '@/app/genprompt/_services/api';

// GET route para obter todos os prompts de uma conta
export async function GET(request: NextRequest) {
  try {
    const accountId = request.nextUrl.searchParams.get('accountId');
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID é obrigatório' },
        { status: 400 }
      );
    }
    
    const prompts = await getPromptsByAccountId(accountId);
    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Erro ao buscar prompts:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar prompts' },
      { status: 500 }
    );
  }
}

// POST route para processar e salvar um novo prompt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, promptParam, apiResponse } = body;
    
    console.log('Recebido para salvar:', { text, promptParam, apiResponse });
    
    // Se temos uma resposta da API, processamos e salvamos
    if (apiResponse) {
      console.log('Processando resposta da API');
      
      // Salvar no banco de dados
      const savedPrompt = await savePrompt({
        account_id: promptParam,
        instruction: text,
        prompt_created: apiResponse[0].content,
        prompt_removed: apiResponse[1].content,
        prompt_complete: apiResponse[2].content
      });
      
      console.log('Prompt salvo com sucesso:', savedPrompt?.id);
      return NextResponse.json(savedPrompt);
    }
    
    // Caso não tenha resposta da API, apenas salvamos o prompt
    console.log('Salvando prompt sem resposta da API');
    const savedPrompt = await savePrompt({
      account_id: promptParam,
      instruction: text
    });
    
    console.log('Prompt básico salvo com sucesso:', savedPrompt?.id);
    return NextResponse.json(savedPrompt);
  } catch (error) {
    console.error('Erro ao salvar prompt:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar prompt', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}