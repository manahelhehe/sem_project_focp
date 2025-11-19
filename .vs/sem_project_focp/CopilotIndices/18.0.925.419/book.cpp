#include "book.h"
#include <iostream>

int book::nextID=1000;

book::book(const std::string& title, const std::string& ISBN, const std::string& author):
    title(title), author(author), ISBN(ISBN), borrowStatus(false)
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

void book::modifyBorrowStatus(bool status) 
{
    this->borrowStatus = status;
}

