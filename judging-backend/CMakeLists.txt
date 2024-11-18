enable_language(CXX)
set(CMAKE_CXX_STANDARD 20)
enable_language(C)
set(CMAKE_C_STANDARD 11)
find_package(Python3 REQUIRED COMPONENTS Interpreter)

add_compile_definitions(CXX_PATH="${CMAKE_CXX_COMPILER}")
add_compile_definitions(C_PATH="${CMAKE_C_COMPILER}")
add_compile_definitions(PYTHON_PATH="${Python3_EXECUTABLE}")

add_executable(judge EXCLUDE_FROM_ALL main.cpp checkers.cpp)
target_link_libraries(judge "seccomp")

add_custom_target(build_judge ALL
	DEPENDS judge
	COMMENT "Give the judge file permission to drop permissions"
	COMMAND sudo setcap cap_setuid,cap_setgid=eip ./judge
	COMMAND ln -sf ${CMAKE_CURRENT_BINARY_DIR}/judge ${CMAKE_CURRENT_SOURCE_DIR}/judge
)
