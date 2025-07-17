document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const catalogDiv = document.getElementById('catalog');
  const productTypeFilter = document.getElementById('product-type-filter');
  const loadingSpinner = document.getElementById('loading-spinner');
  const productSearchInput = document.getElementById('product-search');
  const searchButton = document.getElementById('search-button');
  const clearSearchButton = document.getElementById('clear-search-button');
  const productCountDiv = document.getElementById('product-count');
  const backToTopButton = document.getElementById('back-to-top');

  // Cart elements
  const cartItemCountSpan = document.getElementById('cart-item-count');
  const viewCartButton = document.getElementById('view-cart-button');
  const cartModal = document.getElementById('cart-modal');
  const closeModalButton = document.querySelector('.close-button');
  const cartItemsDisplayDiv = document.getElementById('cart-items-display');
  const emptyCartMessage = document.getElementById('empty-cart-message');
  const clearCartModalButton = document.getElementById('clear-cart-modal-button');
  const placeOrderWhatsappButton = document.getElementById('place-order-whatsapp-button');

  // Global Data Storage
  let productsData = []; // To store the fetched product data
  let cart = []; // Array to store cart items

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
      populateProductTypes(productsData); // Populate filter dropdown
      filterAndDisplayProducts(); // Initial display of products
      updateCartCount(); // Update cart count from localStorage
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
   * Populates the product type filter dropdown with unique product types.
   * @param {Array} products - The array of product objects.
   */
  function populateProductTypes(products) {
    const types = new Set(products.map(product => product.type));
    productTypeFilter.innerHTML = '<option value="all">All</option>'; // Always start with 'All'
    types.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      productTypeFilter.appendChild(option);
    });
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
      // Display message if no pricing is available for the selected category
      priceDisplayElement.innerHTML = '<p class="no-pricing-message">Pricing not available for this category.</p>';
    }
  }

  /**
   * Filters products based on selected type and search query, then displays them.
   */
  function filterAndDisplayProducts() {
    const selectedType = productTypeFilter.value;
    const searchTerm = productSearchInput.value.toLowerCase().trim();

    const filteredProducts = productsData.filter(product => {
      const matchesType = selectedType === 'all' || product.type === selectedType;
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
      // Determine a default category to show prices for initially
      const defaultCategory = availableCategories.includes('Mens') ? 'Mens' : availableCategories[0];

      // Product basic info section
      const productInfo = `
        <div class="product-info">
          <h2>${product.type} ${product.number}</h2>
          <p><strong>ID:</strong> ${product.id}</p>
          <p class="color"><strong>Color:</strong> ${product.color}</p>
          <a href="./pdf/${product.pdf}#page=${product.page}" target="_blank" class="page-link">
            View PDF (Page ${product.page}) <i class="fas fa-file-pdf"></i>
          </a>
        </div>
      `;
      productCard.innerHTML += productInfo;

      // Category selection buttons
      const categoryButtonsContainer = document.createElement('div');
      categoryButtonsContainer.classList.add('category-buttons-container');
      
      const dynamicPriceDisplay = document.createElement('div');
      dynamicPriceDisplay.classList.add('dynamic-price-display');

      let currentSelectedCategory = defaultCategory; // Keep track of the active category for this specific card

      // Create a button for each category available for this product
      availableCategories.forEach(cat => {
        const button = document.createElement('button');
        button.classList.add('category-button');
        button.textContent = cat;
        button.dataset.category = cat; // Store category name in data attribute for easy access

        // Set the default active category and display its prices
        if (cat === defaultCategory) {
          button.classList.add('active');
          displayCategoryPrices(product, cat, dynamicPriceDisplay);
        }

        // Add click event listener to switch active category and update prices
        button.addEventListener('click', () => {
          // Remove 'active' class from all buttons in this card's container
          categoryButtonsContainer.querySelectorAll('.category-button').forEach(btn => {
            btn.classList.remove('active');
          });
          button.classList.add('active'); // Add 'active' class to the clicked button
          currentSelectedCategory = cat; // Update the actively selected category for this card
          displayCategoryPrices(product, cat, dynamicPriceDisplay); // Display prices for the newly selected category
        });
        categoryButtonsContainer.appendChild(button);
      });

      productCard.appendChild(categoryButtonsContainer); // Add buttons to the card
      productCard.appendChild(dynamicPriceDisplay); // Add price display area

      // Add to Cart Button
      const addToCartButton = document.createElement('button');
      addToCartButton.classList.add('add-to-cart-button');
      addToCartButton.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Cart';
      
      addToCartButton.addEventListener('click', () => {
        // Use the currently active category for adding to cart
        const selectedPricing = product.pricing[currentSelectedCategory];

        // Check if pricing exists for the selected category
        if (!selectedPricing || Object.keys(selectedPricing).length === 0) {
          alert(`No pricing available for "${currentSelectedCategory}" for this product. Cannot add to cart.`);
          return;
        }

        // Prompt for size and validate input
        let sizeInput = prompt(`Enter size for ${product.id} (${currentSelectedCategory}) e.g. S, M, L, XL, XXL (Available: ${Object.keys(selectedPricing).join(', ')}):`);
        if (!sizeInput) return; // User cancelled

        sizeInput = sizeInput.toUpperCase().trim();
        if (!selectedPricing[sizeInput]) {
          alert(`Invalid size "${sizeInput}" for ${currentSelectedCategory}. Please choose from available sizes: ${Object.keys(selectedPricing).join(', ')}`);
          return;
        }

        // Prompt for quantity and validate input
        let quantityInput = prompt(`Enter quantity for size ${sizeInput}:`, "1");
        if (!quantityInput || isNaN(quantityInput) || parseInt(quantityInput) <= 0) {
          alert("Please enter a valid quantity (a positive number).");
          return;
        }
        const quantity = parseInt(quantityInput);

        // Create item object to add to cart
        const itemToAdd = {
          productId: product.id,
          productType: product.type,
          productNumber: product.number,
          productColor: product.color,
          selectedCategory: currentSelectedCategory, // Crucial: Store the selected category
          selectedSize: sizeInput,
          quantity: quantity,
          price: selectedPricing[sizeInput]['Discount Price'],
          mrp: selectedPricing[sizeInput]['MRP']
        };

        addToCart(itemToAdd); // Add the item to the cart
      });

      productCard.appendChild(addToCartButton); // Add the button to the card
      catalogDiv.appendChild(productCard); // Add the complete card to the catalog
    });

    // Update the displayed product count
    productCountDiv.textContent = `Displaying ${productsToDisplay.length} products.`;
  }

  // --- Cart Management Functions ---

  /**
   * Loads cart data from localStorage.
   */
  function loadCart() {
    const storedCart = localStorage.getItem('pluspointCart');
    if (storedCart) {
      cart = JSON.parse(storedCart);
    }
  }

  /**
   * Saves current cart data to localStorage.
   */
  function saveCart() {
    localStorage.setItem('pluspointCart', JSON.stringify(cart));
  }

  /**
   * Adds an item to the cart, updating quantity if item already exists.
   * @param {Object} item - The item object to add.
   */
  function addToCart(item) {
    // Check if item with same ID, category, and size already exists
    const existingItemIndex = cart.findIndex(
      (cartItem) =>
        cartItem.productId === item.productId &&
        cartItem.selectedCategory === item.selectedCategory &&
        cartItem.selectedSize === item.selectedSize
    );

    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += item.quantity; // Update quantity
    } else {
      cart.push(item); // Add new item
    }
    saveCart(); // Save updated cart to localStorage
    updateCartCount(); // Update cart icon count
    alert(`"${item.productType} ${item.productNumber}" (Category: ${item.selectedCategory}, Size: ${item.selectedSize}, Qty: ${item.quantity}) added to cart!`);
  }

  /**
   * Removes an item from the cart by its index.
   * @param {number} index - The index of the item to remove.
   */
  function removeFromCart(index) {
    cart.splice(index, 1); // Remove item from array
    saveCart(); // Save updated cart
    updateCartCount(); // Update cart icon count
    renderCartItems(); // Re-render cart in modal to reflect changes
  }

  /**
   * Clears all items from the cart after confirmation.
   */
  function clearCart() {
    if (confirm("Are you sure you want to clear your entire cart?")) {
      cart = []; // Empty the cart array
      saveCart(); // Save empty cart
      updateCartCount(); // Update cart icon count
      renderCartItems(); // Re-render cart (will show empty message)
      alert("Your cart has been cleared!");
      cartModal.style.display = 'none'; // Close modal after clearing
    }
  }

  /**
   * Updates the item count displayed on the cart icon and manages button visibility.
   */
  function updateCartCount() {
    cartItemCountSpan.textContent = cart.length;
    // Show/hide place order button based on cart items
    if (cart.length > 0) {
      placeOrderWhatsappButton.style.display = 'inline-block';
      emptyCartMessage.style.display = 'none';
    } else {
      placeOrderWhatsappButton.style.display = 'none';
      emptyCartMessage.style.display = 'block';
    }
  }

  /**
   * Renders the items currently in the cart within the modal.
   */
  function renderCartItems() {
    cartItemsDisplayDiv.innerHTML = ''; // Clear previous items
    if (cart.length === 0) {
      emptyCartMessage.style.display = 'block'; // Show empty cart message
      return;
    } else {
      emptyCartMessage.style.display = 'none'; // Hide empty cart message
    }

    cart.forEach((item, index) => {
      const cartItemDiv = document.createElement('div');
      cartItemDiv.classList.add('cart-item');
      cartItemDiv.innerHTML = `
        <div class="cart-item-info">
          <strong>${item.productType} ${item.productNumber}</strong> (${item.productColor})<br>
          Category: ${item.selectedCategory}, Size: ${item.selectedSize}, Qty: ${item.quantity}<br>
          Price: ₹${item.price} (MRP: ₹${item.mrp})
        </div>
        <button class="cart-item-remove" data-index="${index}">Remove</button>
      `;
      cartItemsDisplayDiv.appendChild(cartItemDiv);
    });

    // Add event listeners for dynamically created remove buttons
    document.querySelectorAll('.cart-item-remove').forEach(button => {
      button.addEventListener('click', (event) => {
        const indexToRemove = parseInt(event.target.dataset.index);
        removeFromCart(indexToRemove);
      });
    });
  }

  /**
   * Generates the WhatsApp message string based on current cart items.
   * @returns {string} The URL-encoded WhatsApp message.
   */
  function generateWhatsappOrderMessage() {
    if (cart.length === 0) {
      return encodeURIComponent("Hello PlusPoint Team, I'd like to inquire about products. My cart is empty.");
    }

    let message = "Hello PlusPoint Team,\n\nI'd like to place an order for the following items from your catalog:\n\n";

    cart.forEach((item, index) => {
      message += `* Item ${index + 1}:\n`;
      message += `    - Product ID: ${item.productId}\n`;
      message += `    - Type: ${item.productType}\n`;
      message += `    - Number: ${item.productNumber}\n`;
      message += `    - Color: ${item.productColor}\n`;
      message += `    - Category: ${item.selectedCategory}\n`; // Crucial: Include selected category
      message += `    - Size: ${item.selectedSize}\n`;
      message += `    - Quantity: ${item.quantity}\n`;
      message += `    - Price per piece: ₹${item.price} (MRP ₹${item.mrp})\n\n`;
    });

    message += "Could you please confirm the total amount and availability of these items? Also, let me know about payment options and delivery details.\n\nThank you!";
    
    return encodeURIComponent(message);
  }

  // --- Event Listeners ---

  // Cart Modal related events
  viewCartButton.addEventListener('click', () => {
    cartModal.style.display = 'flex'; // Show modal
    renderCartItems(); // Populate cart items in modal
    // Set the WhatsApp link with the generated message
    placeOrderWhatsappButton.href = `https://wa.me/918866244409?text=${generateWhatsappOrderMessage()}`;
  });

  closeModalButton.addEventListener('click', () => {
    cartModal.style.display = 'none'; // Hide modal
  });

  // Close modal if clicked outside the content
  window.addEventListener('click', (event) => {
    if (event.target === cartModal) {
      cartModal.style.display = 'none';
    }
  });

  clearCartModalButton.addEventListener('click', clearCart); // Clear cart button in modal

  // Filter and Search events
  productTypeFilter.addEventListener('change', filterAndDisplayProducts);
  searchButton.addEventListener('click', filterAndDisplayProducts);
  productSearchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      filterAndDisplayProducts();
    }
    // Show/hide clear search button
    if (productSearchInput.value.trim() !== '') {
      clearSearchButton.style.display = 'inline-block';
    } else {
      clearSearchButton.style.display = 'none';
    }
  });

  clearSearchButton.addEventListener('click', () => {
    productSearchInput.value = ''; // Clear search input
    filterAndDisplayProducts(); // Re-filter and display
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
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  });

  // Set current year in footer
  document.getElementById('current-year').textContent = new Date().getFullYear();

  // --- Initial Load ---
  loadCart(); // Load any previously saved cart items
  fetchProducts(); // Start fetching and displaying products
});
