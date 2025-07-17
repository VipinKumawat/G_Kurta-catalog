document.addEventListener('DOMContentLoaded', () => {
    const collectionsSection = document.getElementById('collections');
    const catalogDetailSection = document.getElementById('catalog-detail');
    const catalogContent = document.getElementById('catalog-content');
    const backToCollectionsBtn = catalogDetailSection.querySelector('.btn-back');
    const detailSectionTitle = catalogDetailSection.querySelector('h2');

    let allProducts = []; // To store all products from product.json
    let organizedCategories = {}; // To store products organized by type

    // --- Utility Functions ---

    // Function to group products by type
    function groupProductsByType(products) {
        const grouped = {};
        products.forEach(product => {
            if (!grouped[product.type]) {
                grouped[product.type] = [];
            }
            grouped[product.type].push(product);
        });
        return grouped;
    }

    // Function to get a display image for a category
    // You'll need to create thumbnail images like 'images/plain_thumbnail.jpg', 'images/lakhnavi_thumbnail.jpg'
    function getCategoryThumbnail(type) {
        switch (type) {
            case 'Plain':
                return 'images/plain_thumbnail.jpg'; // Path to a generic Plain category image
            case 'Lakhnavi':
                return 'images/lakhnavi_thumbnail.jpg'; // Path to a generic Lakhnavi category image
            // Add cases for 'Print' or other types
            default:
                return 'images/default_thumbnail.jpg'; // Fallback
        }
    }

    // Function to get a display image for an individual product
    // You'll need to create specific product images, e.g., 'images/P01_OrangePlain.jpg'
    function getProductImage(product) {
        // Example: 'images/P02_WhitePlain.jpg'
        // Or, if you have consistent naming: 'images/' + product.id + '.jpg'
        // Or, 'images/' + product.color.replace(/\s+/g, '') + '.jpg'
        // For simplicity, let's use a placeholder first, you can adjust this.
        return `images/${product.id}_${product.color.replace(/\s+/g, '')}.jpg`;
    }


    // Function to render PDF using PDF.js
    async function renderPdfPage(url, pageNum, canvas) {
        // Ensure the worker script is set if you're not using the full bundled PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

        try {
            const loadingTask = pdfjsLib.getDocument(url);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(pageNum); // Load the specific page

            // Get viewport at a scale (adjust scale for better quality/fit)
            const viewport = page.getViewport({ scale: 1.5 });
            const context = canvas.getContext('2d');

            // Set canvas dimensions to PDF page dimensions
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render PDF page into canvas
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            await page.render(renderContext).promise;

            // Optional: Add a link to download the full PDF
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.textContent = `Download ${url.split('/').pop()}`; // e.g., "Download plain.pdf"
            downloadLink.target = "_blank";
            downloadLink.classList.add('btn', 'btn-secondary', 'pdf-download-btn');
            catalogContent.appendChild(downloadLink);

        } catch (error) {
            console.error(`Error rendering PDF from ${url}, page ${pageNum}:`, error);
            catalogContent.innerHTML = `<p>Error loading PDF preview for this product. Please try again later or contact support. Details: ${error.message}</p>`;
        }
    }

    // --- Rendering Functions ---

    // Renders the initial category cards (Plain, Lakhnavi, etc.)
    function renderCategoryCards() {
        const collectionGrid = collectionsSection.querySelector('.collection-grid');
        collectionGrid.innerHTML = ''; // Clear existing content

        // Iterate over the organized categories to create cards
        for (const type in organizedCategories) {
            const productsInType = organizedCategories[type];
            const card = document.createElement('div');
            card.classList.add('collection-card');
            const categoryName = type === 'Lakhnavi' ? 'Lucknowi' : type; // Display 'Lucknowi' instead of 'Lakhnavi'
            const numProducts = productsInType.length;

            card.innerHTML = `
                <img src="${getCategoryThumbnail(type)}" alt="${categoryName} Collection" class="collection-image">
                <h3>${categoryName} Kurtas</h3>
                <p>Available in ${numProducts} ${numProducts > 1 ? 'colors/designs' : 'color/design'}.</p>
                <a href="#" class="btn btn-secondary" data-category-type="${type}">View ${categoryName}</a>
            `;
            collectionGrid.appendChild(card);
        }
    }

    // Renders individual product cards for a selected category
    function renderProductsForCategory(type) {
        detailSectionTitle.textContent = `${type === 'Lakhnavi' ? 'Lucknowi' : type} Collection`;
        catalogContent.innerHTML = '<div class="product-grid"></div>'; // Create a grid for products
        const productGrid = catalogContent.querySelector('.product-grid');

        const productsToDisplay = organizedCategories[type];

        if (!productsToDisplay || productsToDisplay.length === 0) {
            productGrid.innerHTML = '<p>No products found for this category.</p>';
            return;
        }

        productsToDisplay.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card'); // Use .product-card from previous CSS
            // Find the lowest discount price to display "Starting from"
            let lowestPrice = Infinity;
            ['Kids', 'Mens', 'Ladies'].forEach(group => {
                if (product.pricing[group]) {
                    for (const size in product.pricing[group]) {
                        const price = product.pricing[group][size]['Discount Price'];
                        if (price < lowestPrice) {
                            lowestPrice = price;
                        }
                    }
                }
            });

            productCard.innerHTML = `
                <img src="${getProductImage(product)}" alt="${product.color} ${product.type} Kurta" class="product-image">
                <h3>${product.color}</h3>
                <p>ID: ${product.id}</p>
                <p class="starting-price">Starting from ₹${lowestPrice !== Infinity ? lowestPrice : 'N/A'}</p>
                <a href="#" class="btn btn-primary view-product-details-btn" data-product-id="${product.id}">View Details</a>
            `;
            productGrid.appendChild(productCard);
        });
    }

    // Renders detailed pricing for a single product and its PDF page
    function renderSingleProductDetails(productId) {
        const product = allProducts.find(p => p.id === productId);

        if (!product) {
            catalogContent.innerHTML = '<p>Product not found.</p>';
            return;
        }

        detailSectionTitle.textContent = `${product.color} (${product.id})`;
        catalogContent.innerHTML = `
            <div class="single-product-detail-layout">
                <div class="product-image-container">
                    <img src="${getProductImage(product)}" alt="${product.color} ${product.type} Kurta" class="product-detail-image">
                </div>
                <div class="product-pricing-details">
                    <h3>Pricing for ${product.color}</h3>
                    ${Object.keys(product.pricing).map(category => `
                        <h4>${category} Sizes</h4>
                        <div class="size-pricing-table">
                            ${Object.keys(product.pricing[category]).map(size => `
                                <div class="size-row">
                                    <span>${size}</span>
                                    <div class="price-info">
                                        <span class="mrp">MRP: ₹${product.pricing[category][size]['MRP']}</span>
                                        <span class="discount-price">₹${product.pricing[category][size]['Discount Price']}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                    <p class="pdf-info">Product shown on page ${product.page} of ${product.pdf}</p>
                </div>
                <div class="pdf-viewer">
                    <h4>PDF Preview</h4>
                    <canvas id="pdf-canvas"></canvas>
                </div>
            </div>
        `;

        // Render the specific PDF page
        const pdfCanvas = document.getElementById('pdf-canvas');
        if (pdfCanvas) {
            renderPdfPage(product.pdf, product.page, pdfCanvas);
        }
    }


    // --- View Management Functions ---

    function showCollections() {
        collectionsSection.classList.remove('hidden');
        catalogDetailSection.classList.remove('active');
        catalogDetailSection.classList.add('hidden');
        // Reset scroll position if needed
        window.scrollTo({ top: collectionsSection.offsetTop, behavior: 'smooth' });
    }

    function showDetailsView() {
        collectionsSection.classList.add('hidden');
        catalogDetailSection.classList.add('active');
        catalogDetailSection.classList.remove('hidden');
        // Scroll to the top of the details section
        window.scrollTo({ top: catalogDetailSection.offsetTop, behavior: 'smooth' });
    }


    // --- Event Listeners ---

    // Listener for clicking on a category card (e.g., "View Plain")
    collectionsSection.addEventListener('click', (event) => {
        const targetBtn = event.target.closest('.btn-secondary');
        if (targetBtn && targetBtn.dataset.categoryType) {
            event.preventDefault();
            const categoryType = targetBtn.dataset.categoryType;
            renderProductsForCategory(categoryType);
            showDetailsView();
        }
    });

    // Listener for clicking on an individual product's "View Details" button
    catalogContent.addEventListener('click', (event) => {
        const targetBtn = event.target.closest('.view-product-details-btn');
        if (targetBtn && targetBtn.dataset.productId) {
            event.preventDefault();
            const productId = targetBtn.dataset.productId;
            renderSingleProductDetails(productId);
        }
    });


    // Listener for the "Back to Collections" button
    backToCollectionsBtn.addEventListener('click', showCollections);


    // --- Initial Load ---

    async function initializeCatalog() {
        try {
            const response = await fetch('product.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allProducts = await response.json();
            organizedCategories = groupProductsByType(allProducts);
            renderCategoryCards();
        } catch (error) {
            console.error("Could not fetch product data:", error);
            collectionsSection.innerHTML = '<p style="text-align: center; color: red;">Failed to load product data. Please try again later.</p>';
        }
    }

    initializeCatalog();
});
