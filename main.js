let productData;

fetch("product.json")
  .then(res => res.json())
  .then(data => productData = data);

function parseSizes(text) {
  if (!text.trim()) return [];
  return text.split(",").map(line => {
    const [size, qty] = line.split(":").map(s => s.trim());
    return { size, qty: parseInt(qty) };
  });
}

function generateOrder() {
  const type = document.getElementById("type").value;
  const page = document.getElementById("page").value;
  const color = document.getElementById("color").value;
  const group = document.getElementById("group").value;
  const address = document.getElementById("address").value;
  const contact = document.getElementById("contact").value;

  const men = parseSizes(document.getElementById("men").value);
  const ladies = parseSizes(document.getElementById("ladies").value);
  const kids = parseSizes(document.getElementById("kids").value);

  const prices = productData[type].prices;
  const file = productData[type].file;

  let totalQty = 0;
  let totalAmount = 0;

  const formatBlock = (label, sizes, price) => {
    if (!sizes.length) return "";
    const lines = sizes.map(s => {
      totalQty += s.qty;
      totalAmount += s.qty * price;
      return `${s.size} – Qty: ${s.qty} – ₹${price} each`;
    }).join("\n");
    return `\n${label}\n\n${lines}\n`;
  };

  const menBlock = formatBlock("👨‍🦱 MEN'S SIZES", men, prices.men);
  const ladiesBlock = formatBlock("👩 LADIES SIZES", ladies, prices.ladies);
  const kidsBlock = formatBlock("👶 KIDS SIZES", kids, prices.kids);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric"
  });

  const msg = `
✅ GROUP ORDER CONFIRMATION

🧥 Product: ${type.charAt(0).toUpperCase() + type.slice(1)} Kurta – No. ${page} – ${color}
📄 Catalogue: Page ${page} | File: ${file}
${menBlock}${ladiesBlock}${kidsBlock}
👥 Group Name: ${group}  
🏠 Delivery Address: ${address}  
📞 Contact Number: ${contact}  

🗓️ Order Date: ${today}  
🧾 Total Pieces: ${totalQty}  
💰 Total Approx Amount: ₹${totalAmount}

---

📦 Thanks for your group order!  
We'll confirm availability and reach out shortly. 🙏`.trim();

  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");

  // Image preview
  const imgPath = `Image/${type}-${page}.png`;
  document.getElementById("preview").src = imgPath;
}