// ---------- MOCK DATABASE ----------
let books = [];
let members = [];
let nextBookID = 1000;
let nextMemberID = 5000;

// ---------- LOGIN PAGE ----------
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        const username = document.getElementById('username');
        const password = document.getElementById('password');
        const errorDiv = document.getElementById('login-error');

        loginBtn.addEventListener('click', () => {
            if (username.value.trim() === "" || password.value.trim() === "") {
                errorDiv.textContent = "Please enter username and password.";
            } else {
                window.location.href = "dashboard.html";
            }
        });
    }

    let books = []; // Array of book objects
    let members = []; // Array of member objects



    // ---------- DASHBOARD PAGE ----------
    const addBookBtn = document.getElementById('add-book-btn');
    const addMemberBtn = document.getElementById('add-member-btn');
    const searchBookBtn = document.getElementById('search-book-btn');
    const searchMemberBtn = document.getElementById('search-member-btn');
    const issueBookBtn = document.getElementById('issue-book-btn');
    const returnBookBtn = document.getElementById('return-book-btn');
    const viewBooksBtn = document.getElementById('view-books-btn');
    const viewMembersBtn = document.getElementById('view-members-btn');
    const recommendations = document.getElementById("recommendations");
    const recBooks = ["Pride & Prejudice", "1984", "To Kill a Mockingbird"];
    recBooks.forEach(book => {
    const li = document.createElement("li");
    li.textContent = book;
    recommendations.appendChild(li);
});


    if (addBookBtn) addBookBtn.addEventListener('click', () => window.location.href = "addbook.html");
    if (addMemberBtn) addMemberBtn.addEventListener('click', () => window.location.href = "addmember.html");
    if (searchBookBtn) searchBookBtn.addEventListener('click', () => window.location.href = "searchbook.html");
    if (searchMemberBtn) searchMemberBtn.addEventListener('click', () => window.location.href = "searchmember.html");
    if (issueBookBtn) issueBookBtn.addEventListener('click', () => window.location.href = "issuebook.html");
    if (returnBookBtn) returnBookBtn.addEventListener('click', () => window.location.href = "returnbook.html");
    if (viewBooksBtn) viewBooksBtn.addEventListener('click', () => window.location.href = "viewbooks.html");
    if (viewMembersBtn) viewMembersBtn.addEventListener('click', () => window.location.href = "viewmembers.html");

    // ---------- ADD BOOK PAGE ----------
    const addBookSubmit = document.getElementById('add-book-submit');
    if (addBookSubmit) {
        const msgDiv = document.getElementById('addbook-message');
        addBookSubmit.addEventListener('click', () => {
            const title = document.getElementById('book-title').value.trim();
            const author = document.getElementById('book-author').value.trim();
            const isbn = document.getElementById('book-isbn').value.trim();

            if (!title || !author || !isbn) {
                msgDiv.style.color = "red";
                msgDiv.textContent = "Please fill in all fields!";
                return;
            }

            const book = { id: nextBookID++, title, author, isbn };
            books.push(book);

            msgDiv.style.color = "green";
            msgDiv.textContent = `Book "${title}" added successfully!`;

            document.getElementById('book-title').value = "";
            document.getElementById('book-author').value = "";
            document.getElementById('book-isbn').value = "";
        });
    }



    // ---------- ADD MEMBER PAGE ----------
    const addMemberSubmit = document.getElementById('add-member-submit');
    if (addMemberSubmit) {
        const msgDiv = document.getElementById('addmember-message');
        addMemberSubmit.addEventListener('click', () => {
            const name = document.getElementById('member-name').value.trim();
            const address = document.getElementById('member-address').value.trim();

            if (!name || !address) {
                msgDiv.style.color = "red";
                msgDiv.textContent = "Please fill in all fields!";
                return;
            }

            const member = { id: nextMemberID++, name, address };
            members.push(member);

            msgDiv.style.color = "green";
            msgDiv.textContent = `Member "${name}" added successfully!`;

            document.getElementById('member-name').value = "";
            document.getElementById('member-address').value = "";
        });
    }

    // ---------- VIEW BOOKS PAGE ----------
    const booksTable = document.getElementById('books-table');
    if (booksTable) {
        const tbody = booksTable.querySelector('tbody');
        tbody.innerHTML = "";
        books.forEach(book => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${book.id}</td><td>${book.title}</td><td>${book.author}</td><td>${book.isbn}</td>`;
            tbody.appendChild(tr);
        });
    }

    // ---------- VIEW MEMBERS PAGE ----------
    const membersTable = document.getElementById('members-table');
    if (membersTable) {
        const tbody = membersTable.querySelector('tbody');
        tbody.innerHTML = "";
        members.forEach(member => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${member.id}</td><td>${member.name}</td><td>${member.address}</td>`;
            tbody.appendChild(tr);
        });
    }
});
