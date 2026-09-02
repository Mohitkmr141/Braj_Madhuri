import { verifyAdminToken } from '../../../../../lib/auth.js';
import { getPrisma } from '../../../../../lib/prisma.js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath, revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function PATCH(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    const { id, isBestseller } = await request.json();

    if (!id || isBestseller === undefined) {
      return NextResponse.json({ success: false, error: 'Product ID and isBestseller flag are required' }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { isBestseller: Boolean(isBestseller) }
    });

    try {
      revalidateTag('categories');
      revalidatePath('/shop');
      revalidatePath('/api/products');
      revalidatePath('/bestsellers');
    } catch (e) {}

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Error toggling bestseller:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle bestseller status' },
      { status: 500 }
    );
  }
}
