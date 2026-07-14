import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import PRODUCT_DATA from '../src/data/productData.js';
import PRODUCT_IMAGE_MAP from '../src/data/productImages.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  for (const [folderName, categoryData] of Object.entries(PRODUCT_DATA)) {
    // 1. Create or Update the Category
    const categoryId = folderName;
    console.log(`Processing category: ${categoryId}`);

    const category = await prisma.category.upsert({
      where: { id: categoryId },
      update: {
        title: categoryData.title,
        description: categoryData.description || null,
        basePrice: categoryData.price || null,
        originalPrice: categoryData.originalPrice || null,
        size: categoryData.size || null,
        sizes: categoryData.sizes || [],
      },
      create: {
        id: categoryId,
        title: categoryData.title || categoryId,
        description: categoryData.description || null,
        basePrice: categoryData.price || null,
        originalPrice: categoryData.originalPrice || null,
        size: categoryData.size || null,
        sizes: categoryData.sizes || [],
      },
    });

    // 2. Process Items (if any)
    if (categoryData.items) {
      for (const [fileName, itemData] of Object.entries(categoryData.items)) {
        // Find image url if exists
        const imagesForFolder = PRODUCT_IMAGE_MAP[folderName] || [];
        const matchingImage = imagesForFolder.find((img) => img.fileName === fileName);
        const imageUrl = matchingImage ? matchingImage.src : null;

        await prisma.product.create({
          data: {
            categoryId: category.id,
            folderName: folderName,
            fileName: fileName,
            imageUrl: imageUrl,
            title: itemData.title || fileName,
            description: itemData.description || null,
            subheading: itemData.subheading || null,
            price: itemData.price || null,
            originalPrice: itemData.originalPrice || null,
          },
        });
      }
    } else {
      // If no items, the category itself acts as a product
      const imagesForFolder = PRODUCT_IMAGE_MAP[folderName] || [];
      // Usually just one image if there are no sub-items, or multiple variants mapped differently
      for (const img of imagesForFolder) {
        await prisma.product.create({
          data: {
            categoryId: category.id,
            folderName: folderName,
            fileName: img.fileName,
            imageUrl: img.src,
            title: category.title,
            description: category.description || null,
            price: category.basePrice || null,
            originalPrice: category.originalPrice || null,
          },
        });
      }
    }
  }
  
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
