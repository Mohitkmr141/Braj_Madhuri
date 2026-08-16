import { verifyAdminToken } from '../../../../lib/auth.js';
import { NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma.js';
import { cookies } from 'next/headers';
import { revalidateTag, revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

function triggerRevalidation() {
  try {
    revalidateTag('categories');
    revalidatePath('/shop');
    revalidatePath('/api/products');
  } catch (e) {
    // ignore in non-cached environments
  }
}

export async function POST(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const prisma = getPrisma();
    const data = await request.json();
    const { title, description, categoryId } = data;

    if (!title || !categoryId) {
      return NextResponse.json({ success: false, error: 'Title and Category ID are required' }, { status: 400 });
    }

    const subcategory = await prisma.subcategory.create({
      data: {
        title,
        description: description || '',
        categoryId,
      }
    });

    triggerRevalidation();
    return NextResponse.json({ success: true, subcategory }, { status: 201 });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const prisma = getPrisma();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Subcategory ID is required' }, { status: 400 });
    }

    await prisma.subcategory.delete({
      where: { id }
    });

    triggerRevalidation();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Subcategory not found' }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to delete subcategory' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const prisma = getPrisma();
    const data = await request.json();
    const { id, title, description, categoryId } = data;

    if (!id || !title || !categoryId) {
      return NextResponse.json({ success: false, error: 'ID, Title and Category ID are required' }, { status: 400 });
    }

    const subcategory = await prisma.subcategory.update({
      where: { id },
      data: {
        title,
        description: description || '',
        categoryId,
      }
    });

    triggerRevalidation();
    return NextResponse.json({ success: true, subcategory }, { status: 200 });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Subcategory not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
