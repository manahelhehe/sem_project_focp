cmake_minimum_required(VERSION 3.15)
project(sem_project_focp)

# tell CMake to use vcpkg
set(CMAKE_TOOLCHAIN_FILE "C:/Users/manah/vcpkg/scripts/buildsystems/vcpkg.cmake" CACHE STRING "")

add_executable(sem_project_focp main.cpp)

# link sqlite3 automatically (vcpkg does it via manifest)
find_package(SQLite3 CONFIG REQUIRED)
target_link_libraries(sem_project_focp PRIVATE SQLite::SQLite3)
