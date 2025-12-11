// database.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Ensure data folder exists
const dataFolder = path.join(__dirname, 'data');
if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder, { recursive: true });
}

const dbPath = path.join(dataFolder, "library.db");

// Open DB
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("DB Error:", err);
    else console.log("Database loaded:", dbPath);
});

// Create tables
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS Books (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            isbn TEXT,
            borrowStatus INTEGER DEFAULT 0,
            issuedTo INTEGER DEFAULT NULL
        );
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS Members (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            borrowedBooks TEXT DEFAULT ''
        );
    `);
});

// Helpers
function parseBorrowedCSV(csv) {
    if (!csv || csv.trim() === '') return [];
    return csv.split('|').map(n => Number(n));
}
function makeBorrowedCSV(arr) {
    return arr.length ? arr.join('|') : '';
}

//
// --------------------- PROMISE WRAPPERS ---------------------
//

function addBook(id, title, author, isbn) {
    return new Promise((resolve, reject) => {
        const query = id
            ? `INSERT INTO Books (id, title, author, isbn) VALUES (?, ?, ?, ?)`
            : `INSERT INTO Books (title, author, isbn) VALUES (?, ?, ?)`;

        const params = id
            ? [Number(id), title, author, isbn]
            : [title, author, isbn];

        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this.lastID ?? id);
        });
    });
}

function addMember(id, name, address) {
    return new Promise((resolve, reject) => {
        const query = id
            ? `INSERT INTO Members (id, name, address, borrowedBooks) VALUES (?, ?, ?, '')`
            : `INSERT INTO Members (name, address, borrowedBooks) VALUES (?, ?, '')`;

        const params = id
            ? [Number(id), name, address]
            : [name, address];

        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this.lastID ?? id);
        });
    });
}

function getAllBooks() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM Books ORDER BY id`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function getAllMembers() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM Members ORDER BY id`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function issueBook(bookId, memberId) {
    return new Promise((resolve, reject) => {
        const bId = Number(bookId);
        const mId = Number(memberId);

        db.get(`SELECT * FROM Books WHERE id = ?`, [bId], (err, book) => {
            if (err) return reject(err);
            if (!book) return reject(new Error("Book not found"));
            if (book.borrowStatus === 1) return reject(new Error("Book already issued"));

            db.get(`SELECT * FROM Members WHERE id = ?`, [mId], (err, member) => {
                if (err) return reject(err);
                if (!member) return reject(new Error("Member not found"));

                db.run(`UPDATE Books SET borrowStatus = 1, issuedTo = ? WHERE id = ?`,
                    [mId, bId],
                    err => {
                        if (err) return reject(err);

                        let borrowed = parseBorrowedCSV(member.borrowedBooks);
                        if (!borrowed.includes(bId)) borrowed.push(bId);

                        db.run(`UPDATE Members SET borrowedBooks = ? WHERE id = ?`,
                            [makeBorrowedCSV(borrowed), mId],
                            err2 => {
                                if (err2) reject(err2);
                                else resolve({ ok: true });
                            }
                        );
                    }
                );
            });
        });
    });
}

function returnBook(bookId) {
    return new Promise((resolve, reject) => {
        const bId = Number(bookId);

        db.get(`SELECT * FROM Books WHERE id = ?`, [bId], (err, book) => {
            if (err) return reject(err);
            if (!book) return reject(new Error("Book not found"));
            if (book.borrowStatus === 0) return reject(new Error("Book is not issued"));

            const memberId = book.issuedTo;

            db.run(`UPDATE Books SET borrowStatus = 0, issuedTo = NULL WHERE id = ?`,
                [bId],
                err => {
                    if (err) return reject(err);

                    db.get(`SELECT * FROM Members WHERE id = ?`, [memberId], (err, member) => {
                        if (err) return reject(err);
                        if (!member) return resolve({ ok: true });

                        let borrowed = parseBorrowedCSV(member.borrowedBooks)
                            .filter(id => id !== bId);

                        db.run(`UPDATE Members SET borrowedBooks = ? WHERE id = ?`,
                            [makeBorrowedCSV(borrowed), memberId],
                            err2 => {
                                if (err2) reject(err2);
                                else resolve({ ok: true });
                            }
                        );
                    });
                });
        });
    });
}

function searchBook(query) {
    return new Promise((resolve, reject) => {
        const q = String(query).trim();
        const like = `%${q}%`;

        db.all(`
            SELECT * FROM Books
            WHERE id = ? OR title LIKE ? OR author LIKE ? OR isbn LIKE ?
            ORDER BY id`,
            [isNaN(q) ? -1 : Number(q), like, like, like],
            (err, rows) => err ? reject(err) : resolve(rows)
        );
    });
}

function searchMember(query) {
    return new Promise((resolve, reject) => {
        const q = String(query).trim();
        const like = `%${q}%`;

        db.all(`
            SELECT * FROM Members
            WHERE id = ? OR name LIKE ? OR address LIKE ?
            ORDER BY id`,
            [isNaN(q) ? -1 : Number(q), like, like],
            (err, rows) => err ? reject(err) : resolve(rows)
        );
    });
}

// Export
module.exports = {
    addBook,
    addMember,
    getAllBooks,
    getAllMembers,
    issueBook,
    returnBook,
    searchBook,
    searchMember
};
