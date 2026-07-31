import { getPrisma } from '../../../lib/prisma.js';
import { NextResponse } from 'next/server';

export const revalidate = 60; // Cache the response for 60 seconds to improve load speeds



export async function GET() {
  const prisma = getPrisma();
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          include: {
            subcategory: true
          }
        },
        subcategories: true,
      },
      // thumbnailUrl is already a direct field on Category, included automatically
    });

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}


