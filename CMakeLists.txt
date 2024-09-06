cmake_minimum_required(VERSION 3.0)

project(pzoj-contest)

add_subdirectory(judging-backend)
add_subdirectory(web-backend)
add_subdirectory(client)

add_custom_target(host
	DEPENDS judging-backend web-backend client
	COMMAND bash ${CMAKE_CURRENT_SOURCE_DIR}/scripts/host.sh
)
