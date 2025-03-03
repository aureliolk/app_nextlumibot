// lib/db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;

export function normalizeSearchText(text: string): string {
  return text.trim().toLowerCase();
}