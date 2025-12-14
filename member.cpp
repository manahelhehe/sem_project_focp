#include "member.h"
#include <iostream>
#include <vector>
#include <algorithm>

int member:: nextID=1000;

member::member(const std::string& name, const std::string& address, int BorrowedBookID):
    name(name), address(address), BorrowedBookID(BorrowedBookID)
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

int member::getBorrowedBookID() const
{
    return this -> BorrowedBookID;
}

void member::borrowBook(int bookID) 
{
    BorrowedBookID = bookID;
}

void member::returnBook(int bookID) 
{
    BorrowedBookID = 0;
}

void member::setID(int id)
{
    ID = id;
}