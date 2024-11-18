#include "checkers.hpp"

inline bool is_whitespace(char c) {
	return c == ' ' || c == '\n' || c == '\t' || c == '\r';
}

bool default_checker(std::string &output, std::string &expected_output) {
	int p = 0, p2 = 0;
	bool expspace = true, outspace = true;
	while (p < expected_output.size()) {
		while (p < expected_output.size() && is_whitespace(expected_output[p])) {
			p++;
			expspace = true;
		}
		while (p2 < output.size() && is_whitespace(output[p2])) {
			p2++;
			outspace = true;
		}
		if (expspace != outspace && p < expected_output.size() && p2 < output.size()) return false;
		if (p >= expected_output.size() && p2 >= output.size()) return true;
		else if (p >= expected_output.size() != p2 >= output.size()) return false;
		if (output[p2] != expected_output[p]) return false;
		p++, p2++;
		expspace = false;
		outspace = false;
	}
	return true;
}

bool identical_checker(std::string &output, std::string &expected_output) {
	return output == expected_output;
}
