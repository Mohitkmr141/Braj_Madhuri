import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting color migration for existing products...");

  const products = await prisma.product.findMany();
  let updatedCount = 0;

  for (const product of products) {
    const title = product.title || "";
    let colors = [];

    if (title.includes("Pearl Choker")) {
      colors = ["Green", "Peach", "Yellow"];
    } else if (title.includes("Long Kundan Haar")) {
      colors = ["Yellow", "Pink", "Golden"];
    } else if (title.includes("Small Haar")) {
      colors = ["Green", "Pink", "Silver"];
    } else if (title.includes("Enamael Pendants")) {
      colors = ["Orange", "Green", "Red"];
    } else if (title.includes("Lotus Mala")) {
      colors = ["Red", "Green"];
    } else if (title.includes("Heavy Kundan Mala Haar")) {
      colors = ["Orange", "Light Green"];
    } else if (title === "Kundan Haar") {
      colors = ["Pink", "Green", "Turquoise"];
    } else if (title.includes("Meenakari Chandrika Chokar")) {
      colors = ["Pink", "Blue", "Magenta"];
    }

    if (colors.length > 0) {
      console.log(`Updating '${title}' with colors: ${colors.join(', ')}`);
      await prisma.product.update({
        where: { id: product.id },
        data: { colors }
      });
      updatedCount++;
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
