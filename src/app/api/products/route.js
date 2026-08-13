import { getPrisma } from '../../../lib/prisma.js';
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

export const revalidate = 60; // Cache the response for 60 seconds to improve load speeds

const getCachedCategories = unstable_cache(
  async () => {
    const prisma = getPrisma();
    return prisma.category.findMany({
      include: {
        products: {
          include: {
            subcategory: true
          }
        },
        subcategories: true,
      },
    });
  },
  ['api-products-categories-cache'],
  { revalidate: 60, tags: ['categories'] }
);

export async function GET() {
  try {
    const categories = await getCachedCategories();

    return NextResponse.json(
      { success: true, categories },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}


