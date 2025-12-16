#include "library.h"
#include <iostream>
#include <algorithm>
#include <cctype>
#include "database.h"
#include "external/sqlite/sqlite3.h"

static const char* DB_PATH = "lms.db";

auto toLower = [](const std::string& s)
{
    std::string result = s;
    std::transform(result.begin(), result.end(), result.begin(),
                   [](unsigned char c) { return static_cast<char>(std::tolower(c)); });
    return result;
};
// PRIVATE HELPER: find a book by ID
book* library::findBook(int bookID)
{
    for (auto& b : books)       // Range-Based for loop for fetching every book stored in the books vector
    {
        if (b.getID() == bookID)    // If the ID of b = the ID in the query, address of b will be returned
            return &b;
    }
    return nullptr;
}

// PRIVATE HELPER: find a member by ID
member* library::findMember(int memberID) // Range-Based for loop for fetching every book stored in the books vector
{
    for (auto& m : members)
    {
        if (m.getID() == memberID)   // If the ID of b = the ID in the query, address of b will be returned
            return &m;
    }
    return nullptr;
}
const member* library::findMember(int memberID) const// Range-Based for loop for fetching every book stored in the books vector
{
    for (auto& m : members)
    {
        if (m.getID() == memberID)   // If the ID of b = the ID in the query, address of b will be returned
            return &m;
    }
    return nullptr;
}


// PUBLIC: check out a book
bool library::checkOutBook(int bookID, int memberID)
{
    book* b = findBook(bookID);
    member* m = findMember(memberID);

    if (!b || !m)
        return false;  // not found

    if (b->getBorrowStatus())      // b is a pointer storing address of the book, "->" is used to access members of an object
        return false;  // book already borrowed

    // mark as borrowed
    b->modifyBorrowStatus(true);
    b->setIssuedTo(memberID);
    m->borrowBook(bookID);
    // persist changes
    updateBookStatus(db, *b);
    updateMemberBorrow(db, memberID, bookID);
    return true;
}

// PUBLIC: return a book
bool library::returnBook(int bookID, int memberID)
{
    book* b = findBook(bookID);
    member* m = findMember(memberID);

    if (!b || !m)
        return false;  // missing

    if (!b->getBorrowStatus())
        return false; // book is not borrowed
    if (b->getIssuedTo()==0)
        return false; // book isn't borrowed

    // mark as returned
    b->modifyBorrowStatus(false);
    m->returnBook(bookID);
    b->setIssuedTo(0);

    // persist changes
    updateBookStatus(db, *b);
    updateMemberBorrow(db, memberID, 0);
    return true;
}

// PUBLIC: add a new book
void library::addBook(const std::string& title, const std::string& ISBN, const std::string& author,
                        const std::string& genre)
{
    // create book object (issuedTo = 0)
    book b(title, ISBN, author, genre, 0);
    // insert into DB and get assigned ID
    int newId = insertBook(db, b);
    if (newId > 0) {
        // force set id on object then push
        b.setID(newId);
    }
    books.push_back(b);
}

// PUBLIC: add a new member
void library::addMember(const std::string& name, const std::string& address, int BorrowedBookID /*= 0*/)
{
    member m(name, address, BorrowedBookID);
    int newId = insertMember(db, m);
    if (newId > 0) {
        m.setID(newId);
    }
    members.push_back(m);
}

// PUBLIC: delete a book
void library::deleteBook(int bookID)
{
    // Remove from in-memory vector
    auto it = std::find_if(books.begin(), books.end(),
                          [bookID](const book& b) { return b.getID() == bookID; });
    if (it != books.end()) {
        books.erase(it);
    }
    
    // Delete from database
    ::deleteBook(db, bookID);
}

// PUBLIC: delete a member
void library::deleteMember(int memberID)
{
    // Remove from in-memory vector
    auto it = std::find_if(members.begin(), members.end(),
                          [memberID](const member& m) { return m.getID() == memberID; });
    if (it != members.end()) {
        members.erase(it);
    }
    
    // Delete from database
    ::deleteMember(db, memberID);
}

// PUBLIC: search books by title or author
std::vector<const book*> library::searchBook(const std::string& query) const
{
    std::vector<const book*> results;

    std::string lowerQuery = toLower(query);

    for (const auto& b : books)
    {
        std::string title = toLower(b.getTitle()), author = toLower(b.getAuthor()), ISBN = toLower(b.getISBN());
        if (title.find(lowerQuery) != std::string::npos ||
            author.find(lowerQuery) != std::string::npos ||
            ISBN.find(lowerQuery) != std::string::npos)
        {
            results.push_back(&b);
        }
    }
    return results;
}

// PUBLIC: search for a member by ID
std::vector <const member*> library::searchMember(const std::string& query) const
{
    std::string lowerQuery = toLower(query);
    std::vector<const member*> results;

    for (const auto& m : members)
    {
        std::string name = toLower(m.getName()), address = toLower(m.getAddress());
        if (name.find(lowerQuery) != std::string::npos ||
            address.find(lowerQuery) != std::string::npos)
        {
            results.push_back(&m);
        }
    }
    return results;
}

// PUBLIC: display all books
void library::displayBooks() const
{
    for (const auto& b : books)
    {
        std::cout << "ID: " << b.getID()
                  << ", Title: " << b.getTitle()
                  << ", Author: " << b.getAuthor()
                  << ", ISBN: " << b.getISBN()
                  << ", Genre: " << b.getGenre()
                  << ", Borrowed: " << (b.getBorrowStatus() ? "Yes" : "No")
                  << std::endl;
    }
}

// PUBLIC: display all members
void library::displayMembers() const
{
    for (const auto& m : members)
    {
        std::cout << "ID: " << m.getID()
                  << ", Name: " << m.getName()
                  << ", Address: " << m.getAddress()
                  << std::endl;
    }
}

// PUBLIC: display books borrowed by a specific member
void library::displayBorrowedBooks(int memberID) const
 {
    const member* m = findMember(memberID);
    if (!m)
    {
        std::cout << "Member not found.\n";
        return;
    }

    int borrowed = m->getBorrowedBookID();

    std::cout << "Borrowed books for member " << m->getName() << ":\n";

    if (borrowed == 0)
    {
        std::cout << "(none)\n";
        return;
    }

    const book* b = nullptr;
    for (const auto& bk : books)
    {
        if (bk.getID() == borrowed)
        {
            b = &bk;
            break;
        }
    }

    if (b)
    {
        std::cout << "ID: " << b->getID()
                  << ", Title: " << b->getTitle()
                  << ", Author: " << b->getAuthor()
                  << std::endl;
    }
}

const std::vector<book>& library::getBooks() const 
{ 
    return books; // Return the books vector
}
const std::vector<member>& library::getMembers() const 
{ 
    return members; // Return the members vector
}

void library::clearData()
{
    books.clear();
    members.clear();
}

// Constructor: open DB and load data
library::library() {
    openDatabase(db, DB_PATH);
    createBooksTable(db);
    createMembersTable(db);
    loadBooks(db, books);
    loadMembers(db, members);
}

// Destructor: close DB
library::~library() {
    closeDatabase(db);
}