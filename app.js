document.addEventListener("DOMContentLoaded", function () {
  const productContainer = document.getElementById("product-list");

  fetch("product.json")
    .then((response) => response.json())
    .then((products) => {
      products.forEach((product) => {
        const card = document.createElement("div");
        card.className =
          "product-card shadow-sm p-3 mb-4 rounded bg-white border";

        const previewImage = `/catalogue_icon/${product.type.toLowerCase()}-page-${product.page}.jpg`;

        card.innerHTML = `
          <img src="${previewImage}" alt="Preview" class="product-image mb-2" onerror="this.src='fallback.jpg'"/>
          <h4 class="mb-1 text-capitalize">${product.type} – ${product.color}</h4>
          <p><strong>ID:</strong> ${product.id}</p>
          <div class="d-flex gap-2 mt-2">
            <a href="/pdf/${product.type.toLowerCase()}.pdf#page=${product.page}" target="_blank" class="btn btn-sm btn-outline-dark">
              📄 View PDF
            </a>
            <a href="${generateWhatsAppLink(product)}" target="_blank" class="btn btn-sm btn-success">
              🛒 Order
            </a>
          </div>
        `;
        productContainer.appendChild(card);
      });
    });

  function generateWhatsAppLink(product) {
    const message = `Hi! I want to place a group order for:

🧥 Product: ${product.type} – ${product.color} (ID: ${product.id})

👨‍🦱 MEN:
[S – Qty]
[M – Qty]
[L – Qty]

👩 LADIES:
[S – Qty]
[M – Qty]
[L – Qty]

👶 KIDS (Boys):
[24 – Qty]
[26 – Qty]

👥 Group Name:
🏠 Address:
📞 Contact Number:`;

    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
});