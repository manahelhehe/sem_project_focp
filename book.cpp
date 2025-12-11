#include "book.h"
#include <iostream>

int book::nextID=1000;

book::book(const std::string& title, const std::string& ISBN, const std::string& author, int issuedTo):
    title(title), author(author), ISBN(ISBN), borrowStatus(false), issuedTo(issuedTo)
{
    this -> ID = book::nextID++;
}

int book::getID() const
{
    return this -> ID;
}
std::string book::getTitle() const
{
    return this-> title;
}
std::string book::getAuthor() const
{
    return this-> author;
}
std::string book::getISBN() const
{
    return this-> ISBN;
}
bool book::getBorrowStatus() const
{
    return this->borrowStatus;
}
void book::setIssuedTo(int memberID) 
{
    this->issuedTo=memberID;
}
void book::modifyBorrowStatus(bool status) 
{
    this->borrowStatus = status;
}

int book::getIssuedTo() const
{
    return this->issuedTo;
}

