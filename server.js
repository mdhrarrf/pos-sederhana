const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Inisialisasi data.json jika belum ada
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ products: [], transactions: [] }, null, 2));
}

function readData() {
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 1. API Login Sederhana (Hardcode admin/admin)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin') {
        res.json({ success: true, message: 'Login berhasil' });
    } else {
        res.status(401).json({ success: false, message: 'Username atau password salah' });
    }
});

// 2. API Produk
app.get('/api/products', (req, res) => {
    const data = readData();
    res.json(data.products);
});

app.post('/api/products', (req, res) => {
    const data = readData();
    const newProduct = {
        id: Date.now().toString(),
        name: req.body.name,
        price: parseInt(req.body.price),
        stock: parseInt(req.body.stock)
    };
    data.products.push(newProduct);
    writeData(data);
    res.json({ success: true, product: newProduct });
});

app.put('/api/products/:id', (req, res) => {
    const data = readData();
    const index = data.products.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
        data.products[index].name = req.body.name;
        data.products[index].price = parseInt(req.body.price);
        data.products[index].stock = parseInt(req.body.stock);
        writeData(data);
        res.json({ success: true, product: data.products[index] });
    } else {
        res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }
});

app.delete('/api/products/:id', (req, res) => {
    const data = readData();
    data.products = data.products.filter(p => p.id !== req.params.id);
    writeData(data);
    res.json({ success: true, message: 'Produk berhasil dihapus' });
});

// 3. API Transaksi
app.get('/api/transactions', (req, res) => {
    const data = readData();
    res.json(data.transactions);
});

app.post('/api/transactions', (req, res) => {
    const data = readData();
    const items = req.body.items; // Array of { productId, qty, price }
    let total = 0;
    
    // Kurangi stok dan hitung total
    items.forEach(item => {
        const product = data.products.find(p => p.id === item.productId);
        if (product) {
            product.stock -= item.qty;
            total += (item.price * item.qty);
        }
    });

    const newTransaction = {
        id: 'TRX-' + Date.now(),
        date: new Date().toISOString(),
        items: items,
        total: total
    };
    
    data.transactions.push(newTransaction);
    writeData(data);
    res.json({ success: true, transaction: newTransaction });
});

app.listen(PORT, () => {
    console.log(`Server POS berjalan di http://localhost:${PORT}`);
});
