const { PrismaClient } = require("@prisma/client");
const https = require("https");
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findMany({ select: { images: true } });
  let rawUrl = null;
  for(const prod of p) {
    if (prod.images && prod.images.length > 0) {
      rawUrl = prod.images[0];
      break;
    }
  }
  
  if (!rawUrl) {
    console.log("No images found in any product");
    return;
  }
  console.log("Original URL:", rawUrl);
  
  if (rawUrl.includes("/object/public/")) {
    const renderUrl = rawUrl.replace("/object/public/", "/render/image/public/") + "?width=256&quality=85&format=webp";
    console.log("Render URL:", renderUrl);
    
    https.get(renderUrl, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => console.log("Response Status:", res.statusCode, "Body:", data));
    });
  }
  await prisma.$disconnect();
}
main();
