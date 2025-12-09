const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // ✅ Navigation function (using invoke for consistency)
    navigateTo: (page) => ipcRenderer.invoke('navigate', page),

    // ✅ Book functions
    addBook: (id, title, author, isbn) =>
        ipcRenderer.invoke('add-book', id, title, author, isbn),
    
    getAllBooks: () =>
        ipcRenderer.invoke('get-all-books'),
    
    deleteBook: (id) =>
        ipcRenderer.invoke('delete-book', id),

    // ✅ Member functions
    addMember: (id, name, address) =>
        ipcRenderer.invoke('add-member', id, name, address),
    
    getAllMembers: () =>
        ipcRenderer.invoke('get-all-members'),
    
    deleteMember: (id) =>
        ipcRenderer.invoke('delete-member', id),

    // ✅ Search & Transaction functions
    searchMember: (query) =>
        ipcRenderer.invoke('search-member', query),
    
    issueBook: (bookID, memberID) =>
        ipcRenderer.invoke('issue-book', bookID, memberID),
    
    returnBook: (bookID) =>
        ipcRenderer.invoke('return-book', bookID),
});


