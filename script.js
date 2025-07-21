let products = [];
let filteredProduct = null; // Will hold the single selected product

window.onload = async () => {
  const res = await fetch('products.json');
  products = await res.json();

  // Set default image on load
  document.getElementById('previewImage').src = 'Catlogue_icon/default.png';

  populateDropdowns();
  // No need for setupSizeInputs() as rendering is dynamic
};

function populateDropdowns() {
  const typeSelect = document.getElementById('typeSelect');
  const colorSelect = document.getElementById('colorSelect');

  // Clear existing options
  typeSelect.innerHTML = '<option value="">Select Type</option>';
  colorSelect.innerHTML = '<option value="">Select Color</option>';

  // Type dropdown
  const types = [...new Set(products.map(p => p.type))];
  types.forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type;
    typeSelect.appendChild(opt);
  });

  // Event: When type changes, populate colors and update image
  typeSelect.addEventListener('change', () => {
    const selectedType = typeSelect.value;
    const productsOfType = products.filter(p => p.type === selectedType);

    // Color
    colorSelect.innerHTML = '<option value="">Select Color</option>'; // Reset color dropdown
    if (selectedType) { // Only populate if a type is selected
      [...new Set(productsOfType.map(p => p.color))].forEach(color => {
        const opt = document.createElement('option');
        opt.value = color;
        opt.textContent = color;
        colorSelect.appendChild(opt);
      });
    }
    // Reset pricing and summary when type changes
    document.getElementById('pricingOutputDiv').innerHTML = '';
    document.getElementById('orderSummaryOutput').innerHTML = '';
    filteredProduct = null; // Clear selected product

    updateImageAndPricing(); // Call to update image and pricing based on current selections
  });

  // Event: When color changes, update image and pricing
  colorSelect.addEventListener('change', () => {
    updateImageAndPricing();
  });
}

function updateImageAndPricing() {
  const type = document.getElementById('typeSelect').value;
  const color = document.getElementById('colorSelect').value;
  const img = document.getElementById('previewImage');
  const pricingOutputDiv = document.getElementById('pricingOutputDiv');

  // Find the exact product
  filteredProduct = products.find(p => p.type === type && p.color === color);

  if (filteredProduct) {
    const imagePath = `Catlogue_icon/${filteredProduct.type}-page-${filteredProduct.page}.jpg`;
    img.src = imagePath;
    img.onerror = () => {
      img.src = 'pluspont-logo.png'; // Fallback image
    };
    renderProductPricing(filteredProduct);
  } else {
    img.src = 'pluspont-logo.png'; // Fallback if no product matches
    pricingOutputDiv.innerHTML = '<p>Please select both Type and Color to see product details and pricing.</p>';
  }
}

function renderProductPricing(product) {
  const pricingOutputDiv = document.getElementById('pricingOutputDiv');
  if (!product || !product.pricing) {
    pricingOutputDiv.innerHTML = '<p>No pricing available for this selection.</p>';
    return;
  }

  let htmlContent = '<h3>Available Sizes & Pricing:</h3>';

  for (const category in product.pricing) {
    if (Object.hasOwnProperty.call(product.pricing, category)) {
      htmlContent += `<h4>${category}'s:</h4><div class="category-sizes">`;
      const sizes = product.pricing[category];

      for (const size in sizes) {
        if (Object.hasOwnProperty.call(sizes, size)) {
          const pricing = sizes[size];
          const mrp = pricing["MRP"] || 0;
          const discountPrice = pricing["Discount Price"] || 0;

          htmlContent += `
            <div class="size-item">
              <label>${size}:</label>
              <input type="number" min="0" value="0"
                     data-category="${category}"
                     data-size="${size}"
                     data-mrp="${mrp}"
                     data-discount="${discountPrice}"
                     class="qty-input"
                     placeholder="Qty"/>
              <span>MRP: ₹${mrp}</span>
              <span>Discount: ₹${discountPrice}</span>
            </div>
          `;
        }
      }
      htmlContent += `</div>`;
    }
  }
  pricingOutputDiv.innerHTML = htmlContent;
}

function showOrderSummary() {
  const orderSummaryOutput = document.getElementById('orderSummaryOutput');

  if (!filteredProduct) {
    orderSummaryOutput.innerHTML = '<p>Please select a product (Type and Color) first.</p>';
    return { html: '<p>Please select a product first.</p>', whatsapp: 'Please select a product first.' };
  }

  const qtyInputs = document.querySelectorAll('#pricingOutputDiv .qty-input');
  const selectedItemsByCategory = {};
  let totalItems = 0;
  let totalPrice = 0;

  qtyInputs.forEach(input => {
    const quantity = parseInt(input.value);

    if (quantity > 0) {
      const category = input.dataset.category;
      const size = input.dataset.size;
      const mrp = parseFloat(input.dataset.mrp);
      const discountPrice = parseFloat(input.dataset.discount);

      const itemDetails = {
        size: size,
        quantity: quantity,
        mrp: mrp,
        discountPrice: discountPrice,
        lineTotal: quantity * discountPrice
      };

      if (!selectedItemsByCategory[category]) {
        selectedItemsByCategory[category] = [];
      }
      selectedItemsByCategory[category].push(itemDetails);

      totalItems += quantity;
      totalPrice += (quantity * discountPrice);
    }
  });

  let htmlSummary = '';
  let whatsappTextSummary = '';

  if (Object.keys(selectedItemsByCategory).length > 0) {
    // --- Generate HTML Summary ---
    htmlSummary += `<h3>Order Summary for ${filteredProduct.color} (${filteredProduct.type})</h3>`;

    // --- Generate WhatsApp Text Summary (Header) ---
    whatsappTextSummary += `*Order Summary for ${filteredProduct.color} (${filteredProduct.type})*\n\n`;

    for (const category in selectedItemsByCategory) {
      // HTML for category
      htmlSummary += `<h4>Category: ${category}</h4><table><thead><tr><th>Size</th><th>Qty</th><th>MRP (per)</th><th>Discount Price (per)</th><th>Line Total</th></tr></thead><tbody>`;

      // WhatsApp text for category
      whatsappTextSummary += `*Category: ${category}*\n`;

      selectedItemsByCategory[category].forEach(item => {
        // HTML for item row
        htmlSummary += `<tr><td>${item.size}</td><td>${item.quantity}</td><td>₹${item.mrp.toFixed(2)}</td><td>₹${item.discountPrice.toFixed(2)}</td><td>₹${item.lineTotal.toFixed(2)}</td></tr>`;
        // WhatsApp text for item
        whatsappTextSummary += `  - Size: ${item.size}, Qty: ${item.quantity}, Price: ₹${item.discountPrice.toFixed(2)} (Total: ₹${item.lineTotal.toFixed(2)})\n`;
      });

      // Close HTML table for category
      htmlSummary += `</tbody></table>`;
      // Add a blank line for readability between categories in WhatsApp text
      whatsappTextSummary += `\n`;
    }

    // --- Final HTML totals ---
    htmlSummary += `<p><strong>Total Items:</strong> ${totalItems}</p><p><strong>Overall Total:</strong> ₹${totalPrice.toFixed(2)}</p>`;

    // --- Final WhatsApp text totals ---
    whatsappTextSummary += `*Total Items:* ${totalItems}\n`;
    whatsappTextSummary += `*Overall Total:* ₹${totalPrice.toFixed(2)}`;

  } else {
    htmlSummary = '<p>No items selected for order. Please enter quantities.</p>';
    whatsappTextSummary = 'No items selected for order. Please enter quantities.';
  }

  // Display HTML summary on the webpage
  orderSummaryOutput.innerHTML = htmlSummary;

  // Return both summaries
  return {
    html: htmlSummary,
    whatsapp: whatsappTextSummary
  };
}

document.getElementById("orderSummaryButton").addEventListener("click", showOrderSummary);

document.getElementById("sendOrderWhatsapp").addEventListener("click", () => {
  const summaries = showOrderSummary(); // First generate and display the summary

  if (!filteredProduct) {
    alert("Please select a product and enter quantities before sending to WhatsApp.");
    return;
  }

  const groupName = document.getElementById('groupName').value;
  const address = document.getElementById('deliveryAddress').value;
  const contact = document.getElementById('contactNumber').value;

  if (!groupName || !address || !contact) {
      alert("Please fill in Group Name, Delivery Address, and Contact Number.");
      return;
  }


  let finalWhatsappMessage = `Hi! I want to place a group order for:\n\n`;
  finalWhatsappMessage += `🧥 Product: ${filteredProduct.type} – ${filteredProduct.color} – No. ${filteredProduct.number}\n\n`;
  finalWhatsappMessage += summaries.whatsapp; // Add the dynamic order summary
  finalWhatsappMessage += `\n\n👥 Group Name: ${groupName}`;
  finalWhatsappMessage += `\n🏠 Delivery Address: ${address}`;
  finalWhatsappMessage += `\n📞 Contact Number: ${contact}`;
  finalWhatsappMessage += `\n\n🗓️ Order Date: ${new Date().toLocaleDateString("en-IN")}`;
  finalWhatsappMessage += `\n\n📦 Thanks for your group order!`;


  const whatsappURL = `https://wa.me/919722609460?text=${encodeURIComponent(finalWhatsappMessage)}`;
  window.open(whatsappURL, "_blank");
});
