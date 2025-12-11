// ---------- GLOBAL MOCK DATABASE ----------
let books = [
    { id: 1000, title: "Book 1", author: "Author 1", isbn: "123", issuedTo: 5000 },
    { id: 1001, title: "Book 2", author: "Author 2", isbn: "456", issuedTo: 5001 },
    { id: 1002, title: "Book 3", author: "Author 3", isbn: "789", issuedTo: null }
];

let members = [
    { id: 5000, name: "Alice", address: "123 Main St", borrowedBooks: [1000] },
    { id: 5001, name: "Bob", address: "456 Oak Rd", borrowedBooks: [1001] }
];

let nextBookID = 1003;
let nextMemberID = 5002;

// ---------- UTILITY FUNCTIONS ----------
function getMemberName(memberID) {
    const member = members.find(m => m.id === memberID);
    return member ? member.name : 'Unknown';
}

// ---------- PAGE INITIALIZERS ----------
document.addEventListener('DOMContentLoaded', () => {
    initLoginPage();
    initDashboard();
    initAddBookPage();
    initAddMemberPage();
    initViewBooksPage();
    initViewMembersPage();
    initSearchBookPage();
    initSearchMemberPage();
    initIssueBookPage();
    initReturnBookPage();
    initBorrowedBooksPage();
    initBackButtons();
});

// ---------- LOGIN PAGE ----------
function initLoginPage() {
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;

    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const errorDiv = document.getElementById('login-error');

    loginBtn.addEventListener('click', () => {
        if (!username.value.trim() || !password.value.trim()) {
            if (errorDiv) errorDiv.textContent = "Please enter username and password.";
        } else {
            window.location.href = "dashboard.html";
        }
    });
}

// ---------- DASHBOARD ----------
function initDashboard() {
    const recList = document.getElementById("recommendations");
    if (recList) {
        const recBooks = ["Pride & Prejudice", "1984", "To Kill a Mockingbird"];
        recBooks.forEach(book => {
            const li = document.createElement("li");
            li.textContent = book;
            recList.appendChild(li);
        });
    }

    const dashboardButtons = [
        { id: 'add-book-btn', href: 'addbook.html' },
        { id: 'add-member-btn', href: 'addmember.html' },
        { id: 'search-book-btn', href: 'searchbook.html' },
        { id: 'search-member-btn', href: 'searchmember.html' },
        { id: 'issue-book-btn', href: 'issuebook.html' },
        { id: 'return-book-btn', href: 'returnbook.html' },
        { id: 'view-books-btn', href: 'viewbooks.html' },
        { id: 'view-members-btn', href: 'viewmembers.html' },
        { id: 'borrowed-books-btn', href: 'borrowedbooks.html' }
    ];

    dashboardButtons.forEach(btn => {
        const element = document.getElementById(btn.id);
        if (element) element.addEventListener('click', () => window.location.href = btn.href);
    });
}

// ---------- BACK BUTTONS ----------
function initBackButtons() {
    const backButtons = document.querySelectorAll(".backBtn");
    backButtons.forEach(btn => btn.addEventListener("click", () => window.history.back()));
}

// ---------- ADD BOOK PAGE ----------
function initAddBookPage() {
    const addBookSubmit = document.getElementById('add-book-submit');
    if (!addBookSubmit) return;

    const msgDiv = document.getElementById('addbook-message');

    addBookSubmit.addEventListener('click', () => {
        const title = document.getElementById('book-title').value.trim();
        const author = document.getElementById('book-author').value.trim();
        const isbn = document.getElementById('book-isbn').value.trim();

        if (!title || !author || !isbn) {
            if (msgDiv) { msgDiv.style.color = "red"; msgDiv.textContent = "Please fill in all fields!"; }
            return;
        }

        const book = { id: nextBookID++, title, author, isbn, issuedTo: null };
        books.push(book);

        if (msgDiv) { msgDiv.style.color = "green"; msgDiv.textContent = `Book "${title}" added successfully!`; }

        document.getElementById('book-title').value = "";
        document.getElementById('book-author').value = "";
        document.getElementById('book-isbn').value = "";
    });
}

// ---------- ADD MEMBER PAGE ----------
function initAddMemberPage() {
    const addMemberSubmit = document.getElementById('add-member-submit');
    if (!addMemberSubmit) return;

    const msgDiv = document.getElementById('addmember-message');

    addMemberSubmit.addEventListener('click', () => {
        const name = document.getElementById('member-name').value.trim();
        const address = document.getElementById('member-address').value.trim();

        if (!name || !address) {
            if (msgDiv) { msgDiv.style.color = "red"; msgDiv.textContent = "Please fill in all fields!"; }
            return;
        }

        const member = { id: nextMemberID++, name, address, borrowedBooks: [] };
        members.push(member);

        if (msgDiv) { msgDiv.style.color = "green"; msgDiv.textContent = `Member "${name}" added successfully!`; }

        document.getElementById('member-name').value = "";
        document.getElementById('member-address').value = "";
    });
}

// ---------- VIEW BOOKS PAGE ----------
function initViewBooksPage() {
    const booksTable = document.getElementById('books-table');
    if (!booksTable) return;

    const tbody = booksTable.querySelector('tbody');
    tbody.innerHTML = "";

    books.forEach(book => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${book.id}</td><td>${book.title}</td><td>${book.author}</td><td>${book.isbn}</td>`;
        tbody.appendChild(tr);
    });
}

// ---------- VIEW MEMBERS PAGE ----------
function initViewMembersPage() {
    const membersTable = document.getElementById('members-table');
    if (!membersTable) return;

    const tbody = membersTable.querySelector('tbody');
    tbody.innerHTML = "";

    members.forEach(member => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${member.id}</td><td>${member.name}</td><td>${member.address}</td>`;
        tbody.appendChild(tr);
    });
}

// ---------- SEARCH BOOK PAGE ----------
function initSearchBookPage() {
    const searchBookBtnPage = document.getElementById('search-book-btn-page');
    if (!searchBookBtnPage) return;

    const resultDiv = document.getElementById('search-book-result');

    searchBookBtnPage.addEventListener('click', () => {
        const query = document.getElementById('search-book-input').value.trim().toLowerCase();
        if (!query) return;

        if (resultDiv) resultDiv.innerHTML = "";
        const results = books.filter(b => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query) || b.isbn.includes(query));
        results.forEach(b => {
            const p = document.createElement('p');
            p.textContent = `ID: ${b.id}, Title: ${b.title}, Author: ${b.author}, ISBN: ${b.isbn}`;
            if (resultDiv) resultDiv.appendChild(p);
        });
    });
}

// ---------- SEARCH MEMBER PAGE ----------
function initSearchMemberPage() {
    const searchMemberBtnPage = document.getElementById('search-member-btn-page');
    if (!searchMemberBtnPage) return;

    const resultDiv = document.getElementById('search-member-result');

    searchMemberBtnPage.addEventListener('click', () => {
        const query = document.getElementById('search-member-input').value.trim().toLowerCase();
        if (!query) return;

        if (resultDiv) resultDiv.innerHTML = "";
        const results = members.filter(m => m.name.toLowerCase().includes(query) || m.address.toLowerCase().includes(query) || m.id.toString() === query);
        results.forEach(m => {
            const p = document.createElement('p');
            p.textContent = `ID: ${m.id}, Name: ${m.name}, Address: ${m.address}`;
            if (resultDiv) resultDiv.appendChild(p);
        });
    });
}

// ---------- ISSUE BOOK PAGE ----------
function initIssueBookPage() {
    const issueBookSubmit = document.getElementById('issue-book-submit');
    if (!issueBookSubmit) return;

    const msgDiv = document.getElementById('issuebook-message');

    issueBookSubmit.addEventListener('click', () => {
        const bookID = parseInt(document.getElementById('issue-book-id').value);
        const memberID = parseInt(document.getElementById('issue-member-id').value);
        const book = books.find(b => b.id === bookID);
        const member = members.find(m => m.id === memberID);

        if (!book || !member) {
            if (msgDiv) { msgDiv.style.color = "red"; msgDiv.textContent = "Invalid Book or Member ID."; }
            return;
        }

        if (book.issuedTo === null || book.issuedTo === undefined) {
            book.issuedTo = memberID;
            member.borrowedBooks.push(bookID);
            if (msgDiv) { msgDiv.style.color = "green"; msgDiv.textContent = `Book "${book.title}" issued to ${member.name}.`; }
        } else {
            if (msgDiv) { msgDiv.style.color = "red"; msgDiv.textContent = `Book "${book.title}" is already issued.`; }
        }
    });
}

// ---------- RETURN BOOK PAGE ----------
function initReturnBookPage() {
    const returnBookSubmit = document.getElementById('return-book-submit');
    if (!returnBookSubmit) return;

    const msgDiv = document.getElementById('returnbook-message');

    returnBookSubmit.addEventListener('click', () => {
        const bookID = parseInt(document.getElementById('return-book-id').value);
        const book = books.find(b => b.id === bookID);

        if (!book || !book.issuedTo) {
            if (msgDiv) { 
                msgDiv.style.color = "red"; 
                msgDiv.textContent = "Invalid Book ID or Book not issued."; 
            }
            return;
        }

        const member = members.find(m => m.id === book.issuedTo);
        if (member) {
            member.borrowedBooks = member.borrowedBooks.filter(id => id !== bookID);
        }

        book.issuedTo = null;

        if (msgDiv) { 
            msgDiv.style.color = "green"; 
            msgDiv.textContent = `Book "${book.title}" returned successfully.`; 
        }
    });
}

// ---------- BORROWED BOOKS PAGE ----------
function initBorrowedBooksPage() {
    const borrowedBooksTable = document.getElementById('borrowed-books-table');
    if (!borrowedBooksTable) return;

    const tbody = borrowedBooksTable.querySelector('tbody');
    tbody.innerHTML = "";

    books.forEach(book => {
        if (book.issuedTo) {
            const member = members.find(m => m.id === book.issuedTo);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${book.id}</td>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.isbn}</td>
                <td>${member ? member.name : 'Unknown'}</td>
            `;
            tbody.appendChild(tr);
        }
    });
}
