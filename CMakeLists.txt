cmake_minimum_required(VERSION 3.10)
project(sem_project_focp)

set(CMAKE_CXX_STANDARD 17)

# Output directory
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

# Project sources
set(PROJECT_SOURCES
    cli.cpp
    database.cpp
    book.cpp
    library.cpp
    member.cpp
    # SQLite amalgamation (C source)
    external/sqlite/sqlite3.c
)

# Ensure the SQLite C file is compiled as C (not C++)
set_source_files_properties(external/sqlite/sqlite3.c PROPERTIES LANGUAGE C)

add_executable(sem_project_focp ${PROJECT_SOURCES})

# Include directories
target_include_directories(sem_project_focp PRIVATE external/sqlite ${CMAKE_SOURCE_DIR})

# Optional: compile warnings
if(MSVC)
    target_compile_options(sem_project_focp PRIVATE /W4 /permissive-)
else()
    target_compile_options(sem_project_focp PRIVATE -Wall -Wextra -pedantic)
endif()

# For the C sources (sqlite) we prefer at least C11 where available
if (NOT MSVC)
    target_compile_options(sem_project_focp PRIVATE $<$<COMPILE_LANGUAGE:C>:-std=c11>)
endif()
