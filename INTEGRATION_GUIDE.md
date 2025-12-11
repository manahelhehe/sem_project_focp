# Library Management System - Frontend Integration Guide

## Overview
This guide walks you through integrating the C++ backend with your Electron/Node.js frontend (HTML/CSS/JS). The backend runs as a child process and communicates via JSON over stdin/stdout.

---

## Step-by-Step Integration (Realistic Timeline)

### Phase 1: Backend Build (✅ Already Done) — 30 min
- [x] Updated `CMakeLists.txt` to compile `sqlite3.c` as C
- [x] Created `cli.cpp` with JSON-over-stdio protocol
- [x] Built executable: `build/bin/sem_project_focp.exe`

**Commands:**
```bash
cd c:\Users\manah\sem_project_focp\build
cmake .. -G "MinGW Makefiles"
cmake --build . --config Release
```

**Output:** `build/bin/sem_project_focp.exe` (~1.3 MB) is your backend binary.

---

### Phase 2: Electron Setup — 1–2 hours

#### 2.1 Initialize Node.js project (if not already done)
```bash
cd c:\Users\manah\sem_project_focp\lmsElectron
npm init -y
npm install electron --save-dev
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

#### 2.3 Key files created for you:
- `main.js` — Electron main process (spawns backend, bridges IPC)
- `preload.js` — Secure IPC bridge to renderer
- `backend-client.js` — Backend communication client
- `index.html` — UI layout
- `renderer.js` — Frontend logic
- `style.css` — Styling

---

### Phase 3: Configure Backend Path — 15 min

In `main.js`, the `getBackendPath()` function returns the path to the C++ executable. 

**For development:**
```javascript
function getBackendPath() {
    return path.join(__dirname, '..', 'build', 'bin', 'sem_project_focp.exe');
}
```

**For packaged app (after electron-builder):**
```javascript
function getBackendPath() {
    const baseDir = process.resourcesPath;
    return path.join(baseDir, 'backend', 'sem_project_focp.exe');
}
```

---

### Phase 4: Run the App — 10 min

```bash
cd c:\Users\manah\sem_project_focp\lmsElectron
npm start
```

The Electron window opens → backend is spawned → UI is ready.

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
