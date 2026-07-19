import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: node make-admin.mjs <user-email>");
    process.exit(1);
  }

  try {
    const user = await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { role: "ADMIN" },
    });
    console.log(`Successfully updated ${user.email} to ADMIN role.`);
  } catch (error) {
    if (error.code === 'P2025') {
      console.error(`User with email ${email} not found.`);
    } else {
      console.error("Failed to update user:", error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
