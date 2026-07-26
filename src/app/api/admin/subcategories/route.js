import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
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

    return NextResponse.json({ success: true, subcategory }, { status: 201 });
  } catch (error) {
    console.error('Error creating subcategory:', error);
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
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Subcategory ID is required' }, { status: 400 });
    }

    await prisma.subcategory.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete subcategory' },
      { status: 500 }
    );
  }
}
