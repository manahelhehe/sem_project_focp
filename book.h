#pragma once

#include <string>
enum class Genre {
    fiction,
    nonfiction,
    fantasy,
    mystery,
    adventure,
    romance,
    science,
    history,
    unknown
};
class book
{
    private:

    int ID;
    std::string title;
    std::string ISBN;
    std::string author;

    Genre genre;

    bool borrowStatus;
    int issuedTo;
    
    // For auto-assigning book IDs (?)
    static int nextID;

    public:
    // Book Constructor
    book (const std::string& title, const std::string& ISBN, const std::string& author, Genre genre, int issuedTo);
    void setID(int id);

    // Data Fetchers:
    int getID() const;
    std::string getTitle() const;
    std::string getAuthor() const;
    std::string getISBN() const;
    Genre getGenre() const;
    bool getBorrowStatus() const;
    int getIssuedTo() const;

    void modifyBorrowStatus(bool status);
    void setIssuedTo(int memberID);

    static Genre stringtoGenre(std::string genreString);
    static std::string genretoString(Genre genre);
};
