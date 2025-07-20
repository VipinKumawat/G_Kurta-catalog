let products = [];

window.onload = async () => {
  const res = await fetch('products.json');
  products = await res.json();

  populateDropdowns();
  setupSizeInputs();
};

function populateDropdowns() {
  const typeSelect = document.getElementById('typeSelect');
  const colorSelect = document.getElementById('colorSelect');
  const pageSelect = document.getElementById('pageSelect');
  const pdfSelect = document.getElementById('pdfSelect');

  // Type dropdown
  const types = [...new Set(products.map(p => p.type))];
  types.forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type;
    typeSelect.appendChild(opt);
  });

  // Event: Load image and populate related fields
  typeSelect.addEventListener('change', () => {
    const selectedType = typeSelect.value;
    const filtered = products.filter(p => p.type === selectedType);

    // Color
    colorSelect.innerHTML = '';
    [...new Set(filtered.map(p => p.color))].forEach(color => {
      const opt = document.createElement('option');
      opt.value = color;
      opt.textContent = color;
      colorSelect.appendChild(opt);
    });

    // Page
    pageSelect.innerHTML = '';
    [...new Set(filtered.map(p => p.page))].forEach(page => {
      const opt = document.createElement('option');
      opt.value = page;
      opt.textContent = page;
      pageSelect.appendChild(opt);
    });

    // PDF
    pdfSelect.innerHTML = '';
    [...new Set(filtered.map(p => p.pdf))].forEach(pdf => {
      const opt = document.createElement('option');
      opt.value = pdf;
      opt.textContent = pdf;
      pdfSelect.appendChild(opt);
    });

    updateImage();
  });

  // Page change updates image
  pageSelect.addEventListener('change', updateImage);
}

function updateImage() {
  const type = document.getElementById('typeSelect').value;
  const page = document.getElementById('pageSelect').value;
  const img = document.getElementById('previewImage');
  const imagePath = `Catlogue_icon/${type}-page-${page}.jpg`;
  img.src = imagePath;
  img.onerror = () => {
    img.src = 'pluspont-logo.png';
  };
}

function setupSizeInputs() {
  const men = ['32','34','36', '38', '40', '42', '44','46','48'];
  const ladies = ['S', 'M', 'L', 'XL','XXL','3Xl','4XL'];
  const kids = ['20', '22', '24', '26', '28', '30'];

  function createInputs(containerId, sizes) {
    const container = document.getElementById(containerId);
    sizes.forEach(size => {
      const row = document.createElement('div');
      row.className = 'size-row';
      row.innerHTML = `
        <label>${size}:</label>
        <input type="number" min="0" data-size="${size}" />
        <input type="number" min="0" data-price="${size}" placeholder="₹ Price" />
      `;
      container.appendChild(row);
    });
  }

  createInputs('menSizes', men);
  createInputs('ladiesSizes', ladies);
  createInputs('kidsSizes', kids);
}

function confirmOrder() {
  const type = document.getElementById('typeSelect').value;
  const color = document.getElementById('colorSelect').value;
  const page = document.getElementById('pageSelect').value;
  const pdf = document.getElementById('pdfSelect').value;

  const groupName = document.getElementById('groupName').value;
  const address = document.getElementById('deliveryAddress').value;
  const contact = document.getElementById('contactNumber').value;
  const orderDate = new Date().toLocaleDateString();

  let totalQty = 0;
  let totalAmt = 0;

  function extractSizes(sectionId, title) {
    const rows = document.getElementById(sectionId).querySelectorAll('.size-row');
    let text = `\n\n${title}\n`;
    rows.forEach(row => {
      const qty = parseInt(row.querySelector('[data-size]').value) || 0;
      const price = parseInt(row.querySelector('[data-price]').value) || 0;
      if (qty > 0) {
        totalQty += qty;
        totalAmt += qty * price;
        text += `${row.querySelector('label').textContent} – Qty: ${qty} – ₹${price} each\n`;
      }
    });
    return text;
  }

  const menText = extractSizes('menSizes', '👨‍🦱 MEN\'S SIZES');
  const ladiesText = extractSizes('ladiesSizes', '👩 LADIES SIZES');
  const kidsText = extractSizes('kidsSizes', '👶 KIDS SIZES');

  const summary = `✅ GROUP ORDER CONFIRMATION

🧥 Product: ${type} Kurta – Color: ${color}
📄 Catalogue: Page ${page} | File: ${pdf}
${menText}${ladiesText}${kidsText}
👥 Group Name: ${groupName}
🏠 Delivery Address: ${address}
📞 Contact Number: ${contact}

🗓️ Order Date: ${orderDate}
🧾 Total Pieces: ${totalQty}
💰 Total Approx Amount: ₹${totalAmt}

📦 Thanks for your group order!`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(summary)}`;
  window.open(whatsappUrl, '_blank');
}
function generateOrderSummary(product) {
  let summary = `✅ GROUP ORDER CONFIRMATION\n\n`;
  summary += `🧥 Product: ${product.type} Kurta – No. ${product.number} – ${product.color}\n`;
  summary += `📄 Catalogue: Page ${product.page} | File: ${product.pdf}\n\n`;

  const groups = ["Mens", "Ladies", "Kids"];
  let totalPieces = 0;
  let totalAmount = 0;

  groups.forEach(group => {
    const groupInputs = document.querySelectorAll(`#${group.toLowerCase()} input[type="number"]`);
    let groupSection = "";
    groupInputs.forEach(input => {
      const qty = parseInt(input.value);
      if (!isNaN(qty) && qty > 0) {
        const size = input.name;
        const price = product.pricing[group][size]["Discount Price"];
        const subtotal = price * qty;
        totalPieces += qty;
        totalAmount += subtotal;
        groupSection += `${size} – Qty: ${qty} – ₹${price} each\n`;
      }
    });

    if (groupSection !== "") {
      summary += (group === "Mens" ? "👨‍🦱" : group === "Ladies" ? "👩" : "👶") + ` ${group.toUpperCase()} SIZES\n` + groupSection + "\n";
    }
  });

  const groupName = document.getElementById("groupName").value;
  const address = document.getElementById("address").value;
  const phone = document.getElementById("phone").value;

  summary += `👥 Group Name: ${groupName}\n`;
  summary += `🏠 Delivery Address: ${address}\n`;
  summary += `📞 Contact Number: ${phone}\n\n`;
  summary += `🗓️ Order Date: ${new Date().toLocaleDateString("en-IN")}\n`;
  summary += `🧾 Total Pieces: ${totalPieces}\n`;
  summary += `💰 Total Approx Amount: ₹${totalAmount}\n\n`;
  summary += `📦 Thanks for your group order!`;

  return encodeURIComponent(summary);
}

document.getElementById("submitOrder").addEventListener("click", () => {
  const selectedProduct = products.find(p => p.id === document.getElementById("productId").value);
  if (!selectedProduct) {
    alert("Please select a product first.");
    return;
  }
  const message = generateOrderSummary(selectedProduct);
  const whatsappURL = `https://wa.me/?text=${message}`;
  window.open(whatsappURL, "_blank");
});