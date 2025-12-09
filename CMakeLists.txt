cmake_minimum_required(VERSION 3.10)
project(sem_project_focp)

set(CMAKE_CXX_STANDARD 17)

# Output directory
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

# Add executable
add_executable(sem_project_focp
        dbmanager.cpp
        external/sqlite/sqlite3.c
)

# Include SQLite headers
target_include_directories(sem_project_focp PRIVATE external/sqlite)

# Optional: compile warnings
if(MSVC)
    target_compile_options(sem_project_focp PRIVATE /W4 /permissive-)
else()
    target_compile_options(sem_project_focp PRIVATE -Wall -Wextra -pedantic)
endif()
