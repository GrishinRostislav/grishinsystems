import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const mappings = await prisma.productMapping.findMany();
  const categories = await prisma.category.findMany();
  return NextResponse.json({ mappings, categories });
}
