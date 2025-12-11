#include <iostream>
#include "external/sqlite/sqlite3.h"

int main() {
	
    sqlite3* db;
    int rc = sqlite3_open("test.db", &db);

    if(rc) {
        std::cerr << "Can't open database: " << sqlite3_errmsg(db) << std::endl;
    } else {
        std::cout << "Opened database successfully!" << std::endl;
    }

    sqlite3_close(db);
    return 0;
}
