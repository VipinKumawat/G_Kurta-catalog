document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const catalogDiv = document.getElementById('catalog');
  const categorySelectionContainer = document.getElementById('category-selection-container'); // New filter container
  const loadingSpinner = document.getElementById('loading-spinner');
  const productSearchInput = document.getElementById('product-search');
  const searchButton = document.getElementById('search-button');
  const clearSearchButton = document.getElementById('clear-search-button');
  const productCountDiv = document.getElementById('product-count');
  const backToTopButton = document.getElementById('back-to-top');

  // Global Data Storage
  let productsData = []; // To store the fetched product data
  let selectedCategoryFilter = 'all'; // Default filter category

  // --- Utility Functions ---

  /**
   * Helper function to get a category thumbnail path.
   * YOU MUST ENSURE THESE IMAGE FILES EXIST IN YOUR 'Catlogue_icon/' FOLDER.
   * @param {string} type - The product type (e.g., 'Digital', 'Plain Kurta', 'Lakhnavi Kurta').
   * @returns {string} The path to the thumbnail image.
   */
  function getCategoryThumbnail(type) {
    const sanitizedType = type.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
    // Mapping common types to specific image names. Adjust as per your actual file names.
    switch (sanitizedType) {
        case 'digital':
            return 'Catlogue_icon/printed-page-1.jpg'; // Assuming you have this
        case 'plain-kurta':
            return 'Catlogue_icon/plain-page-1.jpg'; // Assuming you have this
        case 'printed-kurta':
            return 'Catlogue_icon/printed-page-1.jpg'; // Assuming you have this
        case 'lakhnavi-kurta':
            return 'Catlogue_icon/lakhnavi-page-1.jpg'; // Assuming you have this
        // Add more cases as needed for your specific product types
        default:
            return 'Catlogue_icon/default-icon.jpg'; // A fallback default icon
    }
  }


  /**
   * Helper function to get a color code for the swatch.
   * You might expand this with more specific color mappings.
   * @param {string} colorName - The name of the color (e.g., "Red", "Blue Plain").
   * @returns {string} CSS color code.
   */
  function getColorCode(colorName) {
    const lowerCaseColor = colorName.toLowerCase();
    switch (lowerCaseColor) {
      case 'orange plain': return '#FFA500';
      case 'white plain': return '#FFFFFF';
      case 'maroon plain':
      case 'maroon': return '#800000';
      case 'yellow plain': return '#FFFF00';
      case 'black plain': return '#000000';
      case 'sky plain': return '#87CEEB';
      case 'b. green plain':
      case 'b. green': return '#006400'; // Darker green
      case 'rama plain': return '#008080'; // Teal-like
      case 'blue plain':
      case 'blue': return '#0000FF';
      case 'wine plain':
      case 'wine': return '#722F37';
      default: return '#ccc'; // Default light gray for unknown colors
    }
  }

  // --- Core Functions ---

  /**
   * Fetches product data from products.json and initializes the catalog.
   */
  async function fetchProducts() {
    loadingSpinner.style.display = 'flex'; // Show loading spinner
    catalogDiv.style.display = 'none'; // Hide catalog during loading
    try {
      const response = await fetch('products.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      productsData = await response.json();
      populateCategoryFilters(productsData); // Populate category buttons
      filterAndDisplayProducts(); // Initial display of products
    } catch (error) {
      console.error('Error fetching products:', error);
      catalogDiv.innerHTML = '<p>Error loading products. Please try again later.</p>';
      catalogDiv.style.display = 'block'; // Show error message
      productCountDiv.textContent = 'Error loading products.';
    } finally {
      loadingSpinner.style.display = 'none'; // Hide spinner
      catalogDiv.style.display = 'grid'; // Show catalog grid
    }
  }

  /**
   * Populates the category filter buttons with unique product types.
   * @param {Array} products - The array of product objects.
   */
  function populateCategoryFilters(products) {
    const types = new Set(products.map(product => product.type));
    // Clear existing buttons except the "All" button
    categorySelectionContainer.querySelectorAll('.category-filter-button:not([data-type="all"])').forEach(button => button.remove());

    types.forEach(type => {
      const button = document.createElement('button');
      button.classList.add('category-filter-button');
      button.dataset.type = type;
      button.innerHTML = `
        <img src="${getCategoryThumbnail(type)}" alt="${type}" class="category-thumbnail">
        <span>${type}</span>
      `;

      button.addEventListener('click', () => {
        categorySelectionContainer.querySelectorAll('.category-filter-button').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');
        selectedCategoryFilter = type;
        filterAndDisplayProducts();
      });
      categorySelectionContainer.appendChild(button);
    });

    // Event listener for the "All" button
    const allButton = categorySelectionContainer.querySelector('[data-type="all"]');
    if (allButton) {
      allButton.addEventListener('click', () => {
        categorySelectionContainer.querySelectorAll('.category-filter-button').forEach(btn => {
          btn.classList.remove('active');
        });
        allButton.classList.add('active');
        selectedCategoryFilter = 'all';
        filterAndDisplayProducts();
      });
    }
  }


  /**
   * Displays pricing for a specific category for a given product.
   * @param {Object} product - The product object.
   * @param {string} selectedCategory - The category (e.g., 'Mens', 'Ladies', 'Kids').
   * @param {HTMLElement} priceDisplayElement - The DOM element to display prices in.
   */
  function displayCategoryPrices(product, selectedCategory, priceDisplayElement) {
    priceDisplayElement.innerHTML = ''; // Clear previous prices
    const categoryPricing = product.pricing[selectedCategory];

    if (categoryPricing && Object.keys(categoryPricing).length > 0) {
      const priceList = document.createElement('div');
      priceList.classList.add('price-list');

      for (const size in categoryPricing) {
        const pricing = categoryPricing[size];
        const priceItem = document.createElement('span');
        priceItem.classList.add('price-item');
        priceItem.innerHTML = `
          ${size}: <span class="mrp">₹${pricing.MRP}</span>
          <span class="discount-price">₹${pricing['Discount Price']}</span>
        `;
        priceList.appendChild(priceItem);
      }
      priceDisplayElement.appendChild(priceList);
    } else {
      priceDisplayElement.innerHTML = '<p class="no-pricing-message">Pricing not available for this category.</p>';
    }
  }

  /**
   * Filters products based on selected type and search query, then displays them.
   */
  function filterAndDisplayProducts() {
    const searchTerm = productSearchInput.value.toLowerCase().trim();

    const filteredProducts = productsData.filter(product => {
      const matchesType = selectedCategoryFilter === 'all' || product.type === selectedCategoryFilter;
      const matchesSearch = searchTerm === '' ||
        product.id.toLowerCase().includes(searchTerm) ||
        product.color.toLowerCase().includes(searchTerm) ||
        product.type.toLowerCase().includes(searchTerm) ||
        product.number.toLowerCase().includes(searchTerm);
      return matchesType && matchesSearch;
    });
    displayProducts(filteredProducts);
  }

  /**
   * Renders product cards in the catalog.
   * @param {Array} productsToDisplay - The array of product objects to display.
   */
  function displayProducts(productsToDisplay) {
    catalogDiv.innerHTML = ''; // Clear previous products
    if (productsToDisplay.length === 0) {
      catalogDiv.innerHTML = '<p>No products found for this category or search.</p>';
      productCountDiv.textContent = 'No products found.';
      return;
    }

    productsToDisplay.forEach((product, index) => {
      const productCard = document.createElement('div');
      productCard.classList.add('product-card');
      productCard.style.animationDelay = `${index * 0.1}s`;

      const availableCategories = Object.keys(product.pricing);
      const defaultCategory = availableCategories.includes('Mens') ? 'Mens' : availableCategories[0];
      if (!defaultCategory && product.pricing && Object.keys(product.pricing).length > 0) {
        // Fallback for cases where 'Mens' isn't available, but other categories are
        // This ensures a category is selected if any pricing is present.
        defaultCategory = Object.keys(product.pricing)[0];
      }

      // PDF Preview Section
      const pdfPreviewContainer = document.createElement('div');
      pdfPreviewContainer.classList.add('pdf-preview-container');
      const canvas = document.createElement('canvas');
      canvas.classList.add('pdf-preview-canvas');
      pdfPreviewContainer.appendChild(canvas);
      productCard.appendChild(pdfPreviewContainer);

      // Render PDF page on canvas
      renderPdfPage(product.pdf, product.page, canvas);

      // Product basic info section
      const productInfo = `
        <div class="product-info">
          <h2>${product.type} ${product.number}</h2>
          <p><strong>ID:</strong> ${product.id}</p>
          <p class="color-display"><strong>Color:</strong> ${product.color}
            <span class="color-swatch" style="background-color: ${getColorCode(product.color)};"></span>
          </p>
        </div>
      `;
      productCard.innerHTML += productInfo;

      // Category selection buttons (for Men/Ladies/Kids)
      const categoryButtonsContainer = document.createElement('div');
      categoryButtonsContainer.classList.add('category-buttons-container');

      const dynamicPriceDisplay = document.createElement('div');
      dynamicPriceDisplay.classList.add('dynamic-price-display');

      let currentSelectedCategoryForCard = defaultCategory; // Keep track of the active category for this specific card

      // Only add category buttons if pricing exists for them
      if (availableCategories.length > 0) {
        availableCategories.forEach(cat => {
          const button = document.createElement('button');
          button.classList.add('category-button');
          button.textContent = cat;
          button.dataset.category = cat;

          if (cat === defaultCategory) {
            button.classList.add('active');
            displayCategoryPrices(product, cat, dynamicPriceDisplay);
          }

          button.addEventListener('click', () => {
            categoryButtonsContainer.querySelectorAll('.category-button').forEach(btn => {
              btn.classList.remove('active');
            });
            button.classList.add('active');
            currentSelectedCategoryForCard = cat; // Update for this specific card
            displayCategoryPrices(product, cat, dynamicPriceDisplay);
          });
          categoryButtonsContainer.appendChild(button);
        });
        productCard.appendChild(categoryButtonsContainer);
      } else {
         dynamicPriceDisplay.innerHTML = '<p class="no-pricing-message">No categories or pricing defined for this product.</p>';
      }


      productCard.appendChild(dynamicPriceDisplay);


      // WhatsApp Order Button (instead of Add to Cart)
      const whatsappOrderButton = document.createElement('a');
      whatsappOrderButton.classList.add('whatsapp-order-button');
      whatsappOrderButton.innerHTML = '<i class="fab fa-whatsapp"></i> Order Now on WhatsApp';
      whatsappOrderButton.href = '#'; // Default href, will be updated on click
      whatsappOrderButton.target = '_blank';

      // Add click listener for WhatsApp Order
      whatsappOrderButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior
        initiateWhatsappOrder(product, currentSelectedCategoryForCard);
      });

      productCard.appendChild(whatsappOrderButton);
      catalogDiv.appendChild(productCard);
    });

    productCountDiv.textContent = `Displaying ${productsToDisplay.length} products.`;
  }

  /**
   * Renders a specific page of a PDF onto a given canvas.
   * @param {string} pdfUrl - The URL of the PDF file.
   * @param {number} pageNumber - The page number to render.
   * @param {HTMLCanvasElement} canvas - The canvas element to render to.
   */
  async function renderPdfPage(pdfUrl, pageNumber, canvas) {
    if (!pdfUrl) {
        console.warn('PDF URL is missing for rendering.');
        // Display a fallback message on the canvas
        const context = canvas.getContext('2d');
        canvas.height = 100;
        canvas.width = 150;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#f8d7da'; // Light red background
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = '12px Arial';
        context.fillStyle = '#721c24'; // Dark red text
        context.textAlign = 'center';
        context.fillText('No PDF Defined', canvas.width / 2, canvas.height / 2);
        return;
    }

    const loadingTask = pdfjsLib.getDocument(`./pdf/${pdfUrl}`);
    try {
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 0.8 }); // Adjust scale as needed
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      await page.render(renderContext).promise;
    } catch (error) {
      console.error(`Error rendering PDF page ${pageNumber} from ${pdfUrl}:`, error);
      // Display a fallback message or image on the canvas
      const context = canvas.getContext('2d');
      canvas.height = 100;
      canvas.width = 150;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#f8d7da'; // Light red background
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = '12px Arial';
      context.fillStyle = '#721c24'; // Dark red text
      context.textAlign = 'center';
      context.fillText('PDF Preview Failed', canvas.width / 2, canvas.height / 2 - 10);
      context.fillText('(Open PDF to view)', canvas.width / 2, canvas.height / 2 + 10);
    }
  }


  /**
   * Initiates the WhatsApp order process by prompting for size/quantity and generating the message.
   * @param {Object} product - The product object to order.
   * @param {string} selectedCategory - The category selected for this product card.
   */
  function initiateWhatsappOrder(product, selectedCategory) {
    if (!selectedCategory || !product.pricing[selectedCategory]) {
        alert("Please select a category for this product to view pricing and order.");
        return;
    }

    const pricing = product.pricing[selectedCategory];
    let orderDetails = [];
    let isValidInput = false;

    // Build prompt message for sizes and prices
    let promptMessage = `Ordering ${product.type} ${product.number} (${product.color} - Category: ${selectedCategory})\n\n`;
    promptMessage += `Available Sizes (Enter Quantity):\n`;

    for (const size in pricing) {
        promptMessage += `- ${size} (MRP: ₹${pricing[size].MRP}, Disc. Price: ₹${pricing[size]['Discount Price']})\n`;
    }
    promptMessage += `\nExample: S:2, M:1, XL:3 (Use comma to separate different sizes)`;

    const input = prompt(promptMessage);

    if (input) {
        const sizeQuantityPairs = input.split(',').map(s => s.trim()).filter(s => s);
        sizeQuantityPairs.forEach(pair => {
            const parts = pair.split(':');
            if (parts.length === 2) {
                const size = parts[0].trim().toUpperCase(); // Normalize size input
                const quantity = parseInt(parts[1].trim());

                if (pricing[size] && !isNaN(quantity) && quantity > 0) {
                    orderDetails.push({
                        size: size,
                        quantity: quantity,
                        price: pricing[size]['Discount Price'],
                        mrp: pricing[size].MRP
                    });
                    isValidInput = true;
                } else if (pricing[size] && (!isNaN(quantity) && quantity === 0)) {
                    // User entered 0, ignore this size but don't flag as invalid input overall
                } else {
                    alert(`Invalid input for size '${parts[0]}' or quantity '${parts[1]}'. Please check your input format.`);
                    isValidInput = false; // Flag as invalid if any part is wrong
                    return; // Exit forEach
                }
            } else {
                alert(`Invalid format for '${pair}'. Please use 'SIZE:QUANTITY' (e.g., S:2).`);
                isValidInput = false; // Flag as invalid
                return; // Exit forEach
            }
        });
    }

    if (!isValidInput || orderDetails.length === 0) {
        alert("Order cancelled or no valid quantities entered. Please try again with valid size and quantity (e.g., S:2, M:1).");
        return;
    }

    // Generate WhatsApp message
    let whatsappMessage = `Hello PlusPoint Team,\n\nI'd like to order the following item:\n\n`;
    whatsappMessage += `* Product ID: ${product.id}\n`;
    whatsappMessage += `    - Type: ${product.type}\n`;
    whatsappMessage += `    - Number: ${product.number}\n`;
    whatsappMessage += `    - Color: ${product.color}\n`;
    whatsappMessage += `    - Category: ${selectedCategory}\n`;
    whatsappMessage += `    - Ordered Sizes & Quantities:\n`;

    let totalItems = 0;
    let totalPrice = 0;

    orderDetails.forEach(detail => {
        whatsappMessage += `        - Size: ${detail.size}, Quantity: ${detail.quantity} pieces\n`;
        whatsappMessage += `          (Price per piece: ₹${detail.price}, MRP: ₹${detail.mrp})\n`;
        totalItems += detail.quantity;
        totalPrice += (detail.price * detail.quantity);
    });

    whatsappMessage += `\nTotal Pieces: ${totalItems}\n`;
    whatsappMessage += `Estimated Total Price: ₹${totalPrice.toFixed(2)}\n\n`;

    whatsappMessage += `Could you please confirm the availability and total amount? Also, let me know about payment options and delivery details.\n\nThank you!`;

    const whatsappUrl = `https://wa.me/918866244409?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
  }


  // --- Event Listeners ---

  // Search events
  searchButton.addEventListener('click', filterAndDisplayProducts);
  productSearchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      filterAndDisplayProducts();
    }
    if (productSearchInput.value.trim() !== '') {
      clearSearchButton.style.display = 'inline-block';
    } else {
      clearSearchButton.style.display = 'none';
    }
  });

  clearSearchButton.addEventListener('click', () => {
    productSearchInput.value = '';
    filterAndDisplayProducts();
    clearSearchButton.style.display = 'none'; // Hide after clearing
  });

  // Back to Top Button functionality
  window.onscroll = function() { scrollFunction() };
  function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
      backToTopButton.style.display = "block";
    } else {
      backToTopButton.style.display = "none";
    }
  }
  backToTopButton.addEventListener('click', () => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  });

  // Set current year in footer
  document.getElementById('current-year').textContent = new Date().getFullYear();

  // --- Initial Load ---
  fetchProducts(); // Start fetching and displaying products
});
