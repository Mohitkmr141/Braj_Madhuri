import { getPrisma } from '../../../../lib/prisma.js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';



export async function GET() {
  const cookieStore = await cookies();
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
        category: true,
        subcategory: true
      }
    });
    
    const categories = await prisma.category.findMany({
      orderBy: {
        title: 'asc'
      },
      include: {
        subcategories: true
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
  const cookieStore = await cookies();
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
        subcategoryId: data.subcategoryId || null,
        price: parseFloat(data.price) || 0,
        originalPrice: parseFloat(data.originalPrice) || parseFloat(data.price) || 0,
        stock: parseInt(data.stock, 10) || 0,
        colors: Array.isArray(data.colors) ? data.colors : [],
        images: Array.isArray(data.images) ? data.images : [],
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
  const cookieStore = await cookies();
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
        subcategoryId: data.subcategoryId || null,
        price: parseFloat(data.price),
        originalPrice: parseFloat(data.originalPrice) || parseFloat(data.price),
        stock: parseInt(data.stock, 10),
        colors: Array.isArray(data.colors) ? data.colors : [],
        images: Array.isArray(data.images) ? data.images : [],
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
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    const { productIds } = await request.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid or empty product IDs" }, { status: 400 });
    }

    const result = await prisma.product.deleteMany({
      where: {
        id: {
          in: productIds
        }
      }
    });

    return NextResponse.json({ success: true, message: `Successfully deleted ${result.count} products.` });
  } catch (error) {
    console.error('Error deleting products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete products' },
      { status: 500 }
    );
  }
}


