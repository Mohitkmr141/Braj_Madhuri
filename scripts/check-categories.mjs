import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    include: { products: true }
  });
  
  for (const cat of categories) {
    if (cat.title.toLowerCase().includes('dhoop') || cat.title.toLowerCase().includes('incense')) {
        console.log(`Category: ${cat.title} (ID: ${cat.id}) - Products: ${cat.products.length}`);
        cat.products.forEach(p => console.log(`  - ${p.title} (${p.imageUrl})`));
    }
  }
}

main().finally(() => prisma.$disconnect());
