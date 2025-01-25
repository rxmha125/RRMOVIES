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

// Middleware
app.use(express.static('public'));

// Serve uploads folder as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
client.connect()
    .then(() => {
        db = client.db('movieDB');
        console.log('Connected to MongoDB');

        // Start server after successful connection
        app.listen(process.env.PORT, () => {
            console.log(`Server running on http://localhost:${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1); // Exit process if connection fails
    });

// Routes
app.get('/', async (req, res) => {
    try {
        const movies = await db.collection('movies').find().toArray();
        res.render('index', { movies });
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to fetch movies');
    }
});

app.get('/upload', (req, res) => {
    res.render('upload');
});

app.post('/upload', upload.single('movie'), async (req, res) => {
    try {
        const { title, description } = req.body;
        const filePath = `/uploads/${req.file.filename}`;
        await db.collection('movies').insertOne({ title, description, filePath });
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to upload movie');
    }
});

app.get('/movie/:id', async (req, res) => {
    try {
        const movie = await db.collection('movies').findOne({ _id: new ObjectId(req.params.id) });
        if (!movie) return res.status(404).send('Movie not found');
        res.render('movie', { movie });
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to fetch movie');
    }
});
