# Library Management System, The Integration Guide (10/12/25)

## Overview
This is how the integration was done for a C++ Backend with a Node.js Frontend (HTML/CSS/JS) running on Electron.
Integration for this purpose can be done through two ways:
1. Introducing a HTTP Server between both the ends.
2. Introducing C++ as a child process within Electron using IPC (Inter Process Communication Handlers) - went for this.
---

## Backend Adjustments (amazing code, minimal adjustments required):
Changed constructor in member.h, in member.cpp, removed default value of borrowedBookID in function definition so its only there in the header, changed addMember parameters to pass by value and in displayBorrowedBook function, changed borrowedBookID to int type

## Steps / Time taken

### Phase 1: Backend Build ( Already Done) — 1.5hrs
- [x] Updated `CMakeLists.txt` to compile `sqlite3.c` as C as its written for C and not C++
- [x] Created `cli.cpp` with JSON protocol for standard i/o, electron sends command in json form and cli.cpp complies and sends back response in json.
- [x] Built executable: `build/bin/sem_project_focp.exe` using CMake after moving to build dir where cmake builds its files

**Commands:**
```bash
cd c:\Users\manah\sem_project_focp\build
cmake .. -G "MinGW Makefiles" (configuring using mingw in root project dir)
cmake --build . --config Release (actually compiling from .cpp to .o to .exe)
```

**Output:** build/bin/sem_project_focp.exe 
note: binary files are nvr committed to github, learned it the hard way

---

### Phase 2: Electron Setup — 3+ hours probably

#### usually, if not initialized, u initiazlize your electron setup, and NEVER commit node_modules (~330MB) to Git. HEADACHE.
```Initialization (Not Required in our Case)
npm init -y
npm install (installs node_modules)
```

#### 2.2 Update `package.json`
```json
{
  "name": "lms-electron",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder"
  },
  "devDependencies": {
    "electron": "^latest",
    "electron-builder": "^latest"
  }
}
```

#### 2.3 Imp files that I had to create (* marks already made, only adjusted):
-* `main.js` — Electron main process (calls backend, acts as a bridge for IPC?)
- `preload.js` — connects IPC Bridge with renderer
- `backend-client.js` — Backend communication client
-* `index.html` — First UI Screen
-* `renderer.js` — Frontend functionality all in js bruh
-* `style.css` — Styling (Favourite File)

---

### Phase 3: Configure Backend Path — 1hr
Electron app needs to know where the C++ backend .exe is located so it can run it.
This is handled in the getBackendPath() function inside main.js.

Two situations which occur here, both needed to be covered apparently:

**During App Development:**
During development, the folder structure is normal and the compiled .exe sits inside so it just finds the .exe file in the bin and returns that path.
```javascript
function getBackendPath() {
    return path.join(__dirname, '..', 'build', 'bin', 'sem_project_focp.exe');
}
```

**For packaged app (after its built):**
When the final app is made, instead of the bin, electron stores the .exe file in a place with other resource files, this path redirects it to that.
```javascript
function getBackendPath() {
    const baseDir = process.resourcesPath;
    return path.join(baseDir, 'backend', 'sem_project_focp.exe');
}
```

---

### Phase 4: Running the App — 

```bash
cd c:\Users\manah\sem_project_focp\lmsElectron
npm start
```
### DEBUGGING ~4+ hrs
Several issues faced:
Add Books and Add members not working. Hence, nothing working. 
``` Cause:
renderer.js was directly modifying books and members array. Added async IPC calls
```

Nothing went beyond Login pAge for HOURS 
``` CauseS :
dasboard was calling renderer.js which didnt exist, correct location was renderer/renderer.js
same issue was present in every .html file, rewrote the code for said files.
renderer.js has initDashboard() which tried to find buttons by ID and click them,
but those buttons had onclick handlers
```

Add Book was not functioning properly
``` Causes:
ISBN field ID was mismatched, HTML had book-ISBN, but JS was looking for book-isbn (lowercase)
Message div didnt exist: No #addbook-message in the HTM ahahahahL
addBook call passes ID: Should not pass ID, backend does that stuff.
Updated IPC Handler to match new function signature.
```
Removed Manual ID inputs from Add Book 

Changed Button IDs for Return Book, it was incorrect
Changed the Search Book result divs, again mismatched

Fixed IPC wiring

and a few others i cannot recall.

### Features Added: (Additional 2 hours)
1. Refresh Buttons
2. Used Quick Sort for Partial Search in Search Buttons (u add 1-2 letters and the said item shows up)
3. Added a Recommendations Table
4. Added a Recently Added section
5. A quick Return Book and Issue Book display
6. Added a 'Help' button
7. Gradient Display
8. Added a simple stats section in dashboard to show number of borrowed books, added books and added members.
9. Added Confirmation dialogs for issuing and returning books
10. Added Pop Up messages for each section
11. Added an "Export CSV" option to the view books table
12. SQLite Persistence for local use
13. Moving buttons hehe
14. Made view tables sortable 
15. Added a Collapse/Expand button for the Quick Actions Panel.


---

Tested Features, Tests still need to be done:
**Error Handling**
   - Try to checkout a book twice (should fail)
   - Try invalid member ID (should fail)
   - Try missing fields 

---

## Things that went wrong and could go wrong AGAIN 
1. Backend Path Problems
sometimes the Electron app opens, but nothing works because it can’t find theC++ .exe.
If that happens:
The window will open but buttons won’t work.
to check, open dev tools and check that in console the file actually exists at
build/bin/sem_project_focp.exe

2. Where the Database Gets Saved
The backend creates library.db whenever and wherever its running, which is stored in project folder during development.
However, this wont be ideal when we package our final app because then the file will become read only so windows recommends to save it at a safe place
such as 
%APPDATA%/LMS/library.db

4. Backend Timeouts
Whenever frontend forwards a req to backend, theres a 30 second timeout.
Iff the backend freezes or takes too long, the request will fail.
Not probable currently but if we ever widen the scale of our app to the point of 1000+ books, we'll need an error message or a please wait etc message
so that the app does not look frozen.




---

## Things We Should Take Care Of
- Add a "Clear Database" button for testing
- Back up `library.db` before major updates
- Log errors to a file for debugging: `console.log()` → file
- Add loading spinners while backend calls are in progress
- Never pass user input directly to shell commands
- Use `electron-builder` to create an installer (`.msi` for Windows)
- Include the backend binary in the packaged app

## Quick Reference: API Methods (because i keep forgetting)

frontend can call any of these thru `window.api.*`:

```javascript
// Books
await window.api.listBooks()                           // → book[]
await window.api.addBook(title, isbn, author)         // → {message}
await window.api.searchBooks(query)                   // → book[]

// Members
await window.api.listMembers()                        // → member[]
await window.api.addMember(name, address)            // → {message}
await window.api.searchMember(memberID)              // → member

// Transactions
await window.api.checkoutBook(bookID, memberID)      // → {message}
await window.api.returnBook(bookID, memberID)        // → {message}
```

All methods are async (return Promises) and may show stupid errors.

---

## Things we need to change / which end needs to work on it
- currently, the searches and the titles are case sensitive (backend)
- Issue books uses member and book ids, could be changed to respond to multiple entries (BookID+Book Title, Mmeber ID + Mmeber Title) (backend)
- In view all books, issued to 'MemberID' is appearing, could be changed to 'issued to memberName' (backend mostly, some frontend)
- Refresh button is currently not funtioning
## Things we could add
- DeleteBook and DeleteMember Sections (front+backend)
- Add a field for issueDate and DueDate (back+frontend)
- Add a section displaying Due Dates and Set Fines for each due date missed.
---


## How It Works (Data Flow)

```
User clicks "Add Book" in UI
  ↓
renderer.js calls window.api.addBook()
  ↓
preload.js forwards to ipcRenderer.invoke('add-book')
  ↓
main.js receives IPC event, calls backend.addBook()
  ↓
backend-client.js writes JSON to backend process stdin
  ↓
C++ backend (cli.cpp) reads JSON, processes, writes response to stdout
  ↓
backend-client.js parses response, resolves the promise
  ↓
window.api.addBook() promise resolves, UI updates
```

---
## File Locations

```
c:\Users\manah\sem_project_focp\
├── build/
│   └── bin/
│       └── sem_project_focp.exe       ← Backend executable
├── lmsElectron/
│   ├── main.js                         ← Updated: spawns backend
│   ├── renderer.js                     ← Updated: uses backend via IPC
│   ├── preload.js                      ← Unchanged (already correct)
│   ├── backend-client.js               ← New: JSON-RPC client
│   ├── index.html + 9 other .html      ← Your UI (unchanged)
│   └── package.json                    ← npm dependencies
└── cli.cpp, library.cpp, etc.          ← Backend source
```

---


## Troubleshooting provided by copilot ohyuh

| Issue | Solution |
|-------|----------|
| Backend not starting | Check path in `getBackendPath()`, verify `.exe` exists |
| "Unknown method" errors | Check `cli.cpp` for method name (case-sensitive) |
| No data appears | Backend may not have connected; check stderr in console |
| Buttons do nothing | Check DevTools (Ctrl+Shift+I) for JS errors |
| App crashes on startup | Backend exited; check if `library.db` permissions are OK |

---
