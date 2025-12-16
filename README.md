# BookChive (Library Management System)
# 📚 Library Management System

<div align="center">

![C++](https://img.shields.io/badge/C++-17-00599C?style=for-the-badge&logo=cplusplus)
![Electron](https://img.shields.io/badge/Electron-1.0.0-47848F?style=for-the-badge&logo=electron)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)

**A modern, full-stack library management application built with C++ backend and Electron frontend**

[Features](#-features) • [Architecture](#-architecture) • [Installation](#-installation) • [Usage](#-usage) • [Screenshots](#-screenshots)

</div>

---

## ✨ Features

### 🎨 **Modern User Interface**
- **Visual Dashboard** with real-time statistics and book recommendations
- **Book Cover Integration** with Google Books API for automatic cover fetching
- **Status Badges** with color-coded availability indicators (green/red)
- **Hover Effects** and smooth animations throughout the application
- **Responsive Design** with gradient backgrounds and modern styling

### 📖 **Book Management**
- ✅ Add books with title, author, ISBN, genre, and cover image
- ✅ Auto-fetch book covers using ISBN from Google Books API
- ✅ Live preview of book covers before adding
- ✅ Search books by title, author, or ISBN (case-insensitive)
- ✅ View all books with cover gallery
- ✅ Delete books with confirmation
- ✅ Track borrowing status and issued member

### 👥 **Member Management**
- ✅ Add members with name and address
- ✅ Search members by name or ID (fuzzy matching)
- ✅ View all members with borrowed book information
- ✅ Delete members with automatic book return (cascade delete)
- ✅ Track borrowing history per member

### 🔄 **Transaction Management**
- ✅ Issue books using **book title or ID** and **member name or ID**
- ✅ Return books with intelligent name/ID resolution
- ✅ Quick actions widget on dashboard for rapid issue/return
- ✅ Real-time validation (prevent double-borrowing)
- ✅ Confirmation dialogs for all transactions

### 🔐 **Authentication System**
- ✅ User registration with password validation
- ✅ Secure login system with session management
- ✅ Password hashing (upgradeable to bcrypt)
- ✅ Username display badge with logout functionality
- ✅ Session persistence across pages

### 🔍 **Intelligent Search**
- ✅ **Exact match → Partial match** fallback strategy
- ✅ Case-insensitive fuzzy matching
- ✅ Search by ID, title, author, ISBN, or member name
- ✅ Real-time search suggestions with debouncing
- ✅ Highlighted search results

### 💾 **Data Persistence**
- ✅ SQLite database with ACID compliance
- ✅ Auto-increment IDs for books and members
- ✅ Consistent database location (build/bin/lms.db)
- ✅ Cascade delete (returning books when member is deleted)
- ✅ Transaction atomicity for issue/return operations

---

## 🏗️ Architecture

### **5-Layer Architecture Design**

```
┌─────────────────────────────────────────────────────┐
│            PRESENTATION LAYER                        │
│  (Electron Frontend - HTML/CSS/JavaScript)           │
│  • renderer.js (1500+ lines)                         │
│  • User interface and interactions                   │
└─────────────────────────────────────────────────────┘
                       ↕ IPC (contextBridge)
┌─────────────────────────────────────────────────────┐
│        IPC COMMUNICATION LAYER                       │
│  • preload.js (sandboxed API exposure)               │
│  • main.js (ipcMain handlers)                        │
│  • backend-client.js (child process manager)         │
└─────────────────────────────────────────────────────┘
                       ↕ JSON-RPC over stdio
┌─────────────────────────────────────────────────────┐
│          APPLICATION LAYER                           │
│  (C++ Backend - cli.cpp)                             │
│  • JSON-RPC request routing                          │
│  • Parameter validation                              │
│  • 26+ API methods                                   │
└─────────────────────────────────────────────────────┘
                       ↕ Function calls
┌─────────────────────────────────────────────────────┐
│          BUSINESS LOGIC LAYER                        │
│  (C++ - library.cpp)                                 │
│  • In-memory collections (books, members)            │
│  • Transaction management                            │
│  • Search algorithms                                 │
└─────────────────────────────────────────────────────┘
                       ↕ SQL operations
┌─────────────────────────────────────────────────────┐
│          DATA ACCESS LAYER                           │
│  (C++ - database.cpp + SQLite3)                      │
│  • CRUD operations with prepared statements          │
│  • Connection management                             │
│  • Schema initialization                             │
└─────────────────────────────────────────────────────┘
```

### **Technology Stack**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Electron 1.0.0, HTML5, CSS3, JavaScript | User interface and interactions |
| **IPC Bridge** | contextBridge, ipcMain/ipcRenderer | Secure communication between processes |
| **Backend** | C++17, MinGW GCC 14.2.0 | Business logic and data processing |
| **Database** | SQLite3 (amalgamation) | Persistent data storage |
| **Build System** | CMake 3.10+ | Cross-platform compilation |
| **External API** | Google Books API | Automatic book cover fetching |

---

## 🚀 Installation

### **Prerequisites**

- **C++ Compiler**: MinGW GCC 14.2.0 or MSVC
- **CMake**: Version 3.10 or higher
- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js

### **Step 1: Clone the Repository**

```bash
git clone https://github.com/yourusername/LibraryManagementSystem.git
cd LibraryManagementSystem
```

### **Step 2: Build the C++ Backend**

```bash
# Create build directory
mkdir build
cd build

# Generate build files with CMake
cmake ..

# Compile the backend
cmake --build .
```

The executable will be created at `build/bin/sem_project_focp.exe`

### **Step 3: Install Frontend Dependencies**

```bash
cd lmsElectron
npm install
```

### **Step 4: Run the Application**

```bash
npm start
```

---

## 📖 Usage

### **First Time Setup**

1. **Create Account**: Click "Don't have an account? Create new" on the login page
2. **Enter Credentials**: Choose a username and password (min 4 characters)
3. **Login**: Use your credentials to access the dashboard

### **Adding Books**

1. Navigate to **Add Book** from the dashboard
2. Fill in book details (Title, Author, ISBN, Genre)
3. Click **Auto-fetch Cover from ISBN** to get the cover image
4. Preview the cover and click **Add Book**

### **Managing Members**

1. Go to **Add Member** to register new library members
2. Enter name and address
3. View all members from **View Members** page

### **Issuing Books**

1. Use **Issue Book** page or Quick Actions on dashboard
2. Enter **book title or ID** and **member name or ID**
3. System will intelligently resolve names to entities
4. Confirm the transaction

### **Returning Books**

1. Navigate to **Return Book** or use Quick Actions
2. Enter book and member information
3. System validates and processes return
4. Book status updated automatically

### **Searching**

- **Search Books**: Find by title, author, or ISBN with fuzzy matching
- **Search Members**: Find by name with case-insensitive search
- View detailed information and cover images in results

---

## 🎯 Key Highlights

### **Google Books API Integration**
Automatically fetches book covers using ISBN lookup from Google's extensive database. Provides live preview before adding books.

### **Intelligent Name Resolution**
Users can issue/return books using natural language:
- "Harry Potter" instead of book ID
- "John Doe" instead of member ID
- Exact match → partial match fallback
- Case-insensitive fuzzy search

### **Cascade Delete Protection**
When a member is deleted, all their borrowed books are automatically returned to prevent orphaned records.

### **Real-time Dashboard**
Visual gallery of recent books with:
- Cover images
- Availability status badges
- Hover effects with shadows
- Live statistics (total books, members, borrowed count)

### **Comprehensive Error Handling**
- ✅ **Backend**: Return value checking, null pointer guards, SQLITE error codes
- ✅ **Frontend**: Try-catch blocks, promise rejection, graceful degradation
- ✅ **Validation**: Parameter validation, business rule enforcement
- ✅ **User Feedback**: Descriptive error messages in toasts and dialogs

---

## 📂 Project Structure

```
sem_project_focp/
├── 📁 build/                  # Build artifacts
│   ├── bin/
│   │   ├── sem_project_focp.exe  # C++ backend executable
│   │   └── lms.db               # SQLite database
│   └── ...
├── 📁 external/               # External dependencies
│   └── sqlite/
│       ├── sqlite3.c          # SQLite amalgamation
│       └── sqlite3.h
├── 📁 lmsElectron/            # Electron frontend
│   ├── index.html             # Login page
│   ├── signup.html            # Registration page
│   ├── dashboard.html         # Main dashboard
│   ├── addbook.html           # Add book form
│   ├── viewbooks.html         # Book gallery
│   ├── issuebook.html         # Issue transaction
│   ├── returnbook.html        # Return transaction
│   ├── renderer.js            # Frontend logic (1500+ lines)
│   ├── main.js                # Electron main process
│   ├── preload.js             # Context bridge API
│   ├── backend-client.js      # C++ process manager
│   ├── style.css              # Modern styling
│   └── package.json
├── book.h / book.cpp          # Book entity
├── member.h / member.cpp      # Member entity
├── library.h / library.cpp    # Business logic layer
├── database.h / database.cpp  # Data access layer
├── cli.cpp                    # JSON-RPC API handler
├── CMakeLists.txt             # Build configuration
└── README.md                  # This file
```

---

## 🎨 Screenshots

### **Login & Authentication**
Modern login interface with session management and user registration.

### **Dashboard**
Visual dashboard with statistics, book recommendations, and quick actions widget.

### **Book Gallery**
Beautiful grid layout with book covers, status badges, and hover effects.

### **Transaction Flow**
Intelligent issue/return forms accepting both IDs and natural language names.

---

## 🛠️ Development

### **Building from Source**

```bash
# Backend build
cd build
cmake --build . --config Release

# Frontend development
cd lmsElectron
npm run dev
```

### **Running Tests**

```bash
# Add test data
# Use the UI to add sample books and members

# Test transactions
# Issue and return books using the interface
```

### **Database Management**

```bash
# Database location
build/bin/lms.db

# Clean database (reset all data)
Remove-Item build/bin/lms.db

# Database schema includes:
# - books (id, title, author, ISBN, genre, cover_url, borrowStatus, issuedTo)
# - members (id, name, address, BorrowedBookID)
# - users (id, username, passwordHash)
```

---

## 🎓 Design Patterns Used

- **MVC (Model-View-Controller)**: Separation of data, logic, and presentation
- **Repository Pattern**: Database abstraction in data access layer
- **Facade Pattern**: library class simplifies complex operations
- **Observer Pattern**: IPC event-driven communication
- **Singleton Pattern**: Global library instance in backend
- **Factory Pattern**: Object creation in database layer
- **Strategy Pattern**: Search algorithms with fallback strategies

---

## 🔒 Security Features

- ✅ Password hashing for user accounts
- ✅ Session-based authentication
- ✅ Sandboxed preload script with contextBridge
- ✅ No nodeIntegration in renderer process
- ✅ Input validation on both frontend and backend
- ✅ SQL injection prevention with prepared statements
- ✅ Error messages don't expose sensitive information

---

## 📊 Database Schema

### **Books Table**
```sql
CREATE TABLE books (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    ISBN TEXT NOT NULL,
    genre TEXT NOT NULL,
    cover_url TEXT,
    borrowStatus INTEGER NOT NULL DEFAULT 0,
    issuedTo INTEGER NOT NULL DEFAULT 0
);
```

### **Members Table**
```sql
CREATE TABLE members (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    BorrowedBookID INTEGER NOT NULL
);
```

### **Users Table**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL
);
```

---

## 🌟 Future Enhancements

- [ ] Bcrypt password hashing
- [ ] Multi-book borrowing per member
- [ ] Due date tracking and overdue notifications
- [ ] Book reservation system
- [ ] Generate borrowing reports (PDF/CSV)
- [ ] Email notifications for due books
- [ ] Book categories and filters
- [ ] Member profile pictures
- [ ] Dark mode theme
- [ ] Export/Import database functionality

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@manahelhehe](https://github.com/manahelhehe)
- Project: Library Management System (Fundamentals of Computer Programming Semester Project)

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **SQLite** for the embedded database engine
- **Electron** for cross-platform desktop framework
- **Google Books API** for book cover images
- **CMake** for build system management
- **VS Code** for development environment

---

<div align="center">

**Built with ❤️ using C++17 and Electron**

⭐ Star this repository if you find it helpful!

</div>
