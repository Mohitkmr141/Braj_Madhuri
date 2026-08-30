import { verifyAdminToken } from '../../../../lib/auth.js';
import { getPrisma } from '../../../../lib/prisma.js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        title: 'asc'
      },
      include: {
        category: true,
        subcategory: true,
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
  if (!session || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    const { id, stock, variants } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    const updateData = {};
    if (typeof stock === 'number') {
      updateData.stock = Math.max(0, parseInt(stock, 10));
    }

    if (Array.isArray(variants)) {
      updateData.variants = variants;
      if (typeof stock !== 'number') {
        updateData.stock = variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid stock or variant data provided' }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        subcategory: true,
      }
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
