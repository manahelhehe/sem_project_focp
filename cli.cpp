#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <cstring>
#include "library.h"

// Minimal JSON builder (no external dependency)
class JSON {
public:
    std::string data;
    
    JSON() : data("{}") {}
    
    static JSON object() { JSON j; j.data = "{}"; return j; }
    static JSON array() { JSON j; j.data = "[]"; return j; }
    
    static std::string escape(const std::string& s) {
        std::string result;
        for (char c : s) {
            switch (c) {
                case '"': result += "\\\""; break;
                case '\\': result += "\\\\"; break;
                case '\n': result += "\\n"; break;
                case '\r': result += "\\r"; break;
                case '\t': result += "\\t"; break;
                default: result += c;
            }
        }
        return result;
    }
    
    static std::string stringify(const std::string& key, const std::string& value) {
        return "\"" + key + "\":\"" + escape(value) + "\"";
    }
    
    static std::string stringify(const std::string& key, int value) {
        return "\"" + key + "\":" + std::to_string(value);
    }
    
    static std::string stringify(const std::string& key, bool value) {
        return "\"" + key + "\":" + (value ? "true" : "false");
    }
};

// Simple response builder
void sendResponse(int id, bool success, const std::string& content) {
    std::cout << "{\"id\":" << id 
              << ",\"success\":" << (success ? "true" : "false")
              << ",\"data\":" << content << "}" << std::endl;
    std::cout.flush();
}

void sendError(int id, const std::string& error) {
    std::cout << "{\"id\":" << id 
              << ",\"success\":false"
              << ",\"error\":\"" << JSON::escape(error) << "\"}" << std::endl;
    std::cout.flush();
}

// Simple JSON parser (extracts basic fields)
class SimpleParser {
public:
    std::string raw;
    
    SimpleParser(const std::string& input) : raw(input) {}
    
    int getInt(const std::string& key, int defaultVal = 0) {
        std::string search = "\"" + key + "\":";
        size_t pos = raw.find(search);
        if (pos == std::string::npos) return defaultVal;
        
        size_t start = pos + search.length();
        size_t end = raw.find_first_of(",}", start);
        std::string numStr = raw.substr(start, end - start);
        
        try {
            return std::stoi(numStr);
        } catch (...) {
            return defaultVal;
        }
    }
    
    std::string getString(const std::string& key, const std::string& defaultVal = "") {
        std::string search = "\"" + key + "\":\"";
        size_t pos = raw.find(search);
        if (pos == std::string::npos) return defaultVal;
        
        size_t start = pos + search.length();
        size_t end = raw.find("\"", start);
        if (end == std::string::npos) return defaultVal;
        
        return raw.substr(start, end - start);
    }
};

// Global library instance
library lib;

int main() {
    std::string line;
    std::ios::sync_with_stdio(false);
    
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        
        try {
            SimpleParser parser(line);
            
            int id = parser.getInt("id", 0);
            std::string method = parser.getString("method", "");
            
            if (method == "listBooks") {
                const auto& books = lib.getBooks();
                std::stringstream ss;
                ss << "[";
                bool first = true;
                for (const auto& b : books) {
                    if (!first) ss << ",";
                    ss << "{"
                       << "\"id\":" << b.getID()
                       << ",\"title\":\"" << JSON::escape(b.getTitle()) << "\""
                       << ",\"author\":\"" << JSON::escape(b.getAuthor()) << "\""
                       << ",\"isbn\":\"" << JSON::escape(b.getISBN()) << "\""
                       << ",\"borrowed\":" << (b.getBorrowStatus() ? "true" : "false")
                       << ",\"issuedTo\":" << b.getIssuedTo()
                       << "}";
                    first = false;
                }
                ss << "]";
                sendResponse(id, true, ss.str());
            }
            else if (method == "listMembers") {
                const auto& members = lib.getMembers();
                std::stringstream ss;
                ss << "[";
                bool first = true;
                for (const auto& m : members) {
                    if (!first) ss << ",";
                    ss << "{"
                       << "\"id\":" << m.getID()
                       << ",\"name\":\"" << JSON::escape(m.getName()) << "\""
                       << ",\"address\":\"" << JSON::escape(m.getAddress()) << "\""
                       << ",\"borrowedBookId\":" << m.getBorrowedBookID()
                       << "}";
                    first = false;
                }
                ss << "]";
                sendResponse(id, true, ss.str());
            }
            else if (method == "addBook") {
                std::string title = parser.getString("title", "");
                std::string isbn = parser.getString("isbn", "");
                std::string author = parser.getString("author", "");
                
                if (title.empty() || isbn.empty() || author.empty()) {
                    sendError(id, "Missing required fields: title, isbn, author");
                    continue;
                }
                
                lib.addBook(title, isbn, author);
                sendResponse(id, true, "{\"message\":\"Book added successfully\"}");
            }
            else if (method == "addMember") {
                std::string name = parser.getString("name", "");
                std::string address = parser.getString("address", "");
                
                if (name.empty() || address.empty()) {
                    sendError(id, "Missing required fields: name, address");
                    continue;
                }
                
                lib.addMember(name, address);
                sendResponse(id, true, "{\"message\":\"Member added successfully\"}");
            }
            else if (method == "checkoutBook") {
                int bookID = parser.getInt("bookID", 0);
                int memberID = parser.getInt("memberID", 0);
                
                if (bookID == 0 || memberID == 0) {
                    sendError(id, "Missing required fields: bookID, memberID");
                    continue;
                }
                
                bool success = lib.checkOutBook(bookID, memberID);
                if (success) {
                    sendResponse(id, true, "{\"message\":\"Book checked out successfully\"}");
                } else {
                    sendError(id, "Failed to checkout book (already borrowed or not found)");
                }
            }
            else if (method == "returnBook") {
                int bookID = parser.getInt("bookID", 0);
                int memberID = parser.getInt("memberID", 0);
                
                if (bookID == 0 || memberID == 0) {
                    sendError(id, "Missing required fields: bookID, memberID");
                    continue;
                }
                
                bool success = lib.returnBook(bookID, memberID);
                if (success) {
                    sendResponse(id, true, "{\"message\":\"Book returned successfully\"}");
                } else {
                    sendError(id, "Failed to return book (not borrowed or not found)");
                }
            }
            else if (method == "searchBooks") {
                std::string query = parser.getString("query", "");
                if (query.empty()) {
                    sendError(id, "Missing required field: query");
                    continue;
                }
                
                auto results = lib.searchBook(query);
                std::stringstream ss;
                ss << "[";
                bool first = true;
                for (const auto* b : results) {
                    if (!first) ss << ",";
                    ss << "{"
                       << "\"id\":" << b->getID()
                       << ",\"title\":\"" << JSON::escape(b->getTitle()) << "\""
                       << ",\"author\":\"" << JSON::escape(b->getAuthor()) << "\""
                       << ",\"isbn\":\"" << JSON::escape(b->getISBN()) << "\""
                       << ",\"borrowed\":" << (b->getBorrowStatus() ? "true" : "false")
                       << "}";
                    first = false;
                }
                ss << "]";
                sendResponse(id, true, ss.str());
            }
            else if (method == "searchMember") {
                // Support searching by numeric ID (memberID) or by name (query)
                int memberID = parser.getInt("memberID", 0);
                std::string q = parser.getString("query", "");

                if (memberID != 0) {
                    // Search by member ID - find in members list
                    const auto& members = lib.getMembers();
                    const member* m = nullptr;
                    for (const auto& mem : members) {
                        if (mem.getID() == memberID) {
                            m = &mem;
                            break;
                        }
                    }
                    if (m) {
                        std::stringstream ss;
                        ss << "{"
                           << "\"id\":" << m->getID()
                           << ",\"name\":\"" << JSON::escape(m->getName()) << "\""
                           << ",\"address\":\"" << JSON::escape(m->getAddress()) << "\""
                           << ",\"borrowedBookId\":" << m->getBorrowedBookID()
                           << "}";
                        sendResponse(id, true, ss.str());
                    } else {
                        sendError(id, "Member not found");
                    }
                } else if (!q.empty()) {
                    // search by name substring
                    auto results = lib.searchMember(q);
                    std::stringstream ss;
                    ss << "[";
                    bool first = true;
                    for (const auto* m : results) {
                        if (!first) ss << ",";
                        ss << "{"
                           << "\"id\":" << m->getID()
                           << ",\"name\":\"" << JSON::escape(m->getName()) << "\""
                           << ",\"address\":\"" << JSON::escape(m->getAddress()) << "\""
                           << ",\"borrowedBookId\":" << m->getBorrowedBookID()
                           << "}";
                        first = false;
                    }
                    ss << "]";
                    sendResponse(id, true, ss.str());
                } else {
                    sendError(id, "Missing required field: memberID or query");
                }
            }
            else if (method == "delete-book") {
                int bookID = parser.getInt("bookID", 0);
                
                if (bookID == 0) {
                    sendError(id, "Missing required field: bookID");
                    continue;
                }
                
                lib.deleteBook(bookID);
                sendResponse(id, true, "{\"message\":\"Book deleted successfully\"}");
            }
            else if (method == "delete-member") {
                int memberID = parser.getInt("memberID", 0);
                
                if (memberID == 0) {
                    sendError(id, "Missing required field: memberID");
                    continue;
                }
                
                lib.deleteMember(memberID);
                sendResponse(id, true, "{\"message\":\"Member deleted successfully\"}");
            }
            else {
                sendError(id, "Unknown method: " + method);
            }
        } catch (const std::exception& e) {
            std::cerr << "Error: " << e.what() << std::endl;
        }
    }
    
    return 0;
}
