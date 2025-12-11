#include "library.h"
#include <iostream>
#include "database.h"
#include "external/sqlite/sqlite3.h"

static const char* DB_PATH = "lms.db";

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
void library::addBook(const std::string& title, const std::string& ISBN, const std::string& author)
{
    // create book object (issuedTo = 0)
    book b(title, ISBN, author, 0);
    // insert into DB and get assigned ID
    int newId = insertBook(db, b);
    if (newId > 0) {
        // force set id on object then push
        *(int*)&b = newId;
    }
    books.push_back(b);
}

// PUBLIC: add a new member
void library::addMember(const std::string& name, const std::string& address, int BorrowedBookID /*= 0*/)
{
    member m(name, address, BorrowedBookID);
    int newId = insertMember(db, m);
    if (newId > 0) {
        *(int*)&m = newId;
    }
    members.push_back(m);
}

// PUBLIC: search books by title or author
std::vector<book*> library::searchBook(const std::string& query) const
{
    std::vector<book*> results;

    for (const auto& b : books)
    {
        if (b.getTitle().find(query) != std::string::npos ||
            b.getAuthor().find(query) != std::string::npos ||
            b.getISBN().find(query) != std::string::npos)
        {
            results.push_back(const_cast<book*>(&b));
        }
    }

    return results;
}

// PUBLIC: search for a member by ID
member* library::searchMember(int memberID) const
{
    for (const auto& m : members)
    {
        if (m.getID() == memberID)
            return const_cast<member*>(&m);
    }
    return nullptr;
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
    member* m = searchMember(memberID);
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