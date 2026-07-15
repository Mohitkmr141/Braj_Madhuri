import { PrismaClient } from '@prisma/client';
import CATEGORIES from '../src/data/categoriesData.js';
import PRODUCT_DATA from '../src/data/productData.js';
import PRODUCT_IMAGE_MAP from '../src/data/productImages.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');

  // Clean existing database
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  console.log('Cleared existing products and categories.');

  // Create Categories
  for (const cat of CATEGORIES) {
    const createdCat = await prisma.category.create({
      data: {
        id: cat.id,
        title: cat.label,
        description: "",
      }
    });

    console.log(`Created Category: ${cat.label}`);

    for (const folderKey of cat.folderKeys) {
      // Find matching folder data even if there's a slight mismatch in keys
      let folderData = PRODUCT_DATA[folderKey];
      if (!folderData) {
        // Try fuzzy matching the folderKey against PRODUCT_DATA keys
        const fuzzyKey = Object.keys(PRODUCT_DATA).find(k => folderKey.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(folderKey.toLowerCase()));
        if (fuzzyKey) folderData = PRODUCT_DATA[fuzzyKey];
      }
      
      const items = folderData?.items || {};
      const imagesInFolder = PRODUCT_IMAGE_MAP[folderKey] || [];
      const processedItemKeys = new Set();

      // 1. Create a product for EVERY image in the folder
      for (const img of imagesInFolder) {
        const fileName = img.fileName;
        
        let itemInfo = items[fileName];
        let matchedKey = fileName;
        
        if (!itemInfo) {
           // Fuzzy match by title
           const foundKey = Object.keys(items).find(k => 
               items[k].title?.toLowerCase().includes(fileName.toLowerCase()) ||
               fileName.toLowerCase().includes(items[k].title?.toLowerCase())
           );
           if (foundKey) {
               itemInfo = items[foundKey];
               matchedKey = foundKey;
           }
        }
        
        if (itemInfo) processedItemKeys.add(matchedKey);
        
        await prisma.product.create({
          data: {
            categoryId: createdCat.id,
            folderName: folderKey,
            fileName: fileName,
            imageUrl: img.image,
            title: itemInfo?.title || fileName.replace(/_|-/g, ' '),
            description: itemInfo?.description || folderData?.description || "Authentic devotional item from Braj Madhuri.",
            price: itemInfo?.price || folderData?.price || 250,
            originalPrice: itemInfo?.originalPrice || folderData?.originalPrice || itemInfo?.price || folderData?.price || 350,
            size: itemInfo?.size || null,
          }
        });
      }

      // 2. Create products for any remaining items in PRODUCT_DATA that didn't have a specific image
      for (const [itemKey, itemInfo] of Object.entries(items)) {
          if (processedItemKeys.has(itemKey)) continue;

          let imageUrl = "/header-banner.jpg";
          if (imagesInFolder.length > 0) imageUrl = imagesInFolder[0].image;

          await prisma.product.create({
          data: {
            categoryId: createdCat.id,
            folderName: folderKey,
            fileName: itemKey,
            imageUrl: imageUrl,
            title: itemInfo.title || itemKey,
            description: itemInfo.description || folderData?.description || "Authentic devotional item.",
            price: itemInfo.price || folderData?.price || 250,
            originalPrice: itemInfo.originalPrice || folderData?.originalPrice || itemInfo.price || folderData?.price || 350,
            size: itemInfo.size || null,
          }
        });
      }
    }
  }

  console.log('Seed completed successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
