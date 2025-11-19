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

    // Storing IDs of Borrowed Books
    std::vector<int> BorrowedBookIDs;
    // Auto-Assigning Member IDs (?)
    static int nextID;

    public:
    // Member Constructor
    member(const std::string& name, const std::string& address);

    // Data Fetchers
    int getID() const;
    std::string getName() const;
    std::string getAddress() const;
    std::vector<int> getBorrowedIDs() const;

    // Borrowing Books
    void borrowBook(int bookID) const;
    void returnBook (int bookID) const;
};