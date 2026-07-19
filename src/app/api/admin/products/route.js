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
  const cookieStore = cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        title: 'asc'
      },
      include: {
        category: true
      }
    });
    
    const categories = await prisma.category.findMany({
      orderBy: {
        title: 'asc'
      }
    });

    return NextResponse.json({ success: true, products, categories });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const cookieStore = cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.categoryId) {
      return NextResponse.json({ success: false, error: 'Title and Category are required' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        title: data.title,
        categoryId: data.categoryId,
        price: parseFloat(data.price) || 0,
        originalPrice: parseFloat(data.originalPrice) || parseFloat(data.price) || 0,
        stock: parseInt(data.stock, 10) || 0,
        imageUrl: data.imageUrl || null,
        description: data.description || null,
        size: data.size || null,
        subheading: data.subheading || null,
        folderName: "custom", // default for UI created products
        fileName: "custom", // default for UI created products
      }
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const cookieStore = cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: data.id },
      data: {
        title: data.title,
        categoryId: data.categoryId,
        price: parseFloat(data.price),
        originalPrice: parseFloat(data.originalPrice) || parseFloat(data.price),
        stock: parseInt(data.stock, 10),
        imageUrl: data.imageUrl || null,
        description: data.description || null,
        size: data.size || null,
        subheading: data.subheading || null,
      }
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const cookieStore = cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
