#pragma once

#include <string>
#include <vector>

#include "book.h"
#include "member.h"

class library
{
    private:

    std::vector<book> books;
    std::vector<member> members;

    // Object-Pointer Return-Type (?)
    book* findBook(int bookID);
    member* findMember(int memberID);

    public:

    // Transaction Functions: 

    bool checkOutBook(int bookID, int memberID);
    bool returnBook(int bookID, int memberID);

    // Adding Functions: 

    void addBook(const std::string& title, const std::string& ISBN, const std::string& author);
    void addMember(const std::string& name, const std::string& address);

    // Searching Functions:
    std::vector<book*> searchBook(const std::string& query) const;
    member* searchMember(int memberID) const;

    // Displaying Functions: 

    void displayBooks() const;
    void displayMembers() const;
    void displayBorrowedBooks(int memberID) const;

    // Getting Functions:

    const std::vector<book>& getBooks() const;
    const std::vector<member>& getMembers() const;

    void clearData();

};