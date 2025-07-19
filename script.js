// script.js
let products = []
let selectedProduct = null

window.onload = async () => { const res = await fetch('product.json') products = await res.json()

const types = [...new Set(products.map(p => p.type))] const typeSelect = document.getElementById('type') typeSelect.innerHTML = types.map(t => <option value="${t}">${t}</option>).join('') typeSelect.onchange = loadColors loadColors() }

function loadColors() { const selectedType = document.getElementById('type').value const colors = products.filter(p => p.type === selectedType).map(p => p.color) const colorSelect = document.getElementById('color') colorSelect.innerHTML = colors.map(c => <option value="${c}">${c}</option>).join('') colorSelect.onchange = updatePreview updatePreview() }

function updatePreview() { const type = document.getElementById('type').value const color = document.getElementById('color').value selectedProduct = products.find(p => p.type === type && p.color === color)

if (!selectedProduct) return

const imgPath = Catlogue_icon/${type}-page-${selectedProduct.page}.jpg document.getElementById('product-img').src = imgPath document.getElementById('product-name').innerText = ${selectedProduct.color} – No. ${selectedProduct.number} document.getElementById('catalogue-info').innerText = 📄 Page ${selectedProduct.page} | File: ${selectedProduct.pdf}

renderSizeOptions() }

function renderSizeOptions() { const container = document.getElementById('size-selection') container.innerHTML = '' for (let [group, sizes] of Object.entries(selectedProduct.pricing)) { let html = <div class="size-group"> <h4>👤 ${group.toUpperCase()}</h4> for (let [size, price] of Object.entries(sizes)) { html += <div style="display: flex; justify-content: space-between; margin-bottom: 5px"> <label>${size} – ₹${price["Discount Price"]}</label> <input type="number" min="0" id="qty-${group}-${size}" style="width: 60px;" /> </div> } html += </div> container.innerHTML += html } }

function sendOrder() { const group = document.getElementById('groupName').value.trim() const addr = document.getElementById('address').value.trim() const phone = document.getElementById('phone').value.trim()

if (!group || !addr || !phone) return alert("Please fill all customer details.")

let totalQty = 0, totalAmt = 0 let msg = ✅ GROUP ORDER CONFIRMATION\n\n🧥 Product: ${selectedProduct.color} – No. ${selectedProduct.number}\n📄 Catalogue: Page ${selectedProduct.page} | File: ${selectedProduct.pdf}\n\n---\n

for (let [group, sizes] of Object.entries(selectedProduct.pricing)) { let block = '' for (let [size, price] of Object.entries(sizes)) { const qty = +document.getElementById(qty-${group}-${size}).value || 0 if (qty > 0) { const rate = price["Discount Price"] totalQty += qty totalAmt += qty * rate block += ${size} – Qty: ${qty} – ₹${rate} each\n } } if (block) msg += 👤 ${group.toUpperCase()} SIZES\n${block}\n }

msg += ---\n👥 Group Name: ${group}\n🏠 Delivery Address: ${addr}\n📞 Contact Number: ${phone}\n\n🗓️ Order Date: ${new Date().toLocaleDateString()}\n🧾 Total Pieces: ${totalQty}\n💰 Total Approx Amount: ₹${totalAmt}\n\n📦 Thanks for your group order!\nWe'll confirm availability and reach out shortly. 🙏

const url = https://wa.me/919722609460?text=${encodeURIComponent(msg)} window.open(url, '_blank') }

