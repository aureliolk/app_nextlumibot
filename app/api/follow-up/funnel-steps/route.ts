// app/api/follow-up/funnel-steps/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseTimeString } from '../_lib/manager';

// Endpoint para listar os passos de um estágio do funil
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const stageId = searchParams.get('stageId');
    
    if (!stageId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "ID do estágio é obrigatório" 
        }, 
        { status: 400 }
      );
    }
    
    // Verificar se o estágio existe
    const stage = await prisma.followUpFunnelStage.findUnique({
      where: { id: stageId }
    });
    
    if (!stage) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Estágio não encontrado" 
        }, 
        { status: 404 }
      );
    }
    
    // Buscar os passos do estágio
    const steps = await prisma.followUpStep.findMany({
      where: { funnel_stage_id: stageId },
      orderBy: { created_at: 'asc' }
    });
    
    return NextResponse.json({
      success: true,
      data: steps
    });
    
  } catch (error) {
    console.error("Erro ao listar passos do estágio:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Erro interno do servidor" 
      }, 
      { status: 500 }
    );
  }
}

// Endpoint para criar um novo passo para um estágio
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      funnel_stage_id, 
      name, 
      template_name, 
      wait_time, 
      message_content, 
      message_category, 
      auto_respond 
    } = body;
    
    if (!funnel_stage_id || !name || !template_name || !wait_time || !message_content) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Todos os campos obrigatórios devem ser preenchidos" 
        }, 
        { status: 400 }
      );
    }
    
    // Verificar se o estágio existe
    const stage = await prisma.followUpFunnelStage.findUnique({
      where: { id: funnel_stage_id }
    });
    
    if (!stage) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Estágio não encontrado" 
        }, 
        { status: 404 }
      );
    }
    
    // Converter tempo de espera em milissegundos
    const wait_time_ms = parseTimeString(wait_time);
    
    // Criar o passo
    const step = await prisma.followUpStep.create({
      data: {
        funnel_stage_id,
        name,
        template_name,
        wait_time,
        wait_time_ms,
        message_content,
        message_category,
        auto_respond: auto_respond !== undefined ? auto_respond : true
      }
    });
    
    return NextResponse.json(
      { 
        success: true, 
        message: "Passo criado com sucesso", 
        data: step 
      }, 
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Erro ao criar passo para o estágio:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Erro interno do servidor" 
      }, 
      { status: 500 }
    );
  }
}