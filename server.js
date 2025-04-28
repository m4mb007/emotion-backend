
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const path = require('path'); // Pastikan sudah import di atas
const Emosi = require('./models/Emosi');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const emosiList = [];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoose = require('mongoose');

// Sambung ke database
mongoose.connect('mongodb+srv://m4mb007:eONQ4MTQqpcj0gfp@cluster0.q2yozvi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster',
{
    dbName: 'emosiapp', // Ini penting! Supaya sambung ke database kita
})
.then(() => console.log('MongoDB Connected'))
.catch((err) => console.error('MongoDB connection error:', err));

const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: "No token, authorization denied" });

    try {
        const decoded = jwt.verify(token, 'secret_key');
        req.user = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ message: "Token is not valid" });
    }
};



// Register user baru
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10); // Hash password

    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
});

// Login user
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password!" });

    const token = jwt.sign({ userId: user._id }, 'secret_key', { expiresIn: '1h' });
    res.json({ message: "Login successful", token });
});




// Serve frontend folder
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

// Redirect root '/' ke frontend/index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/tips-emosi',(req, res) => {
    res.json({
        tips: [
            "Tarik nafas ke dalam",
            "Tarik nafas ke luar",
            "Ulangi sampai 3 kali"  
        ]
    })
});

app.post('/hantar-emosi',auth, async (req, res) => {
    const { emosiHariIni } = req.body;

    if (!emosiHariIni) {
        return res.status(400).json({ message: "Sila isi emosi hari ini." });
    }

    try {
        const emosiBaru = new Emosi({ emosiHariIni });
        await emosiBaru.save();
        res.json({ message: `Terima kasih! Emosi anda telah disimpan.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


app.get('/senarai-emosi', async (req, res) => {
    try {
        const semuaEmosi = await Emosi.find();
        res.json({ semuaEmosi });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

app.delete('/hapus-emosi/:id', async (req, res) => {
    const { id } = req.params; // Ambil ID emosi dari URL

    try {
        const emosi = await Emosi.findByIdAndDelete(id); // Cari dan delete emosi berdasarkan ID
        if (!emosi) {
            return res.status(404).json({ message: "Emosi tidak dijumpai!" });
        }
        res.json({ message: "Emosi berjaya dipadam." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

app.put('/edit-emosi/:id',auth, async (req, res) => {
    const { id } = req.params;
    const { emosiHariIni } = req.body;

    try {
        const emosi = await Emosi.findByIdAndUpdate(id, { emosiHariIni }, { new: true });
        if (!emosi) {
            return res.status(404).json({ message: "Emosi tidak dijumpai!" });
        }
        res.json({ message: "Emosi berjaya dikemaskini.", emosi });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
