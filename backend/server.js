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

// Note-related endpoints

// GET all notes for a book
app.get('/books/:id/notes', (req, res) => {
    const books = readBooks();
    const { id } = req.params;
    const book = books.find(book => book.id === id);

    if (book) {
        res.json(book.notes || []);
    } else {
        res.status(404).send('Book not found');
    }
});

// POST a new note to a book
app.post('/books/:id/notes', (req, res) => {
    const books = readBooks();
    const { id } = req.params;
    const index = books.findIndex(book => book.id === id);

    if (index !== -1) {
        const newNote = {
            noteId: Date.now().toString(),
            author: req.body.author,
            content: req.body.content,
            createdAt: new Date().toISOString()
        };

        if (!books[index].notes) {
            books[index].notes = [];
        }
        books[index].notes.push(newNote);
        writeBooks(books);
        res.status(201).json(newNote);
    } else {
        res.status(404).send('Book not found');
    }
});

// PUT (update) a note
app.put('/books/:id/notes/:noteId', (req, res) => {
    const books = readBooks();
    const { id, noteId } = req.params;
    const bookIndex = books.findIndex(book => book.id === id);

    if (bookIndex !== -1 && books[bookIndex].notes) {
        const noteIndex = books[bookIndex].notes.findIndex(note => note.noteId === noteId);

        if (noteIndex !== -1) {
            books[bookIndex].notes[noteIndex] = {
                ...books[bookIndex].notes[noteIndex],
                ...req.body,
                updatedAt: new Date().toISOString()
            };
            writeBooks(books);
            res.json(books[bookIndex].notes[noteIndex]);
        } else {
            res.status(404).send('Note not found');
        }
    } else {
        res.status(404).send('Book not found');
    }
});

// DELETE a note
app.delete('/books/:id/notes/:noteId', (req, res) => {
    const books = readBooks();
    const { id, noteId } = req.params;
    const bookIndex = books.findIndex(book => book.id === id);

    if (bookIndex !== -1 && books[bookIndex].notes) {
        const initialLength = books[bookIndex].notes.length;
        books[bookIndex].notes = books[bookIndex].notes.filter(note => note.noteId !== noteId);

        if (books[bookIndex].notes.length < initialLength) {
            writeBooks(books);
            res.status(204).send();
        } else {
            res.status(404).send('Note not found');
        }
    } else {
        res.status(404).send('Book not found');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}. Open http://<your-internal-ip>:${PORT} in your browser.`);
});
