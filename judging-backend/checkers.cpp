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

bool fpabs_checker(std::string &output, std::string &expected_output, long double eps) {
	std::vector<std::string> tok_output, tok_expected_output;

	tokenize(output, tok_output);
	tokenize(expected_output, tok_expected_output);

	if (tok_output.size() != tok_expected_output.size()) return 0;
	for (int i = 0; i < tok_output.size(); i++) {
		long double a = std::stold(tok_output[i]);
		long double b = std::stold(tok_expected_output[i]);
		if (std::abs(a - b) > eps) return 0;
	}
	return 1;
}

bool fprel_checker(std::string &output, std::string &expected_output, long double eps) {
	std::vector<std::string> tok_output, tok_expected_output;

	tokenize(output, tok_output);
	tokenize(expected_output, tok_expected_output);

	if (tok_output.size() != tok_expected_output.size()) return 0;
	for (int i = 0; i < tok_output.size(); i++) {
		long double a = std::stold(tok_output[i]);
		long double b = std::stold(tok_expected_output[i]);
		if (std::abs(a - b) > std::max(std::abs(a), std::abs(b)) * eps) return 0;
	}
	return 1;
}
