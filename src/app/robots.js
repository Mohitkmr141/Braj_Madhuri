export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/cart", "/checkout", "/success"],
    },
    sitemap: "https://thebrajmadhuri.com/sitemap.xml",
  };
}
