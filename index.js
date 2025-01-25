require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
let db;

const upload = multer({ dest: 'uploads/' });

app.set('view engine', 'ejs');

// Connect to MongoDB
client.connect().then(() => {
    db = client.db('movieDB');
    console.log('Connected to MongoDB');
}).catch(err => console.error(err));

// Middleware
app.use(express.static('public'));

// Serve the uploads folder as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', async (req, res) => {
    const movies = await db.collection('movies').find().toArray();
    res.render('index', { movies });
});

app.get('/upload', (req, res) => {
    res.render('upload');
});

app.post('/upload', upload.single('movie'), async (req, res) => {
    const { title, description } = req.body;
    const filePath = `/uploads/${req.file.filename}`;
    await db.collection('movies').insertOne({ title, description, filePath });
    res.redirect('/');
});

app.get('/movie/:id', async (req, res) => {
    const movie = await db.collection('movies').findOne({ _id: new ObjectId(req.params.id) });
    if (!movie) return res.status(404).send('Movie not found');
    res.render('movie', { movie });
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
});