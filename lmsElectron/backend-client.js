/**
 * Backend Client - Communicates with the C++ backend via child process
 * 
 * Usage:
 *   const backend = new BackendClient(pathToExe);
 *   const books = await backend.call('listBooks');
 */

const { spawn } = require('child_process');
const path = require('path');

class BackendClient {
    constructor(exePath) {
        this.exePath = exePath;
        this.process = null;
        this.requestId = 0;
        this.pendingRequests = {};
        this.isReady = false;
        this.initProcess();
    }

    initProcess() {
        this.process = spawn(this.exePath);
        this.isReady = true;

        // Handle stdout (responses from backend)
        this.process.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const response = JSON.parse(line);
                        this.handleResponse(response);
                    } catch (e) {
                        console.error('Failed to parse backend response:', line);
                    }
                }
            }
        });

        // Handle errors
        this.process.stderr.on('data', (data) => {
            console.error(`[Backend Error] ${data}`);
        });

        this.process.on('error', (err) => {
            console.error('Backend process error:', err);
            this.isReady = false;
        });

        this.process.on('close', () => {
            console.log('Backend process closed');
            this.isReady = false;
        });
    }

    /**
     * Send a request to the backend and await the response
     * @param {string} method - RPC method name
     * @param {object} params - Method parameters
     * @returns {Promise} Resolves to the response data or rejects with error
     */
    call(method, params = {}) {
        return new Promise((resolve, reject) => {
            if (!this.isReady) {
                reject(new Error('Backend not ready'));
                return;
            }

            const id = ++this.requestId;
            const request = {
                id,
                method,
                ...params
            };

            // Store the resolver/rejector
            this.pendingRequests[id] = { resolve, reject };

            // Send to backend
            const line = JSON.stringify(request) + '\n';
            this.process.stdin.write(line, (err) => {
                if (err) {
                    delete this.pendingRequests[id];
                    reject(err);
                }
            });

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests[id]) {
                    delete this.pendingRequests[id];
                    reject(new Error(`Backend call timeout: ${method}`));
                }
            }, 30000);
        });
    }

    handleResponse(response) {
        const { id, success, data, error } = response;
        const handler = this.pendingRequests[id];

        if (!handler) {
            console.warn(`Received response for unknown request: ${id}`);
            return;
        }

        delete this.pendingRequests[id];

        if (success) {
            handler.resolve(data);
        } else {
            handler.reject(new Error(error || 'Backend error'));
        }
    }

    /**
     * Convenience methods
     */
    listBooks() {
        return this.call('listBooks');
    }

    listMembers() {
        return this.call('listMembers');
    }

    addBook(title, isbn, author) {
        return this.call('addBook', { title, isbn, author });
    }

    addMember(name, address) {
        return this.call('addMember', { name, address });
    }

    checkoutBook(bookID, memberID) {
        return this.call('checkoutBook', { bookID, memberID });
    }

    returnBook(bookID, memberID) {
        return this.call('returnBook', { bookID, memberID });
    }

    searchBooks(query) {
        return this.call('searchBooks', { query });
    }

    // searchMember can accept either a numeric memberID or a string query (name)
    searchMember(query) {
        if (typeof query === 'number' || (typeof query === 'string' && /^\d+$/.test(query))) {
            // numeric id
            const id = typeof query === 'number' ? query : parseInt(query, 10);
            return this.call('searchMember', { memberID: id });
        }
        // otherwise send as name query
        return this.call('searchMember', { query });
    }

    close() {
        if (this.process) {
            this.process.kill();
        }
    }
}

module.exports = BackendClient;
