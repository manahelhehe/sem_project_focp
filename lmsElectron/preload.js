const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // ✅ Navigation function (using invoke for consistency)
    navigateTo: (page) => ipcRenderer.invoke('navigate', page),

    // ✅ Book functions
    addBook: (title, isbn, author) =>
        ipcRenderer.invoke('add-book', title, isbn, author),
    
    getAllBooks: () =>
        ipcRenderer.invoke('get-all-books'),
    
    searchBooks: (query) =>
        ipcRenderer.invoke('search-books', query),
    
    deleteBook: (id) =>
        ipcRenderer.invoke('delete-book', id),

    // ✅ Member functions
    addMember: (name, address) =>
        ipcRenderer.invoke('add-member', name, address),
    
    getAllMembers: () =>
        ipcRenderer.invoke('get-all-members'),
    
    deleteMember: (id) =>
        ipcRenderer.invoke('delete-member', id),

    // ✅ Search & Transaction functions
    searchMember: (query) =>
        ipcRenderer.invoke('search-member', query),
    
    issueBook: (bookID, memberID) =>
        ipcRenderer.invoke('issue-book', bookID, memberID),
    
    returnBook: (bookID, memberID) =>
        ipcRenderer.invoke('return-book', bookID, memberID),
    
    // Recommendations (frontend can also compute, but expose via backend if needed)
    getRecommendations: () =>
        ipcRenderer.invoke('get-recommendations')
});

