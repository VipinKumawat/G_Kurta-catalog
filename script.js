// Load products from JSON and display them
fetch('products.json')
  .then(response => response.json())
  .then(products => {
    const catalog = document.getElementById('catalog');

    products.forEach(product => {
      const productDiv = document.createElement('div');
      productDiv.className = 'product';

      // Create canvas for PDF preview
      const canvas = document.createElement('canvas');
      canvas.id = `canvas-${product.id}`;
      productDiv.appendChild(canvas);

      // Product Title
      const title = document.createElement('h3');
      title.textContent = `${product.number} - ${product.type} Kurta (${product.color})`;
      productDiv.appendChild(title);

      // Product Description
      const desc = document.createElement('p');
      desc.innerHTML = `👨‍🦱 Men | 👩 Ladies | 👶 Kids<br/>Sizes: 20–48`;
      productDiv.appendChild(desc);

      // WhatsApp Button
      const waButton = document.createElement('a');
      waButton.className = 'btn';
      waButton.href = `https://wa.me/918866244409?text=Hi!%20I%20want%20to%20place%20a%20group%20order%20for:%0A%0A🧥%20Product:%20${product.type}%20Kurta%20-%20${product.number}%20(${product.color})%0A%0A👨‍🦱%20MEN:%0A[Size%20–%20Qty]%0A%0A👩%20LADIES:%0A[Size%20–%20Qty]%0A%0A👶%20KIDS%20(Girls%20/%20Boys):%0A[Size%20–%20Qty]%0A%0A👥%20Group%20Name:%0A🏠%20Address:%0A📞%20Contact%20Number:`;
      waButton.target = '_blank';
      waButton.textContent = '🟢 Order Now on WhatsApp';
      productDiv.appendChild(waButton);

      catalog.appendChild(productDiv);

      // Load PDF and render the page as image
      const url = `pdf/${product.pdf}`;
      const loadingTask = pdfjsLib.getDocument(url);
      loadingTask.promise.then(pdf => {
        pdf.getPage(product.page).then(page => {
          const viewport = page.getViewport({ scale: 1.3 });
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          page.render(renderContext);
        });
      });
    });
  });