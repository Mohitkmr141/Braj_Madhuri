import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
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
