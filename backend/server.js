const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'bookworklist.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Helper function to read books
const readBooks = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading bookworklist.json:', error);
        return [];
    }
};

// Helper function to write books
const writeBooks = (books) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(books, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing to bookworklist.json:', error);
    }
};

// GET all books
app.get('/books', (req, res) => {
    const books = readBooks();
    res.json(books);
});

// POST a new book
app.post('/books', (req, res) => {
    console.log('POST /books received');
    console.log('Request body:', req.body);
    const books = readBooks();
    const newBook = { id: Date.now().toString(), ...req.body }; // Simple ID generation
    books.push(newBook);
    writeBooks(books);
    res.status(201).json(newBook);
});

// PUT (update) a book
app.put('/books/:id', (req, res) => {
    const books = readBooks();
    const { id } = req.params;
    const updatedBookData = req.body;
    const index = books.findIndex(book => book.id === id);

    if (index !== -1) {
        books[index] = { ...books[index], ...updatedBookData };
        writeBooks(books);
        res.json(books[index]);
    } else {
        res.status(404).send('Book not found');
    }
});

// DELETE a book
app.delete('/books/:id', (req, res) => {
    let books = readBooks();
    const { id } = req.params;
    const initialLength = books.length;
    books = books.filter(book => book.id !== id);

    if (books.length < initialLength) {
        writeBooks(books);
        res.status(204).send(); // No content
    } else {
        res.status(404).send('Book not found');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}. Open http://<your-internal-ip>:${PORT} in your browser.`);
});
