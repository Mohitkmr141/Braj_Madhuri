import { verifyAdminToken } from '../../../../lib/auth.js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidateTag, revalidatePath } from 'next/cache';
import { getSupabase } from '../../../../lib/supabase.js';
import { getPrisma } from '../../../../lib/prisma.js';

export const dynamic = 'force-dynamic';

// PUT: Upload a new category thumbnail image
export async function PUT(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const categoryId = formData.get('categoryId');

    if (!file || !categoryId) {
      return NextResponse.json({ success: false, error: 'Missing file or categoryId' }, { status: 400 });
    }

    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'File size exceeds 5MB limit.' }, { status: 400 });
    }

    const fileExt = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExt) || !ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Only JPG, PNG, and WebP images are allowed.'
      }, { status: 400 });
    }

    const fileName = `category-${categoryId}-${Date.now()}.${fileExt}`;
    const filePath = `product-images/${fileName}`;

    const supabase = getSupabase();
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Save the URL directly on the Category record
    const prisma = getPrisma();
    await prisma.category.update({
      where: { id: categoryId },
      data: { thumbnailUrl: publicUrl },
    });

    revalidateTag('categories');
    revalidatePath('/shop');

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }
    console.error('Error updating category image:', error);
    return NextResponse.json({ success: false, error: 'Failed to update category image' }, { status: 500 });
  }
}

// DELETE: Remove the category thumbnail (reverts to auto-selected product image)
export async function DELETE(request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || !(await verifyAdminToken(session.value))) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { categoryId } = await request.json();

    if (!categoryId) {
      return NextResponse.json({ success: false, error: 'Missing categoryId' }, { status: 400 });
    }

    const prisma = getPrisma();
    await prisma.category.update({
      where: { id: categoryId },
      data: { thumbnailUrl: null },
    });

    revalidateTag('categories');
    revalidatePath('/shop');

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }
    console.error('Error removing category image:', error);
    return NextResponse.json({ success: false, error: 'Failed to remove category image' }, { status: 500 });
  }
}
