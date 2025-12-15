#pragma once

#include "external/sqlite/sqlite3.h"
#include "book.h"
#include "member.h"
#include <iostream>

void openDatabase(sqlite3*& db, const std::string& dbPath);

void createBooksTable(sqlite3* db);

void createMembersTable(sqlite3* db);

// Inserts and returns the new row ID (auto-incremented)
int insertBook(sqlite3* db, const book& b);

// Inserts member and returns new row ID
int insertMember(sqlite3* db, const member& m);

// Update a member's borrowed book id
void updateMemberBorrow(sqlite3* db, int memberID, int borrowedBookID);

void updateBookStatus(sqlite3* db, const book& b);

void loadBooks(sqlite3* db, std::vector<book>& books);

void loadMembers(sqlite3* db, std::vector<member>& members);

void deleteBook(sqlite3* db, int bookID);

void deleteMember(sqlite3* db, int memberID);

void closeDatabase(sqlite3* db);