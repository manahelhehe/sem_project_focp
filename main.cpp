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

    sqlite3_close(db);

    std::cout<<"Press Enter to Exit...";
    std::cin.get();
    return 0;
}
