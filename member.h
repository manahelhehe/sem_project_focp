#pragma once

#include <string>
#include <vector>
#include <chrono>

class member
{
    private:

    int ID;
    std::string name;
    std::string address;

    int BorrowedBookID;

    // Auto-Assigning Member IDs (?)
    static int nextID;

    public:
    // Member Constructor
    member(const std::string& name, const std::string& address, int BorrowedBookID = 0);

    // Data Fetchers
    int getID() const;
    std::string getName() const;
    std::string getAddress() const;
    int getBorrowedBookID() const;

    // Borrowing Books
    void borrowBook(int bookID);
    void returnBook (int bookID);
};