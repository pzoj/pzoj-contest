#include <string>
#include <vector>

/**
 * @brief Default checker
 * @details Tokenizes output and expected output and compares them - extra newlines/whitespaces are ignored
 * @param output The output of the program
 * @param expected_output The expected output
 * @return 1 if the output is correct, 0 otherwise
 */
bool default_checker(std::string &output, std::string &expected_output);

/**
 * @brief Default checker
 * @details Checks if the output matches the expected output exactly
 * @param output The output of the program
 * @param expected_output The expected output
 * @return 1 if the output is correct, 0 otherwise
 */
bool identical_checker(std::string &output, std::string &expected_output);
