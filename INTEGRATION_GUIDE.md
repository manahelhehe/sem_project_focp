# Library Management System, The Integration Guide (10/12/25)

## Overview
This is how the integration was done for a C++ Backend with a Node.js Frontend (HTML/CSS/JS) running on Electron.
Integration for this purpose can be done through two ways:
1. Introducing a HTTP Server between both the ends.
2. Introducing C++ as a child process within Electron using IPC (Inter Process Communication Handlers)
---

## Backend Adjustments (v nice code, v minimal errors):
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

####usually, if not initialized, u initiazlize your electron setup, and NEVER commit node_modules (~330MB) to Git.
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

#### 2.3 Key files that I had to create (* marks already made, only adjusted):
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

### Phase 5: Test Each Feature — 30–45 min

**Test in this order:**

1. **Books Tab**
   - Click "Show All" → should load any existing books
   - Add a book: title="Harry Potter", ISBN="12345", Author="J.K. Rowling"
   - Search for "Harry" → should find the book
   - Verify table displays correctly

2. **Members Tab**
   - Click "Show All" → should load existing members
   - Register a member: name="John Doe", address="123 Main St"
   - Search by ID
   - Verify table displays correctly

3. **Borrow/Return Tab**
   - Checkout: use the book ID and member ID from above
   - Return: same IDs
   - Check if book status changes in the Books tab

4. **Error Handling**
   - Try to checkout a book twice (should fail)
   - Try invalid member ID (should fail)
   - Try missing fields in forms

---

## What to Watch Out For

### 1. **Backend Path Issues**
- If the backend executable path is wrong, the app will launch but fail silently
- **Fix:** Check `console.log()` in dev tools (Ctrl+Shift+I)
- Ensure `build/bin/sem_project_focp.exe` exists before running

### 2. **Database Persistence**
- By default, the backend creates `library.db` in the current working directory
- During development, it goes to your project root
- **For production:** Set a fixed DB path (e.g., `%APPDATA%/LMS/library.db`)

### 3. **Input Validation**
- The HTML form `required` attributes prevent empty submissions
- The C++ backend also validates (redundant, but good)
- Frontend should show user-friendly error messages (already done via `alert()`)

### 4. **Timeouts**
- The backend call has a 30-second timeout (see `backend-client.js`)
- If the backend is slow or hung, requests will fail
- For large datasets (1000+ books), add progress indicators

### 5. **Cross-platform Paths**
- Currently hardcoded for Windows (`sem_project_focp.exe`)
- For macOS/Linux, modify:
  ```javascript
  function getBackendPath() {
      const platform = process.platform;
      const exeName = platform === 'win32' ? 'sem_project_focp.exe' : 'sem_project_focp';
      return path.join(__dirname, '..', 'build', 'bin', exeName);
  }
  ```

---

## Realistic Time Breakdown

| Phase | Time | Complexity |
|-------|------|-----------|
| Backend build | 30 min | Low (done) |
| Electron setup | 1–2 hr | Medium |
| Configure backend path | 15 min | Low |
| Test & debug | 1–2 hr | Medium–High |
| **Total** | **3–4.5 hours** | — |

**Note:** If you're new to Electron, expect +30–60 min for debugging IPC issues or understanding the preload script.

---

## Things You Should Take Care Of

### 1. **Data Persistence (High Priority)**
- Implement a proper database initialization on first run
- Add a "Clear Database" button for testing
- Back up `library.db` before major updates

### 2. **Error Handling (High Priority)**
- Backend errors are shown via `alert()` — consider replacing with toast notifications
- Add try-catch wrappers around all `ipcRenderer.invoke()` calls
- Log errors to a file for debugging: `console.log()` → file

### 3. **UI Responsiveness (Medium Priority)**
- Add loading spinners while backend calls are in progress
- Disable buttons during API calls to prevent double-submissions
- Use `async/await` (already done in `renderer.js`)

### 4. **Security (High Priority)**
- Never pass user input directly to shell commands
- Sanitize all inputs in both frontend and backend
- Use `preload.js` to sandbox the renderer (already done)
- Don't ship with debug console in production

### 5. **Packaging & Distribution (Medium Priority)**
- Use `electron-builder` to create an installer (`.msi` for Windows)
- Include the backend binary in the packaged app
- Sign the app on Windows/macOS for security
- Create a separate "backend" folder during packaging

### 6. **Database Schema (Low Priority for now)**
- The backend currently uses in-memory storage (no actual DB queries yet!)
- To persist data, implement SQLite queries in `database.cpp`
- Schema:
  ```sql
  CREATE TABLE Books (
      ID INTEGER PRIMARY KEY,
      Title TEXT,
      Author TEXT,
      ISBN TEXT,
      BorrowStatus BOOLEAN,
      IssuedTo INTEGER
  );
  
  CREATE TABLE Members (
      ID INTEGER PRIMARY KEY,
      Name TEXT,
      Address TEXT,
      BorrowedBookID INTEGER
  );
  ```

---

## Quick Reference: API Methods

Your frontend can call any of these via `window.api.*`:

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

All methods are async (return Promises) and may throw errors.

---

## Next Steps After Getting It Working

1. **Add real SQLite queries** in `database.cpp` (currently it's all in-memory)
2. **Add user authentication** (login screen)
3. **Add export/import** (CSV, PDF reports)
4. **Add rich UI** (charts, search filters, pagination)
5. **Package the app** with electron-builder for distribution

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend not starting | Check path in `getBackendPath()`, verify `.exe` exists |
| "Unknown method" errors | Check `cli.cpp` for method name (case-sensitive) |
| No data appears | Backend may not have connected; check stderr in console |
| Buttons do nothing | Check DevTools (Ctrl+Shift+I) for JS errors |
| App crashes on startup | Backend exited; check if `library.db` permissions are OK |

---

## Summary

You now have:
- ✅ A fully functional C++ backend (CLI + JSON-RPC)
- ✅ An Electron frontend with tab navigation
- ✅ All 8 API methods wired up
- ✅ Proper error handling and timeouts
- ✅ A secure preload bridge

**Next action:** Run `npm install` in `lmsElectron`, then `npm start`. Test each tab.

Good luck! 🚀
