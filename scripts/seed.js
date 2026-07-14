import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import PRODUCT_DATA from '../src/data/productData.js';
import PRODUCT_IMAGE_MAP from '../src/data/productImages.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Delete existing data to start fresh
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // 2. Build a lookup map from PRODUCT_DATA items by fileName
  const itemDataMap = {};
  for (const [dataFolderName, categoryData] of Object.entries(PRODUCT_DATA)) {
    if (categoryData.items) {
      for (const [fileName, itemData] of Object.entries(categoryData.items)) {
        itemDataMap[fileName] = {
          ...itemData,
          fallbackPrice: categoryData.price,
          fallbackOriginalPrice: categoryData.originalPrice,
          fallbackTitle: categoryData.title,
          fallbackDesc: categoryData.description
        };
      }
    } else {
      itemDataMap[dataFolderName] = {
         title: categoryData.title,
         description: categoryData.description,
         price: categoryData.price,
         originalPrice: categoryData.originalPrice,
         fallbackPrice: categoryData.price
      };
    }
  }

  // 3. Iterate over PRODUCT_IMAGE_MAP to seed products
  // PRODUCT_IMAGE_MAP is the single source of truth for the folder names used in UI
  for (const [rawFolderKey, images] of Object.entries(PRODUCT_IMAGE_MAP)) {
    const folderName = rawFolderKey.replace(/^(images|products)\//, '');
    console.log(`Processing category: ${folderName}`);

    const matchingCategoryData = PRODUCT_DATA[folderName] || {};

    const category = await prisma.category.upsert({
      where: { id: folderName },
      update: {
        title: matchingCategoryData.title || folderName,
        description: matchingCategoryData.description || null,
        basePrice: matchingCategoryData.price || null,
        originalPrice: matchingCategoryData.originalPrice || null,
        size: matchingCategoryData.size || null,
        sizes: matchingCategoryData.sizes || [],
      },
      create: {
        id: folderName,
        title: matchingCategoryData.title || folderName,
        description: matchingCategoryData.description || null,
        basePrice: matchingCategoryData.price || null,
        originalPrice: matchingCategoryData.originalPrice || null,
        size: matchingCategoryData.size || null,
        sizes: matchingCategoryData.sizes || [],
      },
    });

    for (const img of images) {
      const fileName = img.fileName;
      // Try to find item data using fileName, or fall back to folderName
      const itemData = itemDataMap[fileName] || itemDataMap[folderName] || {};

      await prisma.product.create({
        data: {
          categoryId: category.id,
          folderName: folderName,
          fileName: fileName,
          imageUrl: img.image,
          title: itemData.title || itemData.fallbackTitle || fileName,
          description: itemData.description || itemData.fallbackDesc || null,
          subheading: itemData.subheading || null,
          price: itemData.price || itemData.fallbackPrice || null,
          originalPrice: itemData.originalPrice || itemData.fallbackOriginalPrice || null,
        },
      });
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
