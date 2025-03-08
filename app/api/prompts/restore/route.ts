// app/api/prompts/restore/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPromptById } from '@/app/genprompt/_services/api';

// POST route para restaurar um prompt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promptId } = body;
    
    if (!promptId) {
      return NextResponse.json(
        { error: 'ID do prompt é obrigatório' },
        { status: 400 }
      );
    }
    
    const prompt = await getPromptById(promptId);
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt não encontrado' },
        { status: 404 }
      );
    }
    
    // Retornamos o prompt completo ou o prompt original se não houver completo
    return NextResponse.json({
      success: true,
      prompt: prompt.prompt_complete || prompt.prompt,
      originalPrompt: prompt.prompt,
      analysis: prompt.analysis,
      promptCreated: prompt.prompt_created,
      promptRemoved: prompt.prompt_removed,
      qualityChecks: prompt.quality_checks
    });
  } catch (error) {
    console.error('Erro ao restaurar prompt:', error);
    return NextResponse.json(
      { error: 'Erro ao restaurar prompt' },
      { status: 500 }
    );
  }
}