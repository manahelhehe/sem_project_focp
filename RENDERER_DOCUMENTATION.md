# Renderer.js Complete Documentation

## Overview
`renderer.js` is the main frontend logic file (~1122 lines) for the Library Management System Electron app. It handles all UI interactions, data fetching, caching, animations, and page-specific logic for 10+ HTML pages.

---

## Table of Contents
1. [Global State & Caching](#global-state--caching)
2. [Utility Functions](#utility-functions)
3. [UI Components](#ui-components)
4. [Page Initializers](#page-initializers)
5. [Data Flow Architecture](#data-flow-architecture)
6. [Event Handling](#event-handling)
7. [Performance Optimizations](#performance-optimizations)

---

## Global State & Caching

### State Variables
```javascript
let books = [];              // Local copy of books (mostly unused, prefer cache)
let members = [];            // Local copy of members (mostly unused, prefer cache)
let nextBookID = 1003;       // Legacy IDs (backend now uses SQLite auto-increment)
let nextMemberID = 5002;     // Legacy IDs (backend now uses SQLite auto-increment)
```

### Cache System
**Purpose**: Reduce backend calls, improve UI responsiveness

```javascript
let _bookCache = { ts: 0, data: [] };     // Books cache with timestamp
let _memberCache = { ts: 0, data: [] };   // Members cache with timestamp
const CACHE_TTL = 30 * 1000;              // 30 second cache lifetime
```

**Cache Functions**:
- `fetchBooksCached(force = false)` - Gets books from cache or backend
- `fetchMembersCached(force = false)` - Gets members from cache or backend

**How it works**:
1. Check if cache is fresh (< 30s old) and not forced refresh
2. If fresh: return cached data instantly
3. If stale: fetch from backend via `window.api.getAllBooks()` or `window.api.getAllMembers()`
4. Update cache with new data and timestamp
5. Uses `withLoader()` to show spinner only if request takes > 160ms

---

## Utility Functions

### 1. Debounce (`debounce(fn, wait = 250)`)
**Purpose**: Delay function execution until user stops typing

**Usage**:
```javascript
const debouncedSearch = debounce(searchFunction, 220);
input.addEventListener('input', (e) => debouncedSearch(e.target.value));
```

**Where used**:
- Quick Actions search (250ms delay)
- Search book page (220ms delay)
- Search member page (220ms delay)

---

### 2. Loader System

#### Core Functions:
- `showLoader()` - Display spinner overlay
- `hideLoader()` - Remove spinner overlay
- `withLoader(fn, delay = 160)` - Show spinner only if function takes > 160ms

**Implementation Details**:
```javascript
let _loaderCount = 0;  // Reference counter for nested loaders
let _loaderEl = null;  // DOM element
```

**Why 160ms delay?**
- Prevents flicker for fast operations
- Only shows for slow network/backend operations
- Improves perceived performance

**Loader HTML Structure**:
```html
<div class="loader-backdrop">  <!-- Semi-transparent overlay -->
    <div class="loader"></div>  <!-- Spinning circle -->
</div>
```

---

### 3. Toast Notifications

#### `showToast(message, isError = false)`
**Purpose**: Show temporary notifications at bottom-right

**Features**:
- Queue system (max 5 toasts)
- Auto-dismiss after 3 seconds
- Click to dismiss
- Error styling (red) vs success (green)
- Slide-in animation

**Example Usage**:
```javascript
showToast('Book added successfully!');
showToast('Failed to delete member', true);
```

---

### 4. Modal Dialogs

#### `showConfirmModal(title, message)`
**Purpose**: Replace native `confirm()` with custom styled modal

**Returns**: Promise<boolean>
- Resolves `true` if user clicks "Confirm"
- Resolves `false` if user clicks "Cancel" or presses Escape

**Usage**:
```javascript
const confirmed = await showConfirmModal('Delete Book', 'Are you sure?');
if (confirmed) {
    // Delete the book
}
```

#### `showInfoModal(title, htmlContent)`
**Purpose**: Display read-only information (e.g., member details)

**Usage**:
```javascript
const html = `<div><strong>Name:</strong> John</div>`;
await showInfoModal('Member Details', html);
```

---

## UI Components

### 1. Suggestions/Autocomplete (`renderSuggestions`)

**Purpose**: Show dropdown suggestions for Quick Actions search

**Parameters**:
- `container` - DOM element to render suggestions in
- `items` - Array of objects to display
- `renderText` - Function to extract display text from item

**Features**:
- Limits to 10 results
- Fade-in animation for each item
- Stores full object in `dataset.value` for click handling

**Example**:
```javascript
const filtered = books.filter(b => b.title.includes(query));
renderSuggestions(suggestionBox, filtered, (b) => `${b.title} - ${b.author}`);
```

---

## Page Initializers

### Page Detection & Routing
```javascript
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.id;
    
    if (page === 'login-page') initLoginPage();
    else if (page === 'dashboard-page') initDashboard();
    else if (page === 'addbook-page') initAddBookPage();
    // ... etc for all 10+ pages
    
    setupKeyboardShortcuts(); // Global shortcuts
});
```

---

### 1. Login Page (`initLoginPage()`)

**Elements**: Username/password inputs, login button

**Logic**:
- Simple validation (non-empty fields)
- Navigates to `dashboard.html` on success
- Fallback inline `onclick` handler for navigation reliability
- No actual authentication (demo app)

**Navigation Methods** (fallback chain):
1. `href` assignment
2. `window.location.assign()`
3. `window.open()`

---

### 2. Dashboard (`initDashboard()`)

**Components**:
1. **Statistics Display** (books count, members count, borrowed count)
2. **Quick Actions Panel** (collapsible search box)
3. **Recommendations Panel** (popular books)
4. **Recently Added Panel** (last 5 books)

#### Quick Actions
**Features**:
- Collapsible toggle button
- Debounced search (250ms)
- Searches both books and members
- Autocomplete suggestions
- Click suggestion to navigate to search result page

**Search Logic**:
```javascript
1. User types in input
2. Debounce waits 250ms
3. Fetch books & members from cache
4. Filter by title/author/name matching query (case-insensitive)
5. Render up to 10 suggestions
6. Click suggestion → navigate to viewbooks.html or viewmembers.html
```

#### Statistics Calculation
```javascript
const totalBooks = books.length;
const totalMembers = members.length;
const borrowedBooks = books.filter(b => b.borrowed).length;
```

#### Recommendations
- Gets books from backend via `window.api.getRecommendations()`
- Displays first 5 results
- Shows title, author, availability status

#### Recently Added
- Takes last 5 books from `fetchBooksCached()`
- Displays with title, author, ISBN
- Fade-in animation

---

### 3. Add Book Page (`initAddBookPage()`)

**Form Fields**: Title, ISBN, Author

**Validation**:
- All fields required
- No duplicate ISBN (checks cache)

**Flow**:
1. User fills form
2. Click "Add Book" button
3. Validate inputs
4. Call `window.api.addBook(title, isbn, author)`
5. Invalidate cache (force refresh on next fetch)
6. Show success toast
7. Clear form

**Error Handling**:
- Shows error toast if backend call fails
- Prevents duplicate ISBN entries

---

### 4. Add Member Page (`initAddMemberPage()`)

**Form Fields**: Name, Address

**Validation**: Name required

**Flow**: Similar to Add Book page

---

### 5. View Books Page (`initViewBooksPage()`)

**Features**:
1. **Sortable Table** (click column headers)
2. **Refresh Button** (force cache reload)
3. **Export CSV Button** (download books data)

#### Table Columns
- ID
- Title
- Author
- ISBN
- Status (Available / Borrowed by [Name])

#### Sorting
**Implementation**:
```javascript
let current = { key: null, dir: 'asc' };

headers.forEach((th, idx) => {
    th.addEventListener('click', () => {
        const key = keyMap[idx]; // ['id', 'title', 'author', 'isbn']
        
        // Toggle direction if same column, else reset to 'asc'
        if (current.key === key) {
            current.dir = current.dir === 'asc' ? 'desc' : 'asc';
        } else {
            current.key = key;
            current.dir = 'asc';
        }
        
        // Show indicator (▲ or ▼)
        updateSortIndicators();
        
        // Re-render table
        loadBooks(current.key, current.dir);
    });
});
```

#### CSV Export
**Button**: `#export-books-btn`

**Format**:
```csv
ID,Title,Author,ISBN,Status
1,"Book Title","Author Name","ISBN123","Available"
2,"Another Book","Author 2","ISBN456","Borrowed by John Doe"
```

**Implementation**:
1. Fetch books and members from cache
2. Build CSV string with header row
3. Escape double quotes in data (`"` → `""`)
4. Create Blob with `text/csv` MIME type
5. Create temporary `<a>` element with `download` attribute
6. Trigger click to download
7. Clean up (remove element, revoke object URL)

---

### 6. View Members Page (`initViewMembersPage()`)

**Features**:
1. **Sortable Table** (click column headers)
2. **Member Details Modal** (click "Details" button)
3. **Refresh Button**
4. **Export CSV Button**

#### Table Columns
- ID
- Name
- Address
- Borrowed Books (list of titles)
- Actions (Details button)

#### Borrowed Books Display
**Logic**:
```javascript
// Method 1: Check member's borrowedBookID field
const singleBorrowed = member.borrowedBookID || member.borrowedBookId;

// Method 2: Check member's borrowed/borrowedBooks array
const arr = member.borrowed || member.borrowedBooks;

// Method 3: Find books where issuedTo matches member ID or name
const fallback = books.filter(b => 
    b.borrowed && 
    (String(b.issuedTo) === String(member.id) || 
     String(b.issuedTo) === String(member.name))
);

// Combine all methods, remove duplicates
```

#### Member Details Modal
**Triggered by**: Click "Details" button in Actions column

**Shows**:
- Member name and ID
- Address
- List of borrowed books with ISBNs

**Implementation**:
```javascript
tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('.view-member-btn');
    if (!btn) return;
    
    const id = btn.dataset.id;
    const mem = members.find(m => String(m.id) === String(id));
    
    // Build HTML content
    const html = `
        <div><strong>${mem.name}</strong> (ID: ${mem.id})</div>
        <div>Address: ${mem.address}</div>
        <div>Borrowed Books: <ul>...</ul></div>
    `;
    
    await showInfoModal('Member Details', html);
});
```

---

### 7. Search Book Page (`initSearchBookPage()`)

**Features**:
- Live search (debounced 220ms)
- Partial match support
- Enter key triggers search
- Button click triggers search

**Elements**:
- `#search-book-input` - Text input
- `#search-book-btn` - Search button
- `#search-book-results` - Results container

**Search Flow**:
```javascript
1. User types in input → debounced call to doSearch()
2. User presses Enter → immediate call to doSearch()
3. User clicks button → immediate call to doSearch()

async function doSearch(query):
    4. Validate query is not empty
    5. Call window.api.searchBooks(query)
    6. Backend returns array of matching books
    7. Clear results div
    8. If no results: show "No results found"
    9. For each result: render book card with title, author, ISBN, status
```

**Result Card HTML**:
```html
<div style="border:1px solid #ddd; padding:10px; margin:8px 0;">
    <strong>📚 Book Title</strong>
    <div>Author: John Doe</div>
    <div>ISBN: 1234567890</div>
    <div>Status: Available / Borrowed by [Name]</div>
</div>
```

**Important**: Backend must handle case-insensitive search

---

### 8. Search Member Page (`initSearchMemberPage()`)

**Features**: Same as Search Book Page

**Search Flow**:
```javascript
async function doMemberSearch(query):
    1. Call window.api.searchMember(query)
    2. Backend returns single object or array of members
    3. Normalize to array: items = Array.isArray(result) ? result : [result]
    4. Fetch books to show borrowed books
    5. For each member:
        - Find borrowed books (issuedTo matches member ID or name)
        - Render member card with name, ID, address, borrowed books
```

**Result Card HTML**:
```html
<div style="border:1px solid #ddd; padding:12px; margin:10px 0;">
    <strong>👤 Member Name</strong> • Book1, Book2
    <div>Member ID: 123</div>
    <div>Address: 123 Main St</div>
</div>
```

---

### 9. Issue Book Page (`initIssueBookPage()`)

**Purpose**: Checkout a book to a member

**Form Fields**:
- Book ID (input)
- Member ID (input)

**Validation**:
- Both IDs required
- Book must exist and be available (not borrowed)
- Member must exist

**Flow**:
```javascript
1. User enters Book ID and Member ID
2. Click "Issue Book" button
3. Fetch books and members from cache
4. Validate:
   - Book exists: books.find(b => b.id == bookID)
   - Book available: !book.borrowed
   - Member exists: members.find(m => m.id == memberID)
5. Call window.api.issueBook(bookID, memberID)
6. Backend updates database
7. Invalidate caches (force refresh)
8. Show success toast
9. Clear form
```

**Error Cases**:
- "Book ID and Member ID are required"
- "Book not found"
- "Book is already borrowed"
- "Member not found"
- Backend error messages

---

### 10. Return Book Page (`initReturnBookPage()`)

**Purpose**: Return a borrowed book

**Form Fields**:
- Book ID (input)
- Member ID (input) - for verification

**Validation**:
- Both IDs required
- Book must exist and be borrowed
- Book must be issued to the specified member

**Flow**:
```javascript
1. User enters Book ID and Member ID
2. Click "Return Book" button
3. Fetch books from cache
4. Validate:
   - Book exists
   - Book is borrowed
   - Book.issuedTo matches memberID
5. Call window.api.returnBook(bookID, memberID)
6. Backend updates database
7. Invalidate caches
8. Show success toast
9. Clear form
```

---

### 11. Borrowed Books Page (`initBorrowedBooksPage()`)

**Purpose**: Show all currently borrowed books

**Display**: Table with columns:
- Book ID
- Title
- Author
- ISBN
- Issued To (member name/ID)

**Logic**:
```javascript
async function loadBorrowed() {
    const books = await fetchBooksCached();
    const members = await fetchMembersCached();
    
    const borrowed = books.filter(b => b.borrowed);
    
    borrowed.forEach(b => {
        // Find member by ID or name
        const mem = members.find(m => 
            String(m.id) === String(b.issuedTo) ||
            String(m.name) === String(b.issuedTo)
        );
        
        // Render row with book info and member name
    });
}
```

---

## Data Flow Architecture

### 1. Backend Communication

**IPC Layer**:
```
renderer.js → window.api.* → preload.js → ipcRenderer.invoke() 
→ main.js (IPC handler) → backend-client.js → C++ Backend (stdio JSON-RPC)
```

**Available API Methods** (from `preload.js`):
```javascript
window.api = {
    // Books
    addBook(title, isbn, author)
    getAllBooks()
    searchBooks(query)
    deleteBook(id)
    
    // Members
    addMember(name, address)
    getAllMembers()
    searchMember(query)
    deleteMember(id)
    
    // Transactions
    issueBook(bookID, memberID)
    returnBook(bookID, memberID)
    
    // Misc
    getRecommendations()
    navigateTo(page)
}
```

---

### 2. Caching Strategy

**Why cache?**
- Reduce backend calls (faster UI)
- Offline-like experience
- Less load on C++ backend

**When cache is used**:
- View Books page (initial load, sorting)
- View Members page (initial load, sorting)
- Dashboard (stats, recommendations, recently added)
- Search pages (validation)
- Issue/Return pages (validation)

**When cache is invalidated** (force refresh):
- After adding book/member
- After issuing/returning book
- Manual "Refresh" button click
- Cache expires (30 seconds)

**Cache Pattern**:
```javascript
// Check cache first
if (cacheIsFresh) return cachedData;

// Fetch from backend
const data = await window.api.getAllBooks();

// Update cache
_bookCache = { ts: Date.now(), data };

return data;
```

---

## Event Handling

### 1. Form Submissions

**Pattern**: Prevent default, validate, call API, invalidate cache, show feedback

```javascript
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate
    if (!title) {
        showToast('Title required', true);
        return;
    }
    
    // Call API
    try {
        await window.api.addBook(title, isbn, author);
        
        // Invalidate cache
        _bookCache.ts = 0;
        
        // Feedback
        showToast('Book added!');
        form.reset();
    } catch (err) {
        showToast('Error: ' + err.message, true);
    }
});
```

---

### 2. Keyboard Shortcuts

**Global Shortcuts** (work on all pages):
- `Ctrl+K` - Focus book search (Quick Actions on dashboard)
- `Ctrl+M` - Focus member search (Quick Actions on dashboard)
- `Escape` - Close modals (confirm/info dialogs)

**Implementation**:
```javascript
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close any open modal
            const modal = document.querySelector('.confirm-backdrop');
            if (modal) modal.click();
        }
        
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            // Focus Quick Actions search on dashboard
            const input = document.getElementById('quick-search-input');
            if (input) input.focus();
        }
        
        // ... similar for Ctrl+M
    });
}
```

---

### 3. Debounced Input Handlers

**Used for**:
- Quick Actions search
- Search book page
- Search member page

**Pattern**:
```javascript
const debouncedSearch = debounce(async (query) => {
    // Perform search
}, 220);

input.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});
```

---

### 4. Click Delegation

**Used for**: Table action buttons (Details, Delete, etc.)

**Pattern**:
```javascript
tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('.view-member-btn');
    if (!btn) return;
    
    const id = btn.dataset.id;
    // Handle action
});
```

**Why delegation?**
- Works with dynamically added rows
- Single listener instead of many
- Better performance

---

## Performance Optimizations

### 1. Debouncing
**Impact**: Reduces backend calls by 90%+ during typing
**Implementation**: 220-250ms delay

### 2. Caching
**Impact**: Instant page loads for repeat views
**Implementation**: 30s TTL, smart invalidation

### 3. Delayed Loader
**Impact**: No flicker for fast operations (< 160ms)
**Implementation**: setTimeout with promise wrapper

### 4. RequestAnimationFrame Animations
**Impact**: Smooth 60fps animations
**Implementation**: CSS keyframes + RAF for class toggling

### 5. Event Delegation
**Impact**: Fewer listeners, less memory
**Implementation**: Single click listener on tbody for all row actions

### 6. CSS Animations vs JavaScript
**Impact**: Hardware accelerated, better performance
**Implementation**: CSS keyframes (fadeIn, slideIn, popIn) instead of JS animation loops

---

## Animation System

### CSS Keyframes Defined in `style.css`:

1. **fadeIn** - Opacity 0 → 1
2. **slideIn** - Translate Y -20px → 0
3. **popIn** - Scale 0.8 → 1
4. **dropdownIn** - Opacity + translate for suggestions
5. **spin** - Rotate 360° for loader

### Usage Pattern:
```javascript
// 1. Add element with animation class
element.classList.add('table-row-anim');

// 2. Trigger animation on next frame
requestAnimationFrame(() => {
    element.classList.add('in');
});
```

**Why requestAnimationFrame?**
- Ensures browser has painted initial state
- Triggers CSS transition smoothly
- Avoids layout thrashing

---

## Error Handling Patterns

### 1. Try-Catch Blocks
Every async API call is wrapped:
```javascript
try {
    await window.api.addBook(title, isbn, author);
    showToast('Success!');
} catch (err) {
    console.error('Add book error:', err);
    showToast('Failed: ' + err.message, true);
}
```

### 2. Validation Before API Calls
Prevents unnecessary backend errors:
```javascript
if (!title || !isbn) {
    showToast('All fields required', true);
    return;
}
```

### 3. Graceful Degradation
If cache fails, return empty array:
```javascript
async function fetchBooksCached() {
    try {
        // fetch logic
    } catch (err) {
        return []; // Don't crash, return empty
    }
}
```

---

## Common Patterns & Best Practices

### 1. Element Existence Checks
```javascript
const btn = document.getElementById('my-btn');
if (!btn) return; // Exit if element doesn't exist
```

**Why**: Some pages don't have all elements, prevents null reference errors

---

### 2. String Comparison with Type Coercion
```javascript
String(book.id) === String(inputID)
```

**Why**: IDs might be numbers or strings from different sources

---

### 3. Array Safety
```javascript
const items = member.borrowed || [];
(booksList || []).filter(b => ...)
```

**Why**: Backend might return null/undefined

---

### 4. Force Refresh Pattern
```javascript
_bookCache.ts = 0; // Invalidate cache
await fetchBooksCached(true); // Force refresh
```

---

### 5. Loader Wrapping
```javascript
const data = await withLoader(() => window.api.getAllBooks());
```

**Why**: Automatic loader management, no manual show/hide

---

## Troubleshooting Guide

### Issue: "Cannot redeclare block-scoped variable"
**Cause**: Variable declared twice in same scope
**Fix**: Rename one variable or use different scope

### Issue: Search not working
**Cause**: Backend doesn't handle case-insensitive search
**Fix**: Backend must normalize query (`.toLowerCase()`)

### Issue: Cache not updating after adding item
**Cause**: Forgot to invalidate cache
**Fix**: Set `_bookCache.ts = 0` after successful add

### Issue: Modal won't close
**Cause**: Escape key handler not set up
**Fix**: Ensure `setupKeyboardShortcuts()` is called in DOMContentLoaded

### Issue: Borrowed books not showing for member
**Cause**: Multiple possible book-to-member link methods
**Fix**: Check all 3 methods (borrowedBookID, borrowed array, issuedTo field)

### Issue: Export CSV shows garbled text
**Cause**: Special characters not escaped
**Fix**: Escape quotes: `str.replace(/"/g, '""')`

---

## Future Enhancements (Not Yet Implemented)

1. **Pagination** for large datasets (1000+ books)
2. **Advanced filtering** (by author, availability, etc.)
3. **Batch operations** (select multiple, bulk delete)
4. **Undo/Redo** system
5. **Dark mode** toggle
6. **Accessibility** improvements (ARIA labels, keyboard navigation)
7. **Offline mode** with IndexedDB persistence
8. **Real-time updates** via WebSockets
9. **Book cover images** upload/display
10. **Overdue tracking** and notifications

---

## File Dependencies

**Requires**:
- `preload.js` - Exposes `window.api` methods
- `style.css` - Animation keyframes, component styles
- Backend running - C++ executable via `backend-client.js`

**Used By**:
- All HTML pages (via `<script src="renderer.js">`)

---

## Key Takeaways

1. **Single responsibility**: Each `init*()` function handles one page
2. **DRY principle**: Reusable helpers (toast, modal, cache, loader)
3. **Progressive enhancement**: Works without JS (navigation via links)
4. **Performance first**: Caching, debouncing, delayed loader
5. **User feedback**: Toast for every action, loader for slow operations
6. **Error resilience**: Try-catch everywhere, graceful degradation
7. **Maintainability**: Clear naming, comments, consistent patterns

---

## Quick Reference

### Most Used Functions
- `fetchBooksCached()` - Get books (with cache)
- `fetchMembersCached()` - Get members (with cache)
- `showToast(msg, isErr)` - Show notification
- `showConfirmModal(title, msg)` - Ask confirmation
- `withLoader(fn)` - Wrap async call with loader
- `debounce(fn, wait)` - Delay function execution

### Most Common Bugs to Avoid
1. Forgetting to invalidate cache after mutations
2. Not checking element existence before accessing
3. Not escaping special characters in CSV export
4. Using `forEach` with async (use `for...of` or `Promise.all` instead)
5. Forgetting `e.preventDefault()` on form submissions

---

*Last Updated: December 14, 2025*
