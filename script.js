let products = [];
let selectedProduct = null;

fetch('product.json')
  .then(res => res.json())
  .then(data => {
    products = Array.isArray(data) ? data : [data];
    populateTypeDropdown();
  });

function populateTypeDropdown() {
  const typeSelect = document.getElementById('typeSelect');
  const types = [...new Set(products.map(p => p.type))];
  types.forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type;
    typeSelect.appendChild(opt);
  });

  typeSelect.addEventListener('change', handleTypeChange);
}

function handleTypeChange() {
  const type = document.getElementById('typeSelect').value;
  const colorSelect = document.getElementById('colorSelect');
  colorSelect.innerHTML = '<option value="">Select Color</option>';
  colorSelect.disabled = false;

  const filtered = products.filter(p => p.type === type);
  filtered.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.color;
    opt.textContent = p.color;
    colorSelect.appendChild(opt);
  });

  colorSelect.addEventListener('change', handleColorSelect);
}

function handleColorSelect() {
  const type = document.getElementById('typeSelect').value;
  const color = document.getElementById('colorSelect').value;
  selectedProduct = products.find(p => p.type === type && p.color === color);

  if (selectedProduct) {
    document.getElementById('pdfBtn').classList.remove('hide');
    showPricing();
  }
}

function openPDF() {
  if (selectedProduct && selectedProduct.pdf) {
    const url = `${selectedProduct.pdf}#page=${selectedProduct.page}`;
    window.open(url, '_blank');
  }
}

function showPricing() {
  const output = document.getElementById('pricingOutput');
  const sizePricing = selectedProduct.pricing;
  let result = '';

  for (const category in sizePricing) {
    result += `\n📍 ${category}:\n`;
    const sizes = sizePricing[category];
    for (const size in sizes) {
      const { MRP, "Discount Price": discount } = sizes[size];
      result += `  • Size ${size}: ₹${MRP} → ₹${discount}\n`;
    }
  }

  document.getElementById('sizePricing').classList.remove('hide');
  output.textContent = result.trim();
}