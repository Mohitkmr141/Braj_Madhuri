const https = require("https");
const url = "https://vdujlymtqvmztikeokje.supabase.co/storage/v1/render/image/public/products/test.jpg?width=256";
https.get(url, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => console.log("Status:", res.statusCode, "Body:", data));
});
