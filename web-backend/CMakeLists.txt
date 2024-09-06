add_custom_command(
	OUTPUT ${CMAKE_CURRENT_LIST_DIR}/node_modules
	COMMAND npm i
	WORKING_DIRECTORY ${CMAKE_CURRENT_LIST_DIR}
	DEPENDS ${CMAKE_CURRENT_LIST_DIR}/package.json
)
add_custom_target(npm_install_backend ALL DEPENDS ${CMAKE_CURRENT_LIST_DIR}/node_modules)
