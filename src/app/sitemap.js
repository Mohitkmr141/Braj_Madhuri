import { getPrisma } from '../lib/prisma.js';

export default async function sitemap() {
  const baseUrl = "https://thebrajmadhuri.com";

  const defaultPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/combos`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    const prisma = getPrisma();
    const categories = await prisma.category.findMany({
      include: {
        subcategories: true,
      },
    });

    const categoryPages = categories.flatMap(cat => {
      const catUrl = {
        url: `${baseUrl}/shop?category=${encodeURIComponent(cat.id)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      };

      const subcatUrls = cat.subcategories.map(sub => ({
        url: `${baseUrl}/shop?category=${encodeURIComponent(`${cat.id}::${sub.title}`)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }));

      return [catUrl, ...subcatUrls];
    });

    return [...defaultPages, ...categoryPages];
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    return defaultPages;
  }
}
