import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("Connecting to database...");
    
    const categoriesCount = await prisma.category.count();
    console.log(`Categories found: ${categoriesCount}`);

    const productsCount = await prisma.product.count();
    console.log(`Products found: ${productsCount}`);

    const ordersCount = await prisma.order.count();
    console.log(`Orders found: ${ordersCount}`);

    // Check for orphaned products (categoryId doesn't exist in Category table)
    const allCategories = await prisma.category.findMany({ select: { id: true } });
    const categoryIds = new Set(allCategories.map(c => c.id));
    
    const products = await prisma.product.findMany();
    let orphans = 0;
    products.forEach(p => {
      if (!categoryIds.has(p.categoryId)) {
        console.warn(`[WARNING] Orphaned Product found: ${p.title} (ID: ${p.id}) has invalid categoryId: ${p.categoryId}`);
        orphans++;
      }
    });

    if (orphans === 0) {
      console.log("No orphaned products found. Data integrity looks good!");
    }

    console.log("Database check completed successfully.");
  } catch (error) {
    console.error("Database error encountered:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
