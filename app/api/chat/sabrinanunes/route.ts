import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { getCurrentPrompt } from '@/app/genprompt/_services/api';
import { createChat, loadChat, saveMessage } from '../tools/chat-store';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { message, userId, name } = await req.json();
    
    // Criar ou usar o ID de chat existente
    const id = userId || await createChat(userId);
    
    // Obter o prompt atual
    const currentPrompt = await getCurrentPrompt('10');
    
    // Carregar histórico de mensagens
    const chatHistory = await loadChat(id);
    const messages: any = [
      {
        role: 'system',
        content: `Contexto:
        - ID do Cliente: ${id}
        - Nome do Cliente: ${name}
        ${currentPrompt?.prompt_complete || ''}`
      },
      // Adicionar histórico se existir
      ...(chatHistory?.messages || []),
      // Adicionar mensagem atual do usuário
      { role: 'user', content: message }
    ];

    const result = await generateText({
      model: openai('o3-mini'),
      messages,
      tools: {},
      maxSteps: 3,
    });

    // Salvar a mensagem do usuário e a resposta
    await saveMessage(id, { role: 'user', content: message });
    await saveMessage(id, { role: 'assistant', content: result.text });

    return NextResponse.json(result.text);
  } catch (error: any) {
    console.error('Erro na API:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 });
  }
}