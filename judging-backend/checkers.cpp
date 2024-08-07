#include "checkers.hpp"

void tokenize(std::string &s, std::vector<std::string> &tokens) {
	std::string curr = "";
	for (int i = 0; i <= s.size(); i++) {
		if ((i == s.size() || s[i] == ' ' || s[i] == '\n' || s[i] == '\t')) {
			if (curr.empty()) continue;
			tokens.push_back(curr);
			curr.clear();
		}
		else curr.push_back(s[i]);
	}
}

bool default_checker(std::string &output, std::string &expected_output) {
	std::vector<std::string> tok_output, tok_expected_output;

	tokenize(output, tok_output);
	tokenize(expected_output, tok_expected_output);

	if (tok_output.size() != tok_expected_output.size()) return 0;
	for (int i = 0; i < tok_output.size(); i++) {
		if (tok_output[i] != tok_expected_output[i]) return 0;
	}
	return 1;
}

bool identical_checker(std::string &output, std::string &expected_output) {
	return output == expected_output;
}
