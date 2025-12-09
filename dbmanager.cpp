//
// Created by Muhammad Bilal on 12/9/2025.
//

#include<iostream>
#include "external/sqlite/sqlite3.h"

int main() {
    sqlite3* db;
    int rc = sqlite3_open("library.db", &db);

    if (rc)
    {
        std::cerr<<"Can't open database: "<<sqlite3_errmsg(db)<<std::endl;
        return 1;
    }
    else
        std::cout<<"Database Opened Successfully!"<<std::endl;

    const char* sql = "INSERT INTO Books(Title, Author, ISBN, Year)"
    "VALUES('Kiterunner', 'Khaled Hosseini', '9781594631931', 2003);";

    char* errmsg = nullptr;

    int rc1 = sqlite3_exec(db, sql, nullptr, nullptr, &errmsg);

    if (rc != SQLITE_OK) {
        std::cout<<"SQL Error: "<<errmsg<<std::endl;
        return 1;
    }

    else
        std::cout<<"Query Ran Successfully!"<<std::endl;

    sqlite3_close(db);

    std::cout<<"Press Enter to Exit...";
    std::cin.get();
    return 0;
}
