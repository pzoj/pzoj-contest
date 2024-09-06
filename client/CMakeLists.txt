add_custom_command(
	OUTPUT ${CMAKE_CURRENT_LIST_DIR}/node_modules
	COMMAND npm i
	WORKING_DIRECTORY ${CMAKE_CURRENT_LIST_DIR}
	DEPENDS ${CMAKE_CURRENT_LIST_DIR}/package.json
)

add_custom_command(
	OUTPUT ${CMAKE_CURRENT_LIST_DIR}/.next/BUILD_ID
	COMMAND npm run build
	WORKING_DIRECTORY ${CMAKE_CURRENT_LIST_DIR}
	DEPENDS ${CMAKE_CURRENT_LIST_DIR}/src ${CMAKE_CURRENT_LIST_DIR}/node_modules
)

add_custom_target(npm_install_client DEPENDS ${CMAKE_CURRENT_LIST_DIR}/node_modules)
add_custom_target(build_client ALL DEPENDS npm_install_client ${CMAKE_CURRENT_LIST_DIR}/.next/BUILD_ID)
