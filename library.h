#pragma once

#include <string>
#include <vector>

#include "book.h"
#include "member.h"
#include "database.h"
#include "external/sqlite/sqlite3.h"

class library
{
    private:

    std::vector<book> books;
    std::vector<member> members;
    sqlite3* db = nullptr;

    // Object-Pointer Return-Type (?)

    public:

    book* findBook(int bookID);
    member* findMember(int memberID);
    const member* findMember(int memberID) const;


    // constructor / destructor to manage DB
    library();
    ~library();

    // Transaction Functions: 

    bool checkOutBook(int bookID, int memberID);
    bool returnBook(int bookID, int memberID);

    // Adding Functions: 

    void addBook(const std::string& title, const std::string& ISBN, const std::string& author, const std::string& genre);
    void addMember(const std::string& name, const std::string& address, int BorrowedBookID = 0);

    // Deleting Functions:

    void deleteBook(int bookID);
    void deleteMember(int memberID);

    // Searching Functions:
    std::vector<const book*> searchBook(const std::string& query) const;
    std::vector <const member*> searchMember(const std::string& query) const;

    // Displaying Functions: 

    void displayBooks() const;
    void displayMembers() const;
    void displayBorrowedBooks(int memberID) const;

    // Getting Functions:

    const std::vector<book>& getBooks() const;
    const std::vector<member>& getMembers() const;

    void clearData();

};