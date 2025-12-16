#include "book.h"
#include <iostream>

#include "member.h"

int book::nextID=1000;

book::book(const std::string& title, const std::string& ISBN, const std::string& author,
            const std::string& genre, int issuedTo):
    title(title), author(author), ISBN(ISBN), genre(genre),
    borrowStatus(false), issuedTo(issuedTo)
{
    this -> ID = book::nextID++;
}

void book::setID(int id) {
    ID = id;
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
std::string book::getGenre() const
{
    return this-> genre;
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