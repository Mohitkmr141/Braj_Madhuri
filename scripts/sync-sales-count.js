import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all successful orders...');
  
  // Get all orders that are not pending payment or cancelled
  const orders = await prisma.order.findMany({
    where: {
      status: {
        notIn: ['Payment_Pending', 'Cancelled']
      }
    }
  });

  console.log(`Found ${orders.length} successful orders. Calculating sales...`);

  // Map to store product sales
  const salesMap = {}; // { productId: count }

  for (const order of orders) {
    let items = [];
    try {
      items = typeof order.cartItems === 'string' ? JSON.parse(order.cartItems) : (order.cartItems || []);
    } catch (e) {
      console.warn(`Could not parse cartItems for order ${order.orderNumber}`);
      continue;
    }

    for (const item of items) {
      if (!item.id) continue;
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      
      if (!salesMap[item.id]) {
        salesMap[item.id] = 0;
      }
      salesMap[item.id] += qty;
    }
  }

  const productIds = Object.keys(salesMap);
  console.log(`Found ${productIds.length} unique products with sales. Updating database...`);

  // Update products one by one (safe approach for migration)
  for (const productId of productIds) {
    const qty = salesMap[productId];
    try {
      await prisma.product.update({
        where: { id: productId },
        data: {
          salesCount: qty
        }
      });
      console.log(`- Updated Product ID ${productId} with salesCount = ${qty}`);
    } catch (e) {
      console.warn(`- Failed to update Product ID ${productId} (might have been deleted): ${e.message}`);
    }
  }

  console.log('Migration complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
