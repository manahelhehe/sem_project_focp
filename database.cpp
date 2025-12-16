#include "external/sqlite/sqlite3.h"
#include "book.h"
#include "member.h"
#include "database.h"
#include <iostream>

void createBooksTable(sqlite3* db)
{
    const char* sql =
        "CREATE TABLE IF NOT EXISTS books ("
        "id INTEGER PRIMARY KEY, "
        "title TEXT NOT NULL, "
        "author TEXT NOT NULL, "
        "ISBN TEXT NOT NULL, "
        "genre TEXT NOT NULL, "
        "cover_url TEXT, "
        "borrowStatus INTEGER NOT NULL DEFAULT 0, "
        "issuedTo INTEGER NOT NULL DEFAULT 0"
        ");";

    char* errMsg = nullptr;
    int rc = sqlite3_exec(db, sql, nullptr, nullptr, &errMsg);

    if (rc != SQLITE_OK)
    {
        std::cerr << "Error creating books table: " << errMsg << std::endl;
        sqlite3_free(errMsg);
    }
}

void createMembersTable(sqlite3* db)
{
    const char* sql =
        "CREATE TABLE IF NOT EXISTS members ("
        "id INTEGER PRIMARY KEY, "
        "name TEXT NOT NULL, "
        "address TEXT NOT NULL, "
        "BorrowedBookID INTEGER NOT NULL"
        ");";

    char* errMsg = nullptr;
    int rc = sqlite3_exec(db, sql, nullptr, nullptr, &errMsg);

    if (rc != SQLITE_OK)
    {
        std::cerr << "Error creating members table: " << errMsg << std::endl;
        sqlite3_free(errMsg);
    }
}

void openDatabase(sqlite3* &db, const std::string& dbPath) {

    int rc = sqlite3_open(dbPath.c_str(), &db);
    if(rc) {
        std::cerr << "Can't open database: " << sqlite3_errmsg(db) << std::endl;
    } else {
        // Successful open - avoid printing to stdout to keep CLI protocol clean
        std::cerr << "Database opened successfully (stderr)." << std::endl;
    }
}

int insertBook(sqlite3* db, const book& b) {

    const char* sql =
        "INSERT INTO books (title, author, ISBN, genre, cover_url) "
        "VALUES (?, ?, ?, ?, ?);";

    sqlite3_stmt* stmt = nullptr;

    sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr);

    sqlite3_bind_text(stmt, 1, b.getTitle().c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, b.getAuthor().c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, b.getISBN().c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, book::genretoString(b.getGenre()).c_str(), -1 , SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 5, b.getCoverUrl().c_str(), -1, SQLITE_TRANSIENT);

    if (sqlite3_step(stmt) != SQLITE_DONE)
    {
        std::cerr << "Failed to insert book.\n";
        sqlite3_finalize(stmt);
        return -1;
    }

    sqlite3_finalize(stmt);

    // get last insert id
    int lastId = (int)sqlite3_last_insert_rowid(db);
    return lastId;

}

int insertMember(sqlite3* db, const member& m) {
    const char* sql =
        "INSERT INTO members (name, address, BorrowedBookID) "
        "VALUES (?, ?, ?);";

    sqlite3_stmt* stmt = nullptr;

    sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr);

    sqlite3_bind_text(stmt, 1, m.getName().c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, m.getAddress().c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 3, m.getBorrowedBookID()); // BorrowedBookID

    if (sqlite3_step(stmt) != SQLITE_DONE)
    {
        std::cerr << "Failed to insert member.\n";
        sqlite3_finalize(stmt);
        return -1;
    }

    sqlite3_finalize(stmt);

    return (int)sqlite3_last_insert_rowid(db);
}

void updateMemberBorrow(sqlite3* db, int memberID, int borrowedBookID) {
    const char* sql = "UPDATE members SET BorrowedBookID = ? WHERE id = ?;";
    sqlite3_stmt* stmt = nullptr;
    sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr);
    sqlite3_bind_int(stmt, 1, borrowedBookID);
    sqlite3_bind_int(stmt, 2, memberID);
    if (sqlite3_step(stmt) != SQLITE_DONE) {
        std::cerr << "Failed to update member borrowed book.\n";
    }
    sqlite3_finalize(stmt);
}

void updateBookStatus(sqlite3* db, const book& b) {
    const char* sql =
            "UPDATE books SET borrowStatus = ?, issuedTo = ? WHERE id = ?;";

    sqlite3_stmt* stmt = nullptr;

    sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr);

    sqlite3_bind_int(stmt, 1, b.getBorrowStatus() ? 1 : 0); // borrowStatus
    sqlite3_bind_int(stmt, 2, b.getIssuedTo());             // issuedTo
    sqlite3_bind_int(stmt, 3, b.getID());                   // WHERE id = ?

    if (sqlite3_step(stmt) != SQLITE_DONE)
    {
        std::cerr << "Failed to update book status.\n";
    }

    sqlite3_finalize(stmt);
}

void loadBooks(sqlite3* db, std::vector<book>& books) {
    const char* sql = "SELECT id, title, author, ISBN, genre, cover_url, borrowStatus, issuedTo FROM books;";

    sqlite3_stmt* stmt = nullptr;
    sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr);

    while (sqlite3_step(stmt) == SQLITE_ROW)
    {
        int id = sqlite3_column_int(stmt, 0);
        std::string title = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
        std::string author = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
        std::string isbn = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
        std::string genreStr = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
        const char* coverUrlPtr = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 5));
        std::string coverUrl = coverUrlPtr ? coverUrlPtr : "";
        int borrowStatus = sqlite3_column_int(stmt, 6);
        int issuedTo = sqlite3_column_int(stmt, 7);

        Genre genre = book::stringtoGenre(genreStr);

        book b(title, isbn, author, genre, issuedTo);
        b.modifyBorrowStatus(borrowStatus == 1);
        b.setCoverUrl(coverUrl);

        // Force restore ID
        b.setID(id);// sets private ID directly

        books.push_back(b);
    }

    sqlite3_finalize(stmt);
}

void loadMembers(sqlite3* db, std::vector<member>& members) {
    const char* sql = "SELECT id, name, address, BorrowedBookID FROM members;";

    sqlite3_stmt* stmt = nullptr;
    sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr);

    while (sqlite3_step(stmt) == SQLITE_ROW)
    {
        int id = sqlite3_column_int(stmt, 0);
        std::string name = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
        std::string address = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
        int borrowedID = sqlite3_column_int(stmt, 3);


        member m(name, address, borrowedID);

        // Restore ID
        m.setID(id);

        members.push_back(m);
    }

    sqlite3_finalize(stmt);
}

void deleteBook(sqlite3* db, int bookID) {
    const char* sql = "DELETE FROM books WHERE id = ?;";
    sqlite3_stmt* stmt = nullptr;
    sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr);
    sqlite3_bind_int(stmt, 1, bookID);
    
    if (sqlite3_step(stmt) != SQLITE_DONE) {
        std::cerr << "Failed to delete book.\n";
    }
    
    sqlite3_finalize(stmt);
}

void deleteMember(sqlite3* db, int memberID) {
    const char* sql = "DELETE FROM members WHERE id = ?;";
    sqlite3_stmt* stmt = nullptr;
    sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr);
    sqlite3_bind_int(stmt, 1, memberID);
    
    if (sqlite3_step(stmt) != SQLITE_DONE) {
        std::cerr << "Failed to delete member.\n";
    }
    
    sqlite3_finalize(stmt);
}

// User authentication functions
void createUsersTable(sqlite3* db) {
    const char* sql = "CREATE TABLE IF NOT EXISTS users ("
                      "id INTEGER PRIMARY KEY AUTOINCREMENT,"
                      "username TEXT UNIQUE NOT NULL,"
                      "passwordHash TEXT NOT NULL);";
    char* errMsg = nullptr;
    int rc = sqlite3_exec(db, sql, nullptr, nullptr, &errMsg);
    if (rc != SQLITE_OK) {
        std::cerr << "Failed to create users table: " << errMsg << std::endl;
        sqlite3_free(errMsg);
    }
}

bool insertUser(sqlite3* db, const std::string& username, const std::string& password) {
    // Simple password hashing (in production, use bcrypt or similar)
    std::string passwordHash = password; // For now, just store as-is (upgrade to proper hashing later)
    
    const char* sql = "INSERT INTO users (username, passwordHash) VALUES (?, ?);";
    sqlite3_stmt* stmt = nullptr;
    
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        std::cerr << "Failed to prepare insert user statement.\n";
        return false;
    }
    
    sqlite3_bind_text(stmt, 1, username.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, passwordHash.c_str(), -1, SQLITE_TRANSIENT);
    
    bool success = (sqlite3_step(stmt) == SQLITE_DONE);
    sqlite3_finalize(stmt);
    
    return success;
}

bool authenticateUser(sqlite3* db, const std::string& username, const std::string& password) {
    const char* sql = "SELECT passwordHash FROM users WHERE username = ?;";
    sqlite3_stmt* stmt = nullptr;
    
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return false;
    }
    
    sqlite3_bind_text(stmt, 1, username.c_str(), -1, SQLITE_TRANSIENT);
    
    bool authenticated = false;
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        const char* storedHash = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 0));
        if (storedHash && password == storedHash) {
            authenticated = true;
        }
    }
    
    sqlite3_finalize(stmt);
    return authenticated;
}

bool userExists(sqlite3* db, const std::string& username) {
    const char* sql = "SELECT COUNT(*) FROM users WHERE username = ?;";
    sqlite3_stmt* stmt = nullptr;
    
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return false;
    }
    
    sqlite3_bind_text(stmt, 1, username.c_str(), -1, SQLITE_TRANSIENT);
    
    bool exists = false;
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        exists = (sqlite3_column_int(stmt, 0) > 0);
    }
    
    sqlite3_finalize(stmt);
    return exists;
}

void closeDatabase(sqlite3* db) {
    if (db)
        sqlite3_close(db);
}

