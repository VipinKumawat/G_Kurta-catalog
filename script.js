let productData = [];
let currentProduct = null;

const typeSelect = document.getElementById("typeSelect");
const colorSelect = document.getElementById("colorSelect");
const sizeSelect = document.getElementById("sizeSelect");
const quantityInput = document.getElementById("quantityInput");
const priceDisplay = document.getElementById("priceDisplay");
const pdfPreview = document.getElementById("pdfPreview");
const orderList = document.getElementById("orderList");

fetch('products.json')
  .then(response => response.json())
  .then(data => {
    productData = data;
    populateTypes();
    typeSelect.dispatchEvent(new Event("change"));
  })
  .catch(error => console.error("Error loading products.json:", error));

function populateTypes() {
  const types = [...new Set(productData.map(p => p.type))];
  typeSelect.innerHTML = "";
  types.forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    typeSelect.appendChild(option);
  });
}

function populateColors(type) {
  colorSelect.innerHTML = "";
  const filtered = productData.filter(p => p.type === type);
  filtered.forEach(p => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = p.color;
    colorSelect.appendChild(option);
  });
  if (filtered.length) {
    updateProduct(filtered[0].id);
  }
}

function updateProduct(productId) {
  currentProduct = productData.find(p => p.id === productId);
  updateSizes();
  updatePreview();
  updatePrice();
}

function updateSizes() {
  sizeSelect.innerHTML = "";
  if (!currentProduct) return;

  const categoryKeys = Object.keys(currentProduct.pricing);
  categoryKeys.forEach(cat => {
    const sizes = Object.keys(currentProduct.pricing[cat]);
    sizes.forEach(size => {
      const option = document.createElement("option");
      option.value = `${cat}:${size}`;
      option.textContent = `${cat} – ${size}`;
      sizeSelect.appendChild(option);
    });
  });
}

function updatePrice() {
  const selected = sizeSelect.value;
  if (!selected || !currentProduct) return;

  const [cat, size] = selected.split(":");
  const price = currentProduct.pricing[cat][size];
  if (price) {
    priceDisplay.innerHTML = `MRP: ₹${price.MRP} | Discount: ₹${price["Discount Price"]}`;
  } else {
    priceDisplay.innerHTML = "Price not found.";
  }
}

function updatePreview() {
  if (!currentProduct) return;
  pdfPreview.src = `pdf/${currentProduct.pdf}#page=${currentProduct.page}`;
}

// Event Listeners
typeSelect.addEventListener("change", () => {
  populateColors(typeSelect.value);
});

colorSelect.addEventListener("change", () => {
  updateProduct(colorSelect.value);
});

sizeSelect.addEventListener("change", updatePrice);

document.getElementById("orderButton").addEventListener("click", () => {
  const selected = sizeSelect.value;
  if (!currentProduct || !selected) return;

  const qty = parseInt(quantityInput.value);
  const [cat, size] = selected.split(":");
  const price = currentProduct.pricing[cat][size];

  const listItem = document.createElement("li");
  listItem.textContent = `${currentProduct.color} | ${cat} ${size} – Qty: ${qty} | ₹${price["Discount Price"] * qty}`;
  orderList.appendChild(listItem);
});