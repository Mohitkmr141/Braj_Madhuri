import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

let prisma;
async function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function GET() {
  const prisma = await getPrisma();
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: true,
      },
    });

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
