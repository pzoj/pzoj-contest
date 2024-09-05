enable_language(CXX)
set(CMAKE_CXX_STANDARD 20)

add_executable(judge EXCLUDE_FROM_ALL main.cpp checkers.cpp)
target_link_libraries(judge "seccomp")

add_custom_target(build_judge ALL
	DEPENDS judge
	COMMENT "Give the judge file permission to drop permissions"
	COMMAND sudo setcap cap_setuid,cap_setgid=eip ./judge
)
