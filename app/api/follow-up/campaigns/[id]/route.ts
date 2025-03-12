// app/api/follow-up/campaigns/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    
    const campaign = await prisma.followUpCampaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        description: true,
        active: true,
        steps: true,
      }
    });
    
    if (!campaign) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Campanha não encontrada" 
        }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      ...campaign
    });
    
  } catch (error) {
    console.error("Erro ao buscar detalhes da campanha:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Erro interno do servidor" 
      }, 
      { status: 500 }
    );
  }
}