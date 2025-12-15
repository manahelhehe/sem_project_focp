const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const BackendClient = require('./backend-client');

let mainWindow;
let backend;

function getBackendPath() {
    // During development, backend is in build/bin
    return path.join(__dirname, '..', 'build', 'bin', 'sem_project_focp.exe');
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        }
    });

    mainWindow.loadFile("index.html");
    // Uncomment to debug:
    // mainWindow.webContents.openDevTools();
}

function initBackend() {
    try {
        backend = new BackendClient(getBackendPath());
        console.log('✅ Backend initialized');
    } catch (err) {
        console.error('❌ Failed to initialize backend:', err);
        app.quit();
    }

    // IPC: Navigation (used by your existing code)
    ipcMain.handle('navigate', async (event, page) => {
        return page;
    });

    // IPC: Book operations
    ipcMain.handle('add-book', async (event, title, isbn, author) => {
        // Backend auto-generates ID via SQLite auto-increment
        return backend.addBook(title, isbn, author);
    });

    ipcMain.handle('get-all-books', async (event) => {
        return backend.listBooks();
    });

    ipcMain.handle('delete-book', async (event, id) => {
        return backend.call('delete-book', { bookID: id });
    });

    // IPC: Member operations
    ipcMain.handle('add-member', async (event, name, address) => {
        // Backend auto-generates ID via SQLite auto-increment
        return backend.addMember(name, address);
    });

    ipcMain.handle('get-all-members', async (event) => {
        return backend.listMembers();
    });

    ipcMain.handle('delete-member', async (event, id) => {
        return backend.call('delete-member', { memberID: id });
    });

    // IPC: Search operations
    ipcMain.handle('search-member', async (event, query) => {
        // forward raw query (numeric or name) to backend client
        console.log('[Main] search-member', query);
        return backend.searchMember(query);
    });

    ipcMain.handle('search-books', async (event, query) => {
        console.log('[Main] search-books', query);
        return backend.searchBooks(query);
    });

    // IPC: Transactions
    ipcMain.handle('issue-book', async (event, bookID, memberID) => {
        return backend.checkoutBook(bookID, memberID);
    });

    ipcMain.handle('return-book', async (event, bookID, memberID) => {
        return backend.returnBook(bookID, memberID);
    });

    // IPC: Recommendations (simple server-side recommendations)
    ipcMain.handle('get-recommendations', async (event) => {
        try {
            const books = await backend.listBooks();
            if (!books || books.length === 0) return [];
            const avail = books.filter(b => !b.borrowed);
            const candidates = avail.length ? avail : books;
            // shuffle and pick up to 5
            for (let i = candidates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
            }
            return candidates.slice(0, Math.min(5, candidates.length));
        } catch (err) {
            console.error('get-recommendations error', err);
            return [];
        }
    });
}

app.whenReady().then(() => {
    createWindow();
    initBackend();
});

app.on('window-all-closed', () => {
    if (backend) {
        backend.close();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});