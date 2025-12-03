#include "member.h"
#include <iostream>
#include <vector>
#include <algorithm>

int member:: nextID=1000;

member::member(const std::string& name, const std::string& address):
    name(name), address(address)
{
    this -> ID = member::nextID++;
}

int member::getID() const
{
    return this -> ID;
}

std::string member::getName() const
{
    return this -> name;
}

std::string member::getAddress() const
{
    return this -> address;
}

std::vector<int> member::getBorrowedIDs() const
{
    return this -> BorrowedBookIDs;
}

void member::borrowBook(int bookID) 
{
    BorrowedBookIDs.push_back(bookID);
}

void member::returnBook(int bookID) 
{
    auto new_end = std::remove(BorrowedBookIDs.begin(), BorrowedBookIDs.end(), bookID);
    BorrowedBookIDs.erase(new_end, BorrowedBookIDs.end());
}
