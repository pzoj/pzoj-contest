#include <fstream>
#include <iostream>
#include <unistd.h>
#include <stdio.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <sys/time.h>
#include <sys/stat.h>
#include <signal.h>
#include <string>
#include <sstream>
#include <sys/mman.h>
#include <stdlib.h>
#include <errno.h>
#include <sys/ptrace.h>
#include <sys/resource.h>
#include <sys/user.h>
#include <sys/reg.h>
#include <signal.h>
#include <vector>

#include "syscalls.h"
#include "checkers.h"

#define AC 0
#define WA 1
#define TLE 2
#define MLE 3
#define IE 4
#define OLE 5
#define CE 6
#define IR 7
#define RTE 8
#define SEGV 16
#define FPE 32
#define ABRT 64
#define DIS_SYS 128

std::vector<std::string> input_files, output_files;
std::string judge_feedback;

void cleanse_string(std::string &str) {
	// remove trailing whitespaces and newlines
	while (str.back() == ' ' || str.back() == '\n') {
		str.pop_back();
	}
}

typedef int (*func_ptr)(std::string &, std::string &);
func_ptr check;

void pzexit(int status) {
	std::cout << judge_feedback << std::endl;
	exit(status);
}

int main(int argc, char *argv[]) {
	// argv[1] is the language that the program is written in
	// argv[2] is the directory of the problem
	if (argc != 3) {
		std::cerr << "invalid number of arguments" << std::endl;
		return IE;
	}

	if (chdir(argv[2])) {
		std::cerr << "failed to chdir" << std::endl;
		return IE;
	}

	if (strncmp(argv[1], "cpp", 4) == 0) {
		// compile C++ program
		pid_t pid = fork();
		if (pid == 0) {
			// child process
			execl("/usr/bin/g++", "/usr/bin/g++", "main.cpp", "-std=c++20", NULL);
		} else if (pid > 0) {
			// parent process
			int status;
			waitpid(pid, &status, 0);
			if (WIFEXITED(status)) {
				if (WEXITSTATUS(status) != 0) {
					return CE;
				}
			} else {
				std::cerr << "compiler terminated abnormally" << std::endl;
				return IE;
			}
		} else {
			std::cerr << "fork failed" << std::endl;
			return IE;
		}
	} else if (strncmp(argv[1], "c", 2) == 0) {
		// compile C program
		pid_t pid = fork();
		if (pid == 0) {
			// child process
			execl("/usr/bin/gcc", "/usr/bin/gcc", "main.c", NULL);
		} else if (pid > 0) {
			// parent process
			int status;
			waitpid(pid, &status, 0);
			if (WIFEXITED(status)) {
				if (WEXITSTATUS(status) != 0) {
					return CE;
				}
			} else {
				std::cerr << "compiler terminated abnormally" << std::endl;
				return IE;
			}
		} else {
			std::cerr << "fork failed" << std::endl;
			return IE;
		}
	} else if (strncmp(argv[1], "py", 3) == 0) {
		rename("main.py", "a.out");
		// prepend #!/usr/bin/env pypy3
		// FILE *f = fopen("a.out", "r+");
		// if (f == NULL) {
		// 	std::cerr << "failed to open file handle a.out" << std::endl;
		// 	return IE;
		// }

		// char *buf = malloc(65536);
		// fread(buf, 1, 65536, f);
		// fseek(f, 0, SEEK_SET);
		// fprintf(f, "#!/usr/bin/env pypy3\n");
		// fwrite(buf, 1, strlen(buf), f);
		// fclose(f);
		std::fstream f("a.out", std::ios::in | std::ios::out);
		if (!f.is_open()) {
			std::cerr << "failed to open file handle a.out" << std::endl;
			return IE;
		}
		std::string buf;
		getline(f, buf);
		f.seekp(0, std::ios::beg);
		f << "#!/usr/bin/env pypy3\n" << buf;
		f.close();

		if (chmod("a.out", 0755)) {
			std::cerr << "failed to chmod a.out" << std::endl;
			return IE;
		}
	}
	else {
		std::cerr << "website passed unknown language to judge" << std::endl;
		return IE;
	}

	std::fstream init("judge.txt", std::ios::in);
	if (!init.is_open()) {
		std::cerr << "failed to open judge file" << std::endl;
		return IE;
	}

	int time_limit, memory_limit; // time limit in seconds, memory limit in MB
	std::string checker;
	if (!(init >> time_limit >> memory_limit >> checker)) {
		std::cerr << "corrupted judge file" << std::endl;
		return IE;
	}

	if (checker == "identical") {
		check = &identical_checker;
	} else if (checker == "default") {
		check = &default_checker;
	} else {
		std::cerr << "unknown checker" << std::endl;
		return IE;
	}

	std::string in, out;
	int numcases = 0;
	while (init >> in >> out) {
		input_files.push_back("test/" + in);
		output_files.push_back("test/" + out);
		numcases++;
	}
	init.close();

	// goal: run the program and compare the output to the expected output
	// while also checking for time limit and memory limit
	// if the program is killed by a signal, return the proper verdict (RTE | SEGV | FPE | ABRT)
	// use ptrace to monitor syscalls and memory usage
	// if the prorgam tries to use a disallowed syscall, return RTE | DIS_SYS

	struct rusage prev_use;

	for (int i = 0; i < numcases; i++) {
		getrusage(RUSAGE_CHILDREN, &prev_use);
		pid_t pid = fork();
		if (pid == 0) {
			// child
			freopen(input_files[i].c_str(), "r", stdin);
			freopen("output.txt", "w", stdout);

			struct rlimit rlim;
			rlim.rlim_cur = time_limit;
			rlim.rlim_max = time_limit + 1;
			if (setrlimit(RLIMIT_CPU, &rlim)) {
				std::cerr << "failed to set time limit" << std::endl;
				return IE;
			}
			
			rlim.rlim_cur = 1024 * 1024 * 1024;
			rlim.rlim_max = 1024 * 1024 * 1024; // 1 GB
			if (setrlimit(RLIMIT_AS, &rlim)) {
				std::cerr << "failed to set memory limit" << std::endl;
				return IE;
			}

			ptrace(PTRACE_TRACEME, 0, NULL, NULL);
			execl("./a.out", "./a.out", NULL);
		} else if (pid > 0) {
			// unsigned long long penalty = 0;
			// parent
			while (1) {
				int status;
				waitpid(pid, &status, 0);
				if (WIFEXITED(status)) {
					if (WEXITSTATUS(status) != 0) {
						return IR;
					}
					struct rusage usage;
					getrusage(RUSAGE_CHILDREN, &usage);
					double time = usage.ru_utime.tv_sec - prev_use.ru_utime.tv_sec + (usage.ru_utime.tv_usec - prev_use.ru_utime.tv_usec) / 1000000.;
					time += usage.ru_stime.tv_sec - prev_use.ru_stime.tv_sec + (usage.ru_stime.tv_usec - prev_use.ru_stime.tv_usec) / 1000000.;
					if (time > time_limit)
						return TLE;
					judge_feedback += std::to_string((long long)(time * 1000)) + ' ';
					// check output
					// FILE *f = fopen("output.txt", "r");
					// char *ptr1 = mmap(0, 0x1000000, PROT_READ, MAP_SHARED, fileno(f), 0);
					// fseek(f, 0, SEEK_END);
					// char *tptr1 = cleanse_string(ptr1, ftell(f));
					// munmap(ptr1, 0x1000000);
					// fclose(f);
					// f = fopen(output_files[i], "r");
					// char *ptr2 = mmap(0, 0x1000000, PROT_READ, MAP_SHARED, fileno(f), 0);
					// fseek(f, 0, SEEK_END);
					// char *tptr2 = cleanse_string(ptr2, ftell(f));
					// munmap(ptr2, 0x1000000);
					// fclose(f);
					std::fstream f("output.txt", std::ios::in);
					if (!f.is_open()) {
						std::cerr << "failed to open output.txt" << std::endl;
						return IE;
					}
					std::string tptr1, tptr2;
					std::stringstream buffer;
					// dump full contents of f into tptr1
					buffer << f.rdbuf();
					tptr1 = buffer.str();
					f.close();
					f.open(output_files[i], std::ios::in);
					if (!f.is_open()) {
						std::cerr << "failed to open output file" << std::endl;
						return IE;
					}
					buffer.str("");
					buffer << f.rdbuf();
					tptr2 = buffer.str();
					f.close();

					if (!(*check)(tptr1, tptr2)) {
						judge_feedback = "WA " + judge_feedback;
						pzexit(WA);
					}
					break;
				} else if (WIFSIGNALED(status)) {
					int sig = WEXITSTATUS(status);
					if (sig == SIGXCPU) {
						return TLE;
					} else if (sig == SIGSEGV) {
						return RTE | SEGV;
					} else if (sig == SIGFPE) {
						return RTE | FPE;
					} else if (sig == SIGABRT) {
						return RTE | ABRT;
					} else {
						std::cerr << "unknown signal " << sig << std::endl;
						return RTE;
					}
				} else if (WIFSTOPPED(status)) {
					int sig = WSTOPSIG(status);
					if (sig == SIGTRAP) {
						long long rax = ptrace(PTRACE_PEEKUSER, pid, 8 * ORIG_RAX, NULL);
						if (rax == 231 || rax == 60) {
							// exit
							// look for memory usage in /proc/pid/status
							char path[32];
							sprintf(path, "/proc/%d/status", pid);
							FILE *f = fopen(path, "r");
							if (f == NULL) {
								std::cerr << "failed to open /proc/pid/status" << std::endl;
								return IE;
							}

							char buf[512];
							while (fgets(buf, 512, f)) {
								if (strncmp(buf, "VmPeak:", 7) == 0) {
									int mem;
									if (sscanf(buf, "VmPeak: %d kB ", &mem) != 1) {
										std::cerr << "failed to read memory usage" << std::endl;
										return IE;
									}
									if (mem > memory_limit * 1024) {
										return MLE;
									}
									printf("%d ", mem);
									break;
								}
							}
							fclose(f);
						}
						if (syscall_allowed(rax)) {
							ptrace(PTRACE_SYSCALL, pid, NULL, NULL);
						} else {
							std::cerr << "disallowed syscall " << rax << std::endl;
							kill(pid, SIGKILL);
							return RTE | DIS_SYS;
						}
					} else {
						int sig = WEXITSTATUS(status);
						if (sig == SIGXCPU) {
							return TLE;
						} else if (sig == SIGSEGV) {
							return RTE | SEGV;
						} else if (sig == SIGFPE) {
							return RTE | FPE;
						} else if (sig == SIGABRT) {
							return RTE | ABRT;
						} else {
							std::cerr << "unknown signal " << sig << std::endl;
							return RTE;
						}
					}
				} else {
					std::cerr << "program terminated abnormally" << std::endl;
					return RTE;
				}
			}
		} else {
			std::cerr << "fork failed" << std::endl;
			return IE;
		}
	}
	return AC;
}	