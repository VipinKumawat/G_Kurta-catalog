document.addEventListener('DOMContentLoaded', () => {
  const catalogDiv = document.getElementById('catalog');
  const productTypeFilter = document.getElementById('product-type-filter');
  const loadingSpinner = document.getElementById('loading-spinner');
  const productSearchInput = document.getElementById('product-search');
  const searchButton = document.getElementById('search-button');
  const clearSearchButton = document.getElementById('clear-search-button');
  const productCountDiv = document.getElementById('product-count');
  const backToTopButton = document.getElementById('back-to-top');

  let productsData = []; // To store the fetched product data

  // Function to fetch products from JSON
  async function fetchProducts() {
    loadingSpinner.style.display = 'flex'; // Show spinner
    catalogDiv.style.display = 'none'; // Hide catalog
    try {
      const response = await fetch('products.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      productsData = await response.json();
      populateProductTypes(productsData);
      filterAndDisplayProducts(); // Call filterAndDisplayProducts to initially display and count
    } catch (error) {
      console.error('Error fetching products:', error);
      catalogDiv.innerHTML = '<p>Error loading products. Please try again later.</p>';
      catalogDiv.style.display = 'block'; // Show error message
      productCountDiv.textContent = 'Error loading products.';
    } finally {
      loadingSpinner.style.display = 'none'; // Hide spinner regardless of success or error
      catalogDiv.style.display = 'grid'; // Show catalog grid after loading
    }
  }

  // Function to populate the product type filter
  function populateProductTypes(products) {
    const types = new Set(products.map(product => product.type));
    types.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      productTypeFilter.appendChild(option);
    });
  }

  // Function to display products (now called by filterAndDisplayProducts)
  function displayProducts(productsToDisplay) {
    catalogDiv.innerHTML = ''; // Clear previous products
    if (productsToDisplay.length === 0) {
      catalogDiv.innerHTML = '<p>No products found for this category or search.</p>';
      productCountDiv.textContent = 'No products found.'; // Update count
      return;
    }

    productsToDisplay.forEach((product, index) => {
      const productCard = document.createElement('div');
      productCard.classList.add('product-card');
      // Set animation delay dynamically for staggered effect
      productCard.style.animationDelay = `${index * 0.1}s`;

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

      const priceDetailsDiv = document.createElement('div');
      priceDetailsDiv.classList.add('price-details');
      priceDetailsDiv.innerHTML += '<h3>Pricing</h3>';

      for (const category in product.pricing) {
        const categoryDiv = document.createElement('div');
        categoryDiv.classList.add('price-category');
        categoryDiv.innerHTML += `<h4>${category}:</h4>`;
        const priceList = document.createElement('div');
        priceList.classList.add('price-list');

        for (const size in product.pricing[category]) {
          const pricing = product.pricing[category][size];
          const priceItem = document.createElement('span');
          priceItem.classList.add('price-item');
          priceItem.innerHTML = `
            ${size}: <span class="mrp">₹${pricing.MRP}</span> 
            <span class="discount-price">₹${pricing['Discount Price']}</span>
          `;
          priceList.appendChild(priceItem);
        }
        categoryDiv.appendChild(priceList);
        priceDetailsDiv.appendChild(categoryDiv);
      }
      productCard.appendChild(priceDetailsDiv);
      catalogDiv.appendChild(productCard);
    });

    // Update product count message
    productCountDiv.textContent = `Displaying ${productsToDisplay.length} products.`;
  }

  // Function to filter and display products based on search query and type filter
  function filterAndDisplayProducts() {
    const selectedType = productTypeFilter.value;
    const searchQuery = productSearchInput.value.toLowerCase().trim();

    // Show/hide clear button based on search input
    if (searchQuery) {
      clearSearchButton.style.display = 'inline-block';
    } else {
      clearSearchButton.style.display = 'none';
    }

    let filteredProducts = productsData;

    // Apply type filter
    if (selectedType !== 'all') {
      filteredProducts = filteredProducts.filter(product => product.type === selectedType);
    }

    // Apply search filter
    if (searchQuery) {
      filteredProducts = filteredProducts.filter(product =>
        product.id.toLowerCase().includes(searchQuery) ||
        product.color.toLowerCase().includes(searchQuery) ||
        product.type.toLowerCase().includes(searchQuery) || // Search by type text too
        (product.number && product.number.toLowerCase().includes(searchQuery)) // Also search by number, check if it exists
      );
    }
    displayProducts(filteredProducts);
  }

  // Event listeners for filter and search
  productTypeFilter.addEventListener('change', filterAndDisplayProducts);
  searchButton.addEventListener('click', filterAndDisplayProducts);
  productSearchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      filterAndDisplayProducts();
    }
    // Update clear button visibility as user types
    if (productSearchInput.value.trim() !== '') {
      clearSearchButton.style.display = 'inline-block';
    } else {
      clearSearchButton.style.display = 'none';
    }
  });

  // Clear search input and re-filter
  clearSearchButton.addEventListener('click', () => {
    productSearchInput.value = '';
    filterAndDisplayProducts();
  });

  // When the user scrolls down 20px from the top of the document, show the button
  window.onscroll = function() { scrollFunction() };

  function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
      backToTopButton.style.display = "block";
    } else {
      backToTopButton.style.display = "none";
    }
  }

  // When the user clicks on the button, scroll to the top of the document
  backToTopButton.addEventListener('click', () => {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  });

  // Set current year in footer
  document.getElementById('current-year').textContent = new Date().getFullYear();

  // Initial fetch and display
  fetchProducts();
});
