// ---------- GLOBAL STATE (now fetched from backend) ----------
let books = [];
let members = [];
let nextBookID = 1003;
let nextMemberID = 5002;

// Client-side caches (reduce backend calls for snappy UI)
let _bookCache = { ts: 0, data: [] };
let _memberCache = { ts: 0, data: [] };
const CACHE_TTL = 30 * 1000; // 30s

async function fetchBooksCached(force = false) {
    const now = Date.now();
    if (!force && _bookCache.data.length && (now - _bookCache.ts) < CACHE_TTL) return _bookCache.data;
    // fetch with a subtle loader if the request takes longer than 160ms
    try {
        const bs = await withLoader(() => window.api.getAllBooks());
        _bookCache = { ts: Date.now(), data: bs || [] };
        return _bookCache.data;
    } catch (err) {
        return [];
    }
}

async function fetchMembersCached(force = false) {
    const now = Date.now();
    if (!force && _memberCache.data.length && (now - _memberCache.ts) < CACHE_TTL) return _memberCache.data;
    try {
        const ms = await withLoader(() => window.api.getAllMembers());
        _memberCache = { ts: Date.now(), data: ms || [] };
        return _memberCache.data;
    } catch (err) {
        return [];
    }
}

function debounce(fn, wait = 250) {
    let t = null;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

// Loader overlay with delayed show to avoid flicker for fast requests
let _loaderCount = 0;
let _loaderEl = null;
function _createLoader() {
    const bd = document.createElement('div');
    bd.className = 'loader-backdrop';
    const l = document.createElement('div'); l.className = 'loader';
    bd.appendChild(l);
    return bd;
}

function showLoader() {
    _loaderCount++;
    if (_loaderEl) return;
    _loaderEl = _createLoader();
    document.body.appendChild(_loaderEl);
}

function hideLoader() {
    _loaderCount = Math.max(0, _loaderCount - 1);
    if (_loaderCount === 0 && _loaderEl) {
        try { _loaderEl.parentNode.removeChild(_loaderEl); } catch (e) {}
        _loaderEl = null;
    }
}

// Run function returning a promise, show loader if it takes longer than delay
function withLoader(fn, delay = 160) {
    let timer = null;
    return new Promise(async (resolve, reject) => {
        timer = setTimeout(() => { showLoader(); }, delay);
        try {
            const r = await fn();
            clearTimeout(timer);
            hideLoader();
            resolve(r);
        } catch (err) {
            clearTimeout(timer);
            hideLoader();
            reject(err);
        }
    });
}

function renderSuggestions(container, items, renderText) {
    if (!container) return;
    container.innerHTML = '';
    if (!items || items.length === 0) { container.style.display = 'none'; return; }
    items.slice(0, 10).forEach(it => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = renderText ? renderText(it) : (it.name || it.title || '');
        div.dataset.value = JSON.stringify(it);
        container.appendChild(div);
        // animate in
        requestAnimationFrame(() => { div.classList.add('in'); });
    });
    container.style.display = 'block';
}

function closeAllSuggestions() {
    const els = document.querySelectorAll('.suggestions');
    els.forEach(e => { e.style.display = 'none'; });
}

async function resolveBookFromInput(input) {
    if (!input) return null;
    const list = await fetchBooksCached();
    const q = String(input).trim().toLowerCase();
    // If numeric, try id
    if (/^\d+$/.test(q)) {
        const id = parseInt(q);
        return list.find(b => b.id === id) || null;
    }
    // match title or isbn
    return list.find(b => (b.title || '').toLowerCase().includes(q) || (b.isbn || '').toLowerCase().includes(q)) || null;
}

async function resolveMemberFromInput(input) {
    if (!input) return null;
    const list = await fetchMembersCached();
    const q = String(input).trim().toLowerCase();
    if (/^\d+$/.test(q)) {
        const id = parseInt(q);
        return list.find(m => m.id === id) || null;
    }
    return list.find(m => (m.name || '').toLowerCase().includes(q)) || null;
}

// Helper to show errors
function showError(msg) {
    console.error(msg);
    showToast(msg, true);
}

// Small toast helper
// Toast queue using a container
function _ensureToastContainer() {
    let c = document.querySelector('.toast-container');
    if (!c) {
        c = document.createElement('div');
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    return c;
}

function showToast(message, isError = false, timeout = 3000) {
    const container = _ensureToastContainer();
    const t = document.createElement('div');
    t.className = 'toast show';
    t.style.background = isError ? 'linear-gradient(90deg,#a83a3a,#7a1f1f)' : 'linear-gradient(90deg,#333,#1a1a1a)';
    t.style.color = '#fff';
    t.textContent = message;
    container.appendChild(t);
    // entrance animation
    requestAnimationFrame(() => { t.classList.add('show'); });
    setTimeout(() => { t.classList.remove('show'); t.style.opacity = '0'; }, timeout - 400);
    setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, timeout);
}

// Confirm modal helper: returns a Promise<boolean>
function showConfirmModal(title, message) {
    return new Promise(resolve => {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-title">${title}</div>
            <div class="modal-body">${message}</div>
            <div class="modal-actions">
                <button class="btn ghost" id="modal-cancel">Cancel</button>
                <button class="btn primary" id="modal-confirm">Confirm</button>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // entrance animation
        requestAnimationFrame(() => { backdrop.classList.add('in'); modal.classList.add('in'); });

        const doClose = (val) => {
            // exit animation
            modal.classList.remove('in'); backdrop.classList.remove('in');
            setTimeout(() => { try { if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop); } catch (e){}; resolve(val); }, 220);
        };

        modal.querySelector('#modal-cancel').addEventListener('click', () => doClose(false));
        modal.querySelector('#modal-confirm').addEventListener('click', () => doClose(true));
    });
}

// ---------- DASHBOARD STATS ----------
function initDashboardStats() {
    const booksCount = document.getElementById('books-count');
    const membersCount = document.getElementById('members-count');
    const borrowedCount = document.getElementById('borrowed-count');
    const refreshStatsBtn = document.getElementById('refresh-stats-btn');

    async function loadStats() {
        try {
            if (refreshStatsBtn) refreshStatsBtn.disabled = true;
            const allBooks = await window.api.getAllBooks();
            const allMembers = await window.api.getAllMembers();
            const bCount = allBooks ? allBooks.length : 0;
            const mCount = allMembers ? allMembers.length : 0;
            const borrowed = allBooks ? allBooks.filter(b => b.borrowed).length : 0;
            if (booksCount) booksCount.textContent = bCount;
            if (membersCount) membersCount.textContent = mCount;
            if (borrowedCount) borrowedCount.textContent = borrowed;
            if (refreshStatsBtn) refreshStatsBtn.disabled = false;
        } catch (err) {
            if (booksCount) booksCount.textContent = '--';
            if (membersCount) membersCount.textContent = '--';
            if (borrowedCount) borrowedCount.textContent = '--';
            if (refreshStatsBtn) refreshStatsBtn.disabled = false;
        }
    }

    if (refreshStatsBtn) refreshStatsBtn.addEventListener('click', loadStats);
    loadStats();
}

// ---------- PAGE INITIALIZERS ----------
document.addEventListener('DOMContentLoaded', () => {
    initLoginPage();
    initDashboard();
    initQuickActions();
    initDashboardStats();
    initAddBookPage();
    initAddMemberPage();
    initViewBooksPage();
    initViewMembersPage();
    initSearchBookPage();
    initSearchMemberPage();
    initIssueBookPage();
    initReturnBookPage();
    initBorrowedBooksPage();
    initBackButtons();
    setupKeyboardShortcuts();
});

// ---------- QUICK ACTIONS (Dashboard) ----------
function initQuickActions() {
    const bookInput = document.getElementById('qa-book-input');
    const memberInput = document.getElementById('qa-member-input');
    const bookSug = document.getElementById('qa-book-suggestions');
    const memberSug = document.getElementById('qa-member-suggestions');
    const issueBtn = document.getElementById('qa-issue-btn');
    const returnBtn = document.getElementById('qa-return-btn');

    if (!bookInput || !memberInput) return;

    // collapse/expand toggle to avoid crowding
    const qaRoot = document.getElementById('quick-actions');
    const qaToggle = document.getElementById('qa-toggle');
    if (qaRoot && qaToggle) {
        qaToggle.addEventListener('click', () => {
            const collapsed = qaRoot.classList.toggle('qa-collapsed');
            qaToggle.textContent = collapsed ? '▸' : '▾';
        });
    }

    const onBookInput = debounce(async () => {
        const v = bookInput.value.trim();
        if (!v) { if (bookSug) bookSug.style.display = 'none'; return; }
        const list = await fetchBooksCached();
        const q = v.toLowerCase();
        const matches = list.filter(b => String(b.id) === q || (b.title||'').toLowerCase().includes(q) || (b.isbn||'').toLowerCase().includes(q));
        renderSuggestions(bookSug, matches, (b) => `${b.id} — ${b.title} ${b.borrowed? '(Issued)':''}`);
    }, 180);

    const onMemberInput = debounce(async () => {
        const v = memberInput.value.trim();
        if (!v) { if (memberSug) memberSug.style.display = 'none'; return; }
        const list = await fetchMembersCached();
        const q = v.toLowerCase();
        const matches = list.filter(m => String(m.id) === q || (m.name||'').toLowerCase().includes(q));
        renderSuggestions(memberSug, matches, (m) => `${m.id} — ${m.name}`);
    }, 180);

    bookInput.addEventListener('input', onBookInput);
    memberInput.addEventListener('input', onMemberInput);

    document.addEventListener('click', (e) => {
        if (!e.target.classList.contains('suggestion-item')) closeAllSuggestions();
    });

    // suggestion click handlers (delegation)
    if (bookSug) bookSug.addEventListener('click', (e) => {
        const it = e.target.closest('.suggestion-item');
        if (!it) return;
        const obj = JSON.parse(it.dataset.value || '{}');
        bookInput.value = obj.id ? String(obj.id) : (obj.title || '');
        bookSug.style.display = 'none';
    });
    if (memberSug) memberSug.addEventListener('click', (e) => {
        const it = e.target.closest('.suggestion-item');
        if (!it) return;
        const obj = JSON.parse(it.dataset.value || '{}');
        memberInput.value = obj.id ? String(obj.id) : (obj.name || '');
        memberSug.style.display = 'none';
    });

    if (issueBtn) issueBtn.addEventListener('click', async () => {
        const bookVal = bookInput.value.trim();
        const memberVal = memberInput.value.trim();
        if (!bookVal || !memberVal) { showToast('Enter book and member', true); return; }
        const book = await resolveBookFromInput(bookVal);
        const member = await resolveMemberFromInput(memberVal);
        if (!book) { showToast('Book not found', true); return; }
        if (!member) { showToast('Member not found', true); return; }
        const ok = await showConfirmModal('Quick Issue', `Issue "${book.title}" to ${member.name}?`);
        if (!ok) return;
        try {
            issueBtn.disabled = true;
            await window.api.issueBook(book.id, member.id);
            showToast('Book issued');
            _bookCache.ts = 0; // invalidate cache
            initDashboardStats();
            issueBtn.disabled = false;
        } catch (err) { issueBtn.disabled = false; showToast('Issue failed: '+err.message, true); }
    });

    if (returnBtn) returnBtn.addEventListener('click', async () => {
        const bookVal = bookInput.value.trim();
        const memberVal = memberInput.value.trim();
        if (!bookVal || !memberVal) { showToast('Enter book and member', true); return; }
        const book = await resolveBookFromInput(bookVal);
        const member = await resolveMemberFromInput(memberVal);
        if (!book) { showToast('Book not found', true); return; }
        if (!member) { showToast('Member not found', true); return; }
        const ok = await showConfirmModal('Quick Return', `Return "${book.title}" from ${member.name}?`);
        if (!ok) return;
        try {
            returnBtn.disabled = true;
            await window.api.returnBook(book.id, member.id);
            showToast('Book returned');
            _bookCache.ts = 0;
            initDashboardStats();
            returnBtn.disabled = false;
        } catch (err) { returnBtn.disabled = false; showToast('Return failed: '+err.message, true); }
    });
}

// ---------- LOGIN PAGE ----------
function initLoginPage() {
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;

    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const errorDiv = document.getElementById('login-error');

        loginBtn.addEventListener('click', (ev) => {
            console.log('[UI] login button clicked', { username: username?.value, passwordPresent: !!(password && password.value) });
            // debug: log element metrics and styles
            try {
                const r = loginBtn.getBoundingClientRect();
                console.log('[UI] loginBtn rect', r, 'computedStyle pointer-events', window.getComputedStyle(loginBtn)['pointer-events']);
            } catch (e) {}

            if (!username.value.trim() || !password.value.trim()) {
                if (errorDiv) errorDiv.textContent = "Please enter username and password.";
                return;
            }

            // try multiple navigation strategies in case one is blocked
            try {
                window.location.href = "dashboard.html";
            } catch (e) { console.warn('href navigation failed', e); }
            try {
                window.location.assign("dashboard.html");
            } catch (e) { console.warn('assign navigation failed', e); }
            try {
                window.open('dashboard.html', '_self');
            } catch (e) { console.warn('open navigation failed', e); }

            // as a last resort, delay a redirect (some overlays may swallow the immediate change)
            setTimeout(() => { try { window.location.href = 'dashboard.html'; } catch (e) {} }, 120);
        });

        // global click logger (debug only) to detect intercepted clicks
        document.addEventListener('click', (e) => {
            try {
                const t = e.target;
                if (t && t.id === 'loginBtn') console.log('[DEBUG] document click captured on loginBtn (bubble)', t);
                // also log if any element is covering the button
                const btn = document.getElementById('loginBtn');
                if (btn) {
                    const pt = { x: btn.getBoundingClientRect().left + 2, y: btn.getBoundingClientRect().top + 2 };
                    const topEl = document.elementFromPoint(pt.x, pt.y);
                    if (topEl && topEl !== btn) console.log('[DEBUG] elementAt(loginBtn) ->', topEl, 'id:', topEl.id, 'class:', topEl.className);
                }
            } catch (e) { }
        }, true);
}

// Ensure login handler attaches even if DOMContentLoaded timing is unexpected
try { initLoginPage(); } catch (e) { /* ignore */ }

// ---------- DASHBOARD ----------
function initDashboard() {
    // Navigation is now handled by onclick handlers in HTML, no need to do anything here
}

// Enhance dashboard: recommendations
function initDashboard() {
    const recList = document.getElementById('recommendations');
    if (!recList) return;

    async function loadRecommendations() {
        try {
            const books = await window.api.getAllBooks();
            recList.innerHTML = '';
            if (!books || books.length === 0) {
                recList.innerHTML = '<li>No recommendations available</li>';
                return;
            }

            // pick up to 5 available books at random
            const avail = books.filter(b => !b.borrowed);
            const candidates = avail.length ? avail : books;
            const shuffled = candidates.sort(() => 0.5 - Math.random());
            const picks = shuffled.slice(0, Math.min(5, shuffled.length));
            for (const b of picks) {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${b.title}</strong> — ${b.author} <span style="color:green;">${b.borrowed? 'Issued':'Available'}</span>`;
                recList.appendChild(li);
            }
            // also update recently added area
            loadRecentAdded();
        } catch (err) {
            recList.innerHTML = '<li>Error loading recommendations</li>';
        }
    }

    loadRecommendations();

    async function loadRecentAdded() {
        try {
            const recent = await fetchBooksCached(true);
            const container = document.getElementById('recent-added');
            if (!container) return;
            container.innerHTML = '';
            const sorted = (recent || []).slice().sort((a,b) => (b.id||0) - (a.id||0)).slice(0,6);
            if (sorted.length === 0) { container.innerHTML = '<div>No recent books</div>'; return; }
            sorted.forEach(b => {
                const d = document.createElement('div'); d.className = 'recent-item';
                d.innerHTML = `<h4>${b.title}</h4><p>${b.author || ''}</p><p style="font-size:11px;color:#666">ID: ${b.id} • ${b.isbn||''}</p>`;
                container.appendChild(d);
                requestAnimationFrame(() => { d.classList.add('in'); });
            });
        } catch (err) {
            // ignore
        }
    }
}

function initBackButtons() {
    const backButtons = document.querySelectorAll('.back-btn');
    backButtons.forEach(btn => btn.addEventListener("click", () => window.history.back()));
}

// ---------- ADD BOOK PAGE ----------
function initAddBookPage() {
    const addBookSubmit = document.getElementById('add-book-submit');
    if (!addBookSubmit) return;

    const msgDiv = document.getElementById('addbook-message');

    addBookSubmit.addEventListener('click', async () => {
        const title = document.getElementById('book-title').value.trim();
        const author = document.getElementById('book-author').value.trim();
        const isbn = document.getElementById('book-isbn').value.trim();

        if (!title || !author || !isbn) {
            if (msgDiv) { msgDiv.style.color = "red"; msgDiv.textContent = "Please fill in all fields!"; }
            return;
        }

        try {
            // Don't pass ID — backend auto-increments
            await window.api.addBook(title, isbn, author);
            if (msgDiv) { msgDiv.style.color = "green"; msgDiv.textContent = `✅ Book "${title}" added successfully!`; }
            document.getElementById('book-title').value = "";
            document.getElementById('book-author').value = "";
            document.getElementById('book-isbn').value = "";
        } catch (err) {
            if (msgDiv) { msgDiv.style.color = "red"; msgDiv.textContent = `❌ Error: ${err.message}`; }
        }
    });
}

// ---------- ADD MEMBER PAGE ----------
function initAddMemberPage() {
    const addMemberSubmit = document.getElementById('add-member-submit');
    if (!addMemberSubmit) return;

    const msgDiv = document.getElementById('addmember-message');

    addMemberSubmit.addEventListener('click', async () => {
        const name = document.getElementById('member-name').value.trim();
        const address = document.getElementById('member-address').value.trim();

        if (!name || !address) {
            if (msgDiv) { msgDiv.style.color = "red"; msgDiv.textContent = "Please fill in all fields!"; }
            return;
        }

        try {
            // Don't pass ID — backend auto-increments
            await window.api.addMember(name, address);
            if (msgDiv) { msgDiv.style.color = "green"; msgDiv.textContent = `✅ Member "${name}" added successfully!`; }
            document.getElementById('member-name').value = "";
            document.getElementById('member-address').value = "";
        } catch (err) {
            if (msgDiv) { msgDiv.style.color = "red"; msgDiv.textContent = `❌ Error: ${err.message}`; }
        }
    });
}

// ---------- VIEW BOOKS PAGE ----------
function initViewBooksPage() {
    const booksTable = document.getElementById('books-table');
    if (!booksTable) return;

    const tbody = booksTable.querySelector('tbody');
    // loadBooks supports optional sorting
    async function loadBooks(sortKey = null, sortDir = 'asc') {
        try {
            const btn = document.getElementById('refresh-books-btn');
            if (btn) btn.disabled = true;
            const list = await fetchBooksCached();
            books = list || [];
            let rows = books.slice();
            if (sortKey) {
                rows.sort((a,b) => {
                    let va = a[sortKey]; let vb = b[sortKey];
                    // normalize
                    va = (va === undefined || va === null) ? '' : va;
                    vb = (vb === undefined || vb === null) ? '' : vb;
                    if (typeof va === 'string') va = va.toLowerCase();
                    if (typeof vb === 'string') vb = vb.toLowerCase();
                    if (va < vb) return sortDir === 'asc' ? -1 : 1;
                    if (va > vb) return sortDir === 'asc' ? 1 : -1;
                    return 0;
                });
            }
            tbody.innerHTML = "";
            if (!rows || rows.length === 0) {
                tbody.innerHTML = "<tr><td colspan='5'>No books found.</td></tr>";
                if (btn) btn.disabled = false;
                return;
            }

            rows.forEach(book => {
                const tr = document.createElement('tr');
                const status = book.borrowed ? `Issued to ${book.issuedTo}` : 'Available';
                tr.innerHTML = `<td>${book.id}</td><td>${book.title}</td><td>${book.author}</td><td>${book.isbn}</td><td>${status}</td>`;
                tr.classList.add('table-row-anim');
                tbody.appendChild(tr);
                requestAnimationFrame(() => { tr.classList.add('in'); });
            });
            if (btn) btn.disabled = false;
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan='5'>Error: ${err.message}</td></tr>`;
            const btn = document.getElementById('refresh-books-btn'); if (btn) btn.disabled = false;
        }
    }

    // initial load
    loadBooks();

    // add sortable headers (assumes columns: ID, Title, Author, ISBN, Status)
    const ths = booksTable.querySelectorAll('th');
    if (ths && ths.length >= 5) {
        const keyMap = ['id','title','author','isbn','borrowed'];
        let current = { key: null, dir: 'asc' };
        ths.forEach((th, idx) => {
            th.style.cursor = 'pointer';
            const indicator = document.createElement('span'); indicator.className = 'sort-ind'; th.appendChild(indicator);
            th.addEventListener('click', () => {
                const key = keyMap[idx] || null;
                if (!key) return;
                if (current.key === key) current.dir = current.dir === 'asc' ? 'desc' : 'asc'; else { current.key = key; current.dir = 'asc'; }
                // update indicators
                ths.forEach((h,i) => { const si = h.querySelector('.sort-ind'); if (si) si.textContent = (i===idx? (current.dir==='asc'?'▲':'▼') : ''); });
                // special handling for borrowed -> sort by boolean
                if (key === 'borrowed') {
                    const list = (books || []).slice();
                    list.sort((a,b) => {
                        const va = a.borrowed ? 1 : 0; const vb = b.borrowed ? 1:0;
                        return current.dir==='asc' ? va - vb : vb - va;
                    });
                    // render directly
                    tbody.innerHTML = '';
                    list.forEach(book => { const tr = document.createElement('tr'); const status = book.borrowed ? `Issued to ${book.issuedTo}` : 'Available'; tr.innerHTML = `<td>${book.id}</td><td>${book.title}</td><td>${book.author}</td><td>${book.isbn}</td><td>${status}</td>`; tbody.appendChild(tr); });
                } else {
                    loadBooks(key, current.dir);
                }
            });
        });
    }

    // refresh button
    const refreshBtn = document.getElementById('refresh-books-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadBooks);
}

    // export CSV
    const exportBooksBtn = document.getElementById('export-books-btn');
    if (exportBooksBtn) exportBooksBtn.addEventListener('click', async () => {
        try {
            const list = await fetchBooksCached(true);
            if (!list || list.length === 0) { showToast('No books to export', true); return; }
            const rows = [['ID','Title','Author','ISBN','Borrowed','IssuedTo']];
            list.forEach(b => rows.push([b.id, b.title, b.author, b.isbn, b.borrowed? 'yes':'no', b.issuedTo || '']));
            const csv = rows.map(r => r.map(cell => '"'+String(cell||'').replace(/"/g,'""')+'"').join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'books_export.csv'; document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
            showToast('Books exported');
        } catch (err) {
            showToast('Export failed: '+err.message, true);
        }
    });


// ---------- VIEW MEMBERS PAGE ----------
function initViewMembersPage() {
    const membersTable = document.getElementById('members-table');
    if (!membersTable) return;

    const tbody = membersTable.querySelector('tbody');
    let members = [];

    // --------------------------
    // VIEW MEMBER DETAILS CLICK
    // --------------------------
    tbody.addEventListener('click', async (e) => {
        const btn = e.target.closest && e.target.closest('.view-member-btn');
        if (!btn) return;

        const id = btn.dataset.id;
        const mem = (members || []).find(m => String(m.id) === String(id));
        if (!mem) return;

        const booksList = await fetchBooksCached();

        const borrowed = (booksList || []).filter(b =>
            b.borrowed &&
            (String(b.issuedTo) === String(mem.id) ||
             String(b.issuedTo) === String(mem.name))
        );

        const html = `
            <div><strong>${mem.name}</strong> (ID: ${mem.id})</div>
            <div style="margin-top:8px"><strong>Address:</strong> ${mem.address || '—'}</div>
            <div style="margin-top:10px"><strong>Borrowed Books:</strong>
                ${borrowed.length
                    ? "<ul>" + borrowed.map(b => `<li>${b.title} — ${b.isbn || ''}</li>`).join("") + "</ul>"
                    : "<div>None</div>"
                }
            </div>
        `;

        await showInfoModal('Member Details', html);
    });

    // --------------------------
    // LOAD MEMBERS
    // --------------------------
    async function loadMembers(sortKey = null, sortDir = 'asc') {
        try {
            const refreshBtn = document.getElementById('refresh-members-btn');
            if (refreshBtn) refreshBtn.disabled = true;

            const list = await fetchMembersCached();
            members = list || [];

            const booksList = await fetchBooksCached();
            let rows = members.slice();

            // SORTING
            if (sortKey) {
                rows.sort((a, b) => {
                    let va = a[sortKey] ?? '';
                    let vb = b[sortKey] ?? '';

                    if (typeof va === 'string') va = va.toLowerCase();
                    if (typeof vb === 'string') vb = vb.toLowerCase();

                    if (va < vb) return sortDir === 'asc' ? -1 : 1;
                    if (va > vb) return sortDir === 'asc' ? 1 : -1;
                    return 0;
                });
            }

            tbody.innerHTML = "";

            if (!rows.length) {
                tbody.innerHTML = "<tr><td colspan='4'>No members found.</td></tr>";
                if (refreshBtn) refreshBtn.disabled = false;
                return;
            }

            rows.forEach(member => {
                const tr = document.createElement('tr');

                let borrowedTitles = [];

                // direct borrowed IDs
                const singleBorrowed = member.borrowedBookID || member.borrowedBookId;
                if (singleBorrowed) {
                    const f = (booksList || []).find(b => b.id === singleBorrowed);
                    if (f) borrowedTitles.push(f.title);
                }

                // arrays of borrowed books
                const arr = member.borrowed || member.borrowedBooks;
                if (Array.isArray(arr)) {
                    arr.forEach(id => {
                        const f = (booksList || []).find(b => b.id === id);
                        if (f) borrowedTitles.push(f.title);
                    });
                }

                // fallback: books issuedTo
                const fallback = (booksList || []).filter(b =>
                    b.borrowed &&
                    (String(b.issuedTo) === String(member.id) ||
                     String(b.issuedTo) === String(member.name))
                );

                fallback.forEach(b => {
                    if (!borrowedTitles.includes(b.title))
                        borrowedTitles.push(b.title);
                });

                const borrowedHtml =
                    borrowedTitles.length
                        ? borrowedTitles.map(t => `<div>${t}</div>`).join('')
                        : '';

                tr.innerHTML = `
                    <td>${member.id}</td>
                    <td>${member.name}</td>
                    <td>${member.address}</td>
                    <td>${borrowedHtml}</td>
                `;

                tr.classList.add('table-row-anim');
                tbody.appendChild(tr);

                requestAnimationFrame(() => tr.classList.add('in'));
            });

            if (refreshBtn) refreshBtn.disabled = false;

        } catch (err) {
            tbody.innerHTML = `<tr><td colspan='4'>Error: ${err.message}</td></tr>`;
            const refreshBtn = document.getElementById('refresh-members-btn');
            if (refreshBtn) refreshBtn.disabled = false;
        }
    }

    // INITIAL LOAD
    loadMembers();

    // --------------------------
    // SORTABLE HEADERS
    // --------------------------
    const headers = membersTable.querySelectorAll('th');
    if (headers.length >= 3) {
        const keyMap = ['id', 'name', 'address'];
        let current = { key: null, dir: 'asc' };

        headers.forEach((th, idx) => {
            th.style.cursor = 'pointer';

            const indicator = document.createElement('span');
            indicator.className = 'sort-ind';
            th.appendChild(indicator);

            th.addEventListener('click', () => {
                const key = keyMap[idx];
                if (!key) return;

                if (current.key === key) {
                    current.dir = current.dir === 'asc' ? 'desc' : 'asc';
                } else {
                    current.key = key;
                    current.dir = 'asc';
                }

                headers.forEach((h, i) => {
                    const si = h.querySelector('.sort-ind');
                    if (si) si.textContent =
                        i === idx ? (current.dir === 'asc' ? '▲' : '▼') : '';
                });

                loadMembers(current.key, current.dir);
            });
        });
    }

    // --------------------------
    // REFRESH BUTTON
    // --------------------------
    const refreshBtn = document.getElementById('refresh-members-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadMembers);

    // --------------------------
    // EXPORT CSV
    // --------------------------
    const exportMembersBtn = document.getElementById('export-members-btn');
    if (exportMembersBtn) exportMembersBtn.addEventListener('click', async () => {
        try {
            const list = await fetchMembersCached();
            if (!list || list.length === 0) {
                showToast('No members to export', true);
                return;
            }

            const booksList = await fetchBooksCached();

            // CSV Header
            let csv = 'ID,Name,Address,Borrowed Books\n';

            // CSV Rows
            list.forEach(m => {
                const borrowedTitles = [];
                const fallback = (booksList || []).filter(b =>
                    b.borrowed &&
                    (String(b.issuedTo) === String(m.id) ||
                     String(b.issuedTo) === String(m.name))
                );
                fallback.forEach(b => borrowedTitles.push(b.title));

                const id = String(m.id || '').replace(/"/g, '""');
                const name = String(m.name || '').replace(/"/g, '""');
                const address = String(m.address || '').replace(/"/g, '""');
                const borrowed = borrowedTitles.join('; ').replace(/"/g, '""');

                csv += `"${id}","${name}","${address}","${borrowed}"\n`;
            });

            // Download
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `members_export_${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('Members exported successfully!');
        } catch (err) {
            console.error('Export members error:', err);
            showToast('Failed to export members: ' + err.message, true);
        }
    });
}


// ---------- SEARCH BOOK PAGE ----------
function initSearchBookPage() {
    const searchBookBtnPage = document.getElementById('search-book-btn');
    if (!searchBookBtnPage) return;

    const resultDiv = document.getElementById('search-book-results');
    const input = document.getElementById('search-book-input');
    if (!input) return;

    const doSearch = async (query) => {
        if (!query || query.length < 1) {
            if (resultDiv) resultDiv.innerHTML = '';
            return;
        }
        try {
            const results = await window.api.searchBooks(query);
            if (resultDiv) resultDiv.innerHTML = "";
            
            if (!results || results.length === 0) {
                if (resultDiv) resultDiv.innerHTML = "<p>No results found.</p>";
                return;
            }
            
            results.forEach(b => {
                const div = document.createElement('div');
                div.style.cssText = 'border:1px solid #ddd; padding:12px; margin:10px 0; border-radius:5px; background:#f9f9f9;';
                div.innerHTML = `
                    <strong>📚 ${b.title}</strong><br>
                    Author: ${b.author}<br>
                    ISBN: ${b.isbn}<br>
                    <span style="color: ${b.borrowed ? 'red' : 'green'};">${b.borrowed ? '❌ Issued' : '✅ Available'}</span>
                `;
                if (resultDiv) resultDiv.appendChild(div);
            });
        } catch (err) {
            console.error('Search books error', err);
            showToast('Search failed: ' + err.message, true);
            if (resultDiv) resultDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
        }
    };

    const debouncedSearch = debounce((ev) => doSearch(ev.target.value.trim()), 220);
    input.addEventListener('input', debouncedSearch);
    // also search on button click or Enter key
    searchBookBtnPage.addEventListener('click', () => doSearch(input.value.trim()));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(input.value.trim()); });
}

// ---------- SEARCH MEMBER PAGE ----------
function initSearchMemberPage() {
    const searchMemberBtnPage = document.getElementById('search-member-btn');
    if (!searchMemberBtnPage) return;

    const resultDiv = document.getElementById('search-member-results');
    const input = document.getElementById('search-member-input');
    if (!input) return;

    const doMemberSearch = async (query) => {
        if (!query || query.length < 1) {
            if (resultDiv) resultDiv.innerHTML = '';
            return;
        }

        try {
            const result = await window.api.searchMember(query);
            if (resultDiv) resultDiv.innerHTML = "";

            if (!result || (Array.isArray(result) && result.length === 0)) {
                if (resultDiv) resultDiv.innerHTML = "<p style='color:#666;'>No member found.</p>";
                return;
            }

            // result may be a single object or an array of matches
            const items = Array.isArray(result) ? result : [result];
            const booksList = await fetchBooksCached();
            
            items.forEach((m) => {
                const div = document.createElement('div');
                div.style.cssText = 'border:1px solid #ddd; padding:12px; margin:10px 0; border-radius:5px; background:#f9f9f9;';
                const borrowed = (booksList || []).filter(b => b.borrowed && (String(b.issuedTo) === String(m.id) || String(b.issuedTo) === String(m.name))).map(b => b.title);
                div.innerHTML = `
                    <strong>👤 ${m.name}</strong> ${borrowed.length?'<span style="font-size:12px;color:#666">• '+borrowed.join(', ')+'</span>':''}<br>
                    Member ID: ${m.id}<br>
                    Address: ${m.address}
                `;
                if (resultDiv) resultDiv.appendChild(div);
            });
        } catch (err) {
            console.error('Search member error', err);
            if (resultDiv) resultDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
            showToast('Member search failed: ' + err.message, true);
        }
    };

    const debouncedMember = debounce((ev) => doMemberSearch(ev.target.value.trim()), 220);
    input.addEventListener('input', debouncedMember);
    searchMemberBtnPage.addEventListener('click', () => doMemberSearch(input.value.trim()));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doMemberSearch(input.value.trim()); });
}

// ---------- ISSUE BOOK PAGE ----------
function initIssueBookPage() {
    const issueBookSubmit = document.getElementById('issue-book-btn');
    if (!issueBookSubmit) return;

    const msgDiv = document.getElementById('issuebook-message');

        issueBookSubmit.addEventListener('click', async () => {
            const bookID = parseInt(document.getElementById('issue-book-id').value);
            const memberID = parseInt(document.getElementById('issue-member-id').value);

            if (!bookID || !memberID) {
                if (msgDiv) { msgDiv.style.color = "red"; msgDiv.textContent = "Please enter both Book ID and Member ID."; }
                return;
            }

            // show modal confirm
            const ok = await showConfirmModal('Confirm issue', `Issue book ${bookID} to member ${memberID}?`);
            if (!ok) return;

            try {
                issueBookSubmit.disabled = true;
                const res = await window.api.issueBook(bookID, memberID);
                console.log('[UI] issueBook result ->', res);
                if (msgDiv) { msgDiv.style.color = "green"; msgDiv.textContent = `✅ Book issued to member successfully.`; }
                showToast('Book issued');
                document.getElementById('issue-book-id').value = "";
                document.getElementById('issue-member-id').value = "";
                issueBookSubmit.disabled = false;
            } catch (err) {
                issueBookSubmit.disabled = false;
                console.error('Issue book error', err);
                if (msgDiv) { msgDiv.style.color = "red"; msgDiv.textContent = `❌ Error: ${err.message}`; }
                showToast('Issue failed: ' + err.message, true);
            }
    });
}

// ---------- RETURN BOOK PAGE ----------
function initReturnBookPage() {
    const returnBookSubmit = document.getElementById('return-book-btn');
    if (!returnBookSubmit) return;

    const msgDiv = document.getElementById('returnbook-message');

    returnBookSubmit.addEventListener('click', async () => {
        const memberID = parseInt(document.getElementById('return-member-id').value);
        const bookID = parseInt(document.getElementById('return-book-id').value);

        if (!memberID || !bookID) {
            if (msgDiv) { msgDiv.style.color = "red"; msgDiv.textContent = "Please enter Member ID and Book ID."; }
            return;
        }
        // confirm with modal
        const ok = await showConfirmModal('Confirm return', `Return book ${bookID} from member ${memberID}?`);
        if (!ok) return;

        try {
            console.log('[UI] returnBook ->', { bookID, memberID });
            returnBookSubmit.disabled = true;
            const res = await window.api.returnBook(bookID, memberID);
            console.log('[UI] returnBook result ->', res);
            if (msgDiv) { msgDiv.style.color = "green"; msgDiv.textContent = `✅ Book returned successfully.`; }
            showToast('Book returned successfully');
            document.getElementById('return-member-id').value = "";
            document.getElementById('return-book-id').value = "";
            returnBookSubmit.disabled = false;
        } catch (err) {
            returnBookSubmit.disabled = false;
            console.error('Return book error', err);
            if (msgDiv) { msgDiv.style.color = "red"; msgDiv.textContent = `❌ Error: ${err.message}`; }
            showToast('Return failed: ' + err.message, true);
        }
    });
}

// ---------- BORROWED BOOKS PAGE ----------
function initBorrowedBooksPage() {
    const borrowedBooksTable = document.getElementById('borrowed-books-table');
    if (!borrowedBooksTable) return;

    const tbody = borrowedBooksTable.querySelector('tbody');
    async function loadBorrowed() {
        try {
            const btn = document.getElementById('refresh-borrowed-btn'); if (btn) btn.disabled = true;
            const list = await fetchBooksCached();
            books = list || [];
            tbody.innerHTML = "";
            const borrowedBooks = books.filter(b => b.borrowed);
            if (borrowedBooks.length === 0) {
                tbody.innerHTML = "<tr><td colspan='5'>No borrowed books.</td></tr>";
                if (btn) btn.disabled = false;
                return;
            }

            borrowedBooks.forEach(book => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${book.id}</td>
                    <td>${book.title}</td>
                    <td>${book.author}</td>
                    <td>${book.isbn}</td>
                    <td>${book.issuedTo}</td>
                `;
                tr.classList.add('table-row-anim');
                tbody.appendChild(tr);
                requestAnimationFrame(() => { tr.classList.add('in'); });
            });
            if (btn) btn.disabled = false;
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan='5'>Error: ${err.message}</td></tr>`;
            const btn = document.getElementById('refresh-borrowed-btn'); if (btn) btn.disabled = false;
        }
    }

    // initial load
    loadBorrowed();

    // refresh button
    const refreshBtn = document.getElementById('refresh-borrowed-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadBorrowed);

    // sortable headers for borrowed table
    const bths = borrowedBooksTable.querySelectorAll('th');
    if (bths && bths.length >= 5) {
        const keyMap = ['id','title','author','isbn','issuedTo'];
        let current = { key: null, dir: 'asc' };
        bths.forEach((th, idx) => {
            th.style.cursor = 'pointer';
            const indicator = document.createElement('span'); indicator.className = 'sort-ind'; th.appendChild(indicator);
            th.addEventListener('click', () => {
                const key = keyMap[idx] || null; if (!key) return;
                if (current.key === key) current.dir = current.dir === 'asc' ? 'desc' : 'asc'; else { current.key = key; current.dir = 'asc'; }
                bths.forEach((h,i) => { const si = h.querySelector('.sort-ind'); if (si) si.textContent = (i===idx? (current.dir==='asc'?'▲':'▼') : ''); });
                // sort and render
                const list = (books || []).filter(b => b.borrowed).slice();
                list.sort((a,b) => {
                    let va = a[key] || ''; let vb = b[key] || '';
                    if (typeof va === 'string') va = va.toLowerCase(); if (typeof vb === 'string') vb = vb.toLowerCase();
                    if (va < vb) return current.dir === 'asc' ? -1 : 1;
                    if (va > vb) return current.dir === 'asc' ? 1 : -1;
                    return 0;
                });
                tbody.innerHTML = '';
                list.forEach(book => { const tr = document.createElement('tr'); tr.innerHTML = `\n                    <td>${book.id}</td>\n                    <td>${book.title}</td>\n                    <td>${book.author}</td>\n                    <td>${book.isbn}</td>\n                    <td>${book.issuedTo}</td>\n                `; tbody.appendChild(tr); });
            });
        });
    }
}

// ---------- KEYBOARD SHORTCUTS ----------
function setupKeyboardShortcuts() {
    console.log('Keyboard shortcuts initialized');
    document.addEventListener('keydown', (e) => {
        // ESC to close modals
        if (e.key === 'Escape') {
            const confirmModal = document.querySelector('.confirm-backdrop');
            if (confirmModal) {
                confirmModal.click();
                return;
            }
            const infoModal = document.querySelector('.info-backdrop');
            if (infoModal) {
                infoModal.click();
                return;
            }
        }

        // Ctrl+K - Focus Quick Search (dashboard) or navigate to dashboard
        if (e.ctrlKey && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            const qaInput = document.getElementById('quick-search-input');
            if (qaInput) {
                qaInput.focus();
                qaInput.select();
            } else {
                // Navigate to dashboard if not there
                window.location.href = 'dashboard.html';
            }
            return;
        }

        // Ctrl+M - Focus Member Search or navigate to search member page
        if (e.ctrlKey && (e.key === 'm' || e.key === 'M')) {
            e.preventDefault();
            const memberInput = document.getElementById('search-member-input');
            if (memberInput) {
                memberInput.focus();
                memberInput.select();
            } else {
                // Navigate to search member page
                window.location.href = 'searchmember.html';
            }
            return;
        }

        // Ctrl+B - Focus Book Search or navigate to search book page
        if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) {
            e.preventDefault();
            const bookInput = document.getElementById('search-book-input');
            if (bookInput) {
                bookInput.focus();
                bookInput.select();
            } else {
                // Navigate to search book page
                window.location.href = 'searchbook.html';
            }
            return;
        }
    });
}
