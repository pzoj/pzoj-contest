#include "checkers.h"

bool default_checker(std::string &output, std::string &expected_output) {
	std::vector<std::string> tok_output, tok_expected_output;
	std::string curr = "";
	for (int i = 0; i <= output.size(); i++) {
		if (i == output.size() || ((output[i] == ' ' || output[i] == '\n') && !curr.empty())) {
			tok_output.push_back(curr);
			curr.clear();
		}
		else curr.push_back(output[i]);
	}
	for (int i = 0; i <= expected_output.size(); i++) {
		if (i == expected_output.size() || ((expected_output[i] == ' ' || expected_output[i] == '\n') && !curr.empty())) {
			tok_expected_output.push_back(curr);
			curr.clear();
		}
		else curr.push_back(expected_output[i]);
	}
	if (tok_output.size() != tok_expected_output.size()) return 0;
	for (int i = 0; i < tok_output.size(); i++) {
		if (tok_output[i] != tok_expected_output[i]) return 0;
	}
	return 1;
}

bool identical_checker(std::string &output, std::string &expected_output) {
	return output == expected_output;
}
