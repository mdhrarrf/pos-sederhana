let products = [];
let cart = [];

// Format Rupiah
const formatRp = (angka) => new Intl.NumberFormat('id-ID').format(angka);

// Tab Navigation
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');

    if (tabId === 'tab-produk') loadProducts();
    if (tabId === 'tab-kasir') loadKasir();
    if (tabId === 'tab-riwayat') loadRiwayat();
}

// Fetch Produk
async function fetchProducts() {
    const res = await fetch('/api/products');
    products = await res.json();
}

// ================= TAB PRODUK =================
async function loadProducts() {
    await fetchProducts();
    const tbody = document.getElementById('tableProdukBody');
    tbody.innerHTML = '';
    products.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td>${p.name}</td>
                <td>Rp ${formatRp(p.price)}</td>
                <td>${p.stock}</td>
                <td>
                    <button class="btn btn-primary" onclick="editProduct('${p.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="hapusProduct('${p.id}')">Hapus</button>
                </td>
            </tr>
        `;
    });
}

document.getElementById('formProduk').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prodId').value;
    const name = document.getElementById('prodName').value;
    const price = document.getElementById('prodPrice').value;
    const stock = document.getElementById('prodStock').value;

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/products/${id}` : '/api/products';

    await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, stock })
    });

    document.getElementById('formProduk').reset();
    document.getElementById('prodId').value = '';
    document.getElementById('btnSimpanProduk').textContent = 'Tambah Produk';
    loadProducts();
});

function editProduct(id) {
    const p = products.find(x => x.id === id);
    if (p) {
        document.getElementById('prodId').value = p.id;
        document.getElementById('prodName').value = p.name;
        document.getElementById('prodPrice').value = p.price;
        document.getElementById('prodStock').value = p.stock;
        document.getElementById('btnSimpanProduk').textContent = 'Update Produk';
    }
}

async function hapusProduct(id) {
    if (confirm('Yakin ingin menghapus produk ini?')) {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        loadProducts();
    }
}

// ================= TAB KASIR =================
async function loadKasir() {
    await fetchProducts();
    const grid = document.getElementById('posProductList');
    grid.innerHTML = '';
    products.forEach(p => {
        if (p.stock > 0) {
            grid.innerHTML += `
                <div class="product-card" onclick="addToCart('${p.id}')">
                    <h4>${p.name}</h4>
                    <p>Rp ${formatRp(p.price)}</p>
                    <small>Stok: ${p.stock}</small>
                </div>
            `;
        }
    });
    renderCart();
}

function addToCart(id) {
    const p = products.find(x => x.id === id);
    const existing = cart.find(x => x.productId === id);

    if (existing) {
        if (existing.qty < p.stock) existing.qty++;
        else alert('Stok tidak cukup!');
    } else {
        cart.push({ productId: p.id, name: p.name, price: p.price, qty: 1, maxStock: p.stock });
    }
    renderCart();
}

function changeQty(id, delta) {
    const item = cart.find(x => x.productId === id);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(x => x.productId !== id);
        } else if (item.qty > item.maxStock) {
            item.qty = item.maxStock;
            alert('Stok tidak cukup!');
        }
    }
    renderCart();
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const subtotal = item.price * item.qty;
        total += subtotal;
        cartItems.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <strong>${item.name}</strong><br>
                    Rp ${formatRp(item.price)}
                </div>
                <div>
                    <button class="qty-btn" onclick="changeQty('${item.productId}', -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="changeQty('${item.productId}', 1)">+</button>
                </div>
            </div>
        `;
    });
    document.getElementById('cartTotal').textContent = formatRp(total);
}

async function prosesTransaksi() {
    if (cart.length === 0) return alert('Keranjang kosong!');

    const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart })
    });

    if (res.ok) {
        alert('Transaksi Berhasil Disimpan!');
        cart = [];
        loadKasir();
    }
}

// ================= TAB RIWAYAT =================
async function loadRiwayat() {
    const res = await fetch('/api/transactions');
    const transactions = await res.json();
    const tbody = document.getElementById('tableRiwayatBody');
    tbody.innerHTML = '';

    // Reverse agar yang terbaru di atas
    transactions.reverse().forEach(t => {
        const d = new Date(t.date).toLocaleString('id-ID');
        const qtyS = t.items.map(i => `${i.qty} item`).join(', ');

        tbody.innerHTML += `
            <tr>
                <td>${t.id}</td>
                <td>${d}</td>
                <td>${t.items.length} macam produk (${qtyS})</td>
                <td>Rp ${formatRp(t.total)}</td>
            </tr>
        `;
    });
}

// Inisialisasi awal
loadKasir();
