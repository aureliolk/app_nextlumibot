// app/api/prompts/current/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPrompt, setCurrentPrompt } from '@/app/genprompt/_services/api';

// GET route para obter o prompt atual de uma conta
export async function GET(request: NextRequest) {
  try {
    const accountId = request.nextUrl.searchParams.get('accountId');
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'ID da conta é obrigatório' },
        { status: 400 }
      );
    }
    
    const currentPrompt = await getCurrentPrompt(accountId);
    
    if (!currentPrompt) {
      return NextResponse.json(
        { error: 'Nenhum prompt encontrado para esta conta' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(currentPrompt);
  } catch (error) {
    console.error('Erro ao buscar prompt atual:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar prompt atual' },
      { status: 500 }
    );
  }
}

// POST route para definir um prompt como atual
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, promptId } = body;
    
    if (!accountId || !promptId) {
      return NextResponse.json(
        { error: 'ID da conta e ID do prompt são obrigatórios' },
        { status: 400 }
      );
    }
    
    const success = await setCurrentPrompt(accountId, promptId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Falha ao definir o prompt atual' },
        { status: 500 }
      );
    }
    
    // Buscar o prompt atualizado para retornar
    const updatedPrompt = await getCurrentPrompt(accountId);
    
    return NextResponse.json({
      success: true,
      message: 'Prompt atual atualizado com sucesso',
      prompt: updatedPrompt
    });
  } catch (error) {
    console.error('Erro ao definir prompt atual:', error);
    return NextResponse.json(
      { error: 'Erro ao definir prompt atual' },
      { status: 500 }
    );
  }
}