#include "book.h"
#include <iostream>

#include "library.h"
#include "member.h"

int book::nextID=1000;

std::string book::genretoString(Genre genre)
{
    switch (genre)
    {
        case Genre::fiction:
            return "fiction";
        case Genre::nonfiction:
            return "nonfiction";
        case Genre::mystery:
            return "mystery";
        case Genre::adventure:
            return "adventure";
        case Genre::romance:
            return "romance";
        case Genre::science:
            return "science";
        case Genre::history:
            return "history";
        case Genre::fantasy:
            return "fantasy";
        default:
            return "unknown";
    }
}

Genre book::stringtoGenre(std::string genreString)
{
    for (char &c : genreString) c = static_cast<char>(std::tolower(c));

    if (genreString=="fiction") return Genre::fiction;
    if (genreString=="nonfiction") return Genre::nonfiction;
    if (genreString=="mystery") return Genre::mystery;
    if (genreString=="adventure") return Genre::adventure;
    if (genreString=="romance") return Genre::romance;
    if (genreString=="science") return Genre::science;
    if (genreString=="history") return Genre::history;
    if (genreString=="fantasy") return Genre::fantasy;
    else
        return Genre::unknown;
}

book::book(const std::string& title, const std::string& ISBN, const std::string& author,
           Genre genre, int issuedTo)
    : title(title), author(author), ISBN(ISBN),
      genre(genre), // Convert string to enum
      borrowStatus(false), issuedTo(issuedTo)
{
    this->ID = book::nextID++;
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
Genre book::getGenre() const
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
int book::getIssuedTo() const {
    return this->issuedTo;
}