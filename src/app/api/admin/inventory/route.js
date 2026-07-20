import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

let prisma;
function getPrisma() {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        title: 'asc'
      }
    });

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    const { id, stock } = await request.json();

    if (typeof stock !== 'number') {
      return NextResponse.json({ success: false, error: 'Invalid stock value' }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { stock }
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Error updating stock:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update stock' },
      { status: 500 }
    );
  }
}
