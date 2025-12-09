#include "external/sqlite/sqlite3.h"
#include "book.h"
#include "member.h"
#include "database.h"
#include <iostream>

void openDatabase(sqlite3* &db, const std::string& dbPath) {

}

void createBooksTable(sqlite3* db);

void createMembersTable(sqlite3* db);

void insertBook(sqlite3* db, const book& b);

void insertMember(sqlite3* db, const member& m);

void updateBookStatus(sqlite3* db, const book& b);

void loadBooks(sqlite3* db, std::vector<book>& books);

void loadMembers(sqlite3* db, std::vector<member>& members);

void closeDatabase(sqlite3* db);

