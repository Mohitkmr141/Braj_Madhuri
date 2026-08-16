import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma.js';
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

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const prisma = getPrisma();
    const categories = await prisma.category.findMany({
      orderBy: { title: 'asc' },
      include: { subcategories: true },
    });
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const prisma = getPrisma();
    const data = await request.json();
    const { title, description } = data;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    // Generate URL-friendly ID from title with safe fallback
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = slug || `cat-${Date.now()}`;

    const category = await prisma.category.create({
      data: {
        id,
        title,
        description: description || '',
      }
    });

    triggerRevalidation();
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    
    // Check for unique constraint violation (category ID already exists)
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'A category with a similar name already exists.' }, { status: 400 });
    }
    
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const prisma = getPrisma();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID is required' }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id }
    });

    triggerRevalidation();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const prisma = getPrisma();
    const data = await request.json();
    const { id, title, description } = data;

    if (!id || !title) {
      return NextResponse.json({ success: false, error: 'ID and Title are required' }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        title,
        description: description || '',
      }
    });

    triggerRevalidation();
    return NextResponse.json({ success: true, category }, { status: 200 });
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
