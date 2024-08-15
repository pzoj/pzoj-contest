#include "checkers.hpp"

inline bool is_whitespace(char c) {
	return c == ' ' || c == '\n' || c == '\t' || c == '\r';
}

bool default_checker(std::string &output, std::string &expected_output) {
	int p = 0, p2 = 0;
	bool expspace = 1, outspace = 1;
	while (p < expected_output.size()) {
		while (p < expected_output.size() && is_whitespace(expected_output[p])) {
			p++;
			expspace = 1;
		}
		while (p2 < output.size() && is_whitespace(output[p2])) {
			p2++;
			outspace = 1;
		}
		if (expspace != outspace && p < expected_output.size() && p2 < output.size()) return 0;
		if (p >= expected_output.size() && p2 >= output.size()) return 1;
		else if (p >= expected_output.size() != p2 >= output.size()) return 0;
		if (output[p2] != expected_output[p]) return 0;
		p++, p2++;
		expspace = 0;
		outspace = 0;
	}
	return 1;
}

bool identical_checker(std::string &output, std::string &expected_output) {
	return output == expected_output;
}
