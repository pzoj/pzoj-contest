#include <cerrno>
#include <fstream>
#include <iostream>
#include <seccomp.h>
#include <csignal>
#include <sstream>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <sys/mman.h>
#include <sys/ptrace.h>
#include <sys/reg.h>
#include <sys/resource.h>
#include <sys/stat.h>
#include <sys/time.h>
#include <sys/types.h>
#include <sys/user.h>
#include <sys/wait.h>
#include <unistd.h>
#include <vector>

#include "checkers.hpp"

#define AC 0
#define WA 1
#define TLE 2
#define MLE 3
#define IE 4
#define OLE 5
#define CE 6
#define IR 7
#define RTE 8
#define SEGV 9
#define FPE 10
#define ABRT 11
#define DIS_SYS 12
#define ILL 13

// Compiler config
// Remove the #ifndef and #endif lines if you want to hardcode, otherwise it will use defaults set by CMake
#ifndef CXX_PATH
#define CXX_PATH "/usr/bin/g++"
#endif
#ifndef C_PATH
#define C_PATH "/usr/bin/gcc"
#endif
#ifndef ASM_PATH
#define ASM_PATH "/usr/bin/nasm"
#endif
// #ifndef PYTHON_PATH
#define PYTHON_PATH "/usr/bin/pypy3"
// #endif
#define CXX_ARGS "-O2", "-std=c++20"
#define C_ARGS "-O2", "-o"
#define ASM_ARGS "-felf64"

using func_ptr = bool (*)(std::string &, std::string &);

uint32_t get_memory(int pid) {
	std::string path = "/proc/" + std::to_string(pid) + "/status";
	std::fstream f(path, std::ios::in);
	if (!f.is_open()) {
		std::cerr << "failed to open /proc/pid/status" << std::endl;
		return IE;
	}

	std::string buf;
	int mem;
	while (getline(f, buf)) {
		if (strncmp(buf.c_str(), "VmHWM:", 6) == 0) {
			// if (sscanf(buf.c_str(), "VmHWM: %d kB ", &mem) != 1) {
			char *end;
			mem = strtol(buf.c_str() + 6, &end, 10);
			if (end == buf.c_str() + 6) {
				std::cerr << "failed to read memory usage" << std::endl;
				return IE;
			}
			break;
		}
	}
	f.close();
	return mem;
}

uint64_t get_time(struct rusage &prevuse) {
	struct rusage usage;
	getrusage(RUSAGE_CHILDREN, &usage);
	time_t time = (usage.ru_utime.tv_sec - prevuse.ru_utime.tv_sec) * 1000 + (usage.ru_utime.tv_usec - prevuse.ru_utime.tv_usec) / 1000;
	return time;
}

std::string format_datetime() {
	// format in YYYY/MM/DD HH:MM:SS
	time_t now = time(0);
	tm *ltm = localtime(&now);
	std::string datetime = std::to_string(1900 + ltm->tm_year) + '/' + std::to_string(1 + ltm->tm_mon) + '/' + std::to_string(ltm->tm_mday) + ' ' +
						   std::to_string(ltm->tm_hour) + ':' + std::to_string(ltm->tm_min) + ':' + std::to_string(ltm->tm_sec);
	return datetime;
}

int main(int argc, char *argv[]) {
	FILE *openfp = freopen("log.log", "a", stderr);
	if (openfp == NULL) {
		std::cerr << "failed to open log file" << std::endl;
		return IE;
	}

	std::cerr << "\n\n--- JUDGING AT " << format_datetime() << " ---" << std::endl;
	std::cerr << "PROBLEM: " << argv[2] << std::endl;
	std::cerr << "SUBMISSION ID: " << argv[3] << std::endl;
	// argv[1] is the language that the program is written in
	// argv[2] is the directory of the problem
	// argv[3] is the submission id, a unique id
	if (argc != 4) {
		std::cerr << "invalid number of arguments" << std::endl;
		return IE;
	}

	if (chdir("/tmp") != 0) {
		std::cerr << "failed to chdir" << std::endl;
		return IE;
	}

	std::string dir = argv[2];
	std::string judge_id = argv[3];
	std::string run_cmd = judge_id, run_args = "";

	// copy code file to /tmp just in case we need to look at it in the case of an internal error
	std::string code_file = dir + "/main" + judge_id + "." + argv[1];
	std::ifstream src(code_file, std::ios::binary);
	std::ofstream dst("/tmp/main" + judge_id + "." + argv[1], std::ios::binary);
	dst << src.rdbuf();
	src.close();
	dst.close();

	if (strncmp(argv[1], "cpp", 3) == 0) {
		run_cmd = "./" + judge_id;
		// compile C++ program
		pid_t pid = fork();
		if (pid == 0) {
			// child process
			// set rlimit of exec time to 5 seconds
			struct rlimit rlim;
			rlim.rlim_cur = 5;
			rlim.rlim_max = 5;
			if (setrlimit(RLIMIT_CPU, &rlim) != 0) {
				std::cerr << "failed to set compiler time limit" << std::endl;
				return IE;
			}

			execl(CXX_PATH, CXX_PATH, (dir + "/main" + judge_id + ".cpp").c_str(), CXX_ARGS, "-o", judge_id.c_str(), NULL);
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
				return CE; // *could* be IE but its probably not our fault
			}
		} else {
			std::cerr << "fork failed" << std::endl;
			return IE;
		}
	} else if (strncmp(argv[1], "c", 1) == 0) {
		run_cmd = "./" + judge_id;
		// compile C program
		pid_t pid = fork();
		if (pid == 0) {
			// child process
			struct rlimit rlim;
			rlim.rlim_cur = 5;
			rlim.rlim_max = 5;
			if (setrlimit(RLIMIT_CPU, &rlim) != 0) {
				std::cerr << "failed to set compiler time limit" << std::endl;
				return IE;
			}

			execl(C_PATH, C_PATH, (dir + "/main" + judge_id + ".c").c_str(), C_ARGS, judge_id.c_str(), NULL);
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
				return CE;
			}
		} else {
			std::cerr << "fork failed" << std::endl;
			return IE;
		}
	} else if (strncmp(argv[1], "py", 2) == 0) {
		run_cmd = PYTHON_PATH;
		// run_args = dir + "/main" + judge_id + ".py";
		rename((dir + "/main" + judge_id + ".py").c_str(), ("/tmp/main" + judge_id + ".py").c_str());
		run_args = "/tmp/main" + judge_id + ".py";
	} else if (strncmp(argv[1], "java", 4) == 0) {
		rename((dir + "/main" + judge_id + ".java").c_str(), (dir + "/Main" + judge_id + ".java").c_str());
		run_cmd = "java";
		run_args = "Main" + judge_id;
		pid_t pid = fork();
		if (pid == 0) {
			// child process
			struct rlimit rlim;
			rlim.rlim_cur = 5;
			rlim.rlim_max = 5;
			if (setrlimit(RLIMIT_CPU, &rlim) != 0) {
				std::cerr << "failed to set compiler time limit" << std::endl;
				return IE;
			}

			execl("/usr/bin/javac", "/usr/bin/javac", (dir + "/Main" + judge_id + ".java").c_str(), "-d", ".", NULL);
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
				return CE;
			}
			rename((dir + "/Main" + judge_id + ".java").c_str(), (dir + "/main" + judge_id + ".java").c_str()); // dno't question it
		} else {
			std::cerr << "fork failed" << std::endl;
			return IE;
		}
	} else if (strncmp(argv[1], "asm", 4) == 0) {
		run_cmd = "./" + judge_id;
		// assemble program
		pid_t pid = fork();
		if (pid == 0) {
			// child process
			struct rlimit rlim;
			rlim.rlim_cur = 5;
			rlim.rlim_max = 5;
			if (setrlimit(RLIMIT_CPU, &rlim) != 0) {
				std::cerr << "failed to set compiler time limit" << std::endl;
				return IE;
			}

			execl(ASM_PATH, ASM_PATH, (dir + "/main" + judge_id + ".asm").c_str(), ASM_ARGS, "-o", (judge_id + ".o").c_str(), NULL);
		} else if (pid > 0) {
			// parent process
			int status;
			waitpid(pid, &status, 0);
			if (WIFEXITED(status)) {
				if (WEXITSTATUS(status) != 0) {
					return CE;
				}
			} else {
				std::cerr << "sedimentation terminated abnormally" << std::endl;
				return CE;
			}
		} else {
			std::cerr << "fork failed" << std::endl;
			return IE;
		}

		// link program
		pid = fork();
		if (pid == 0) {
			// child process
			struct rlimit rlim;
			rlim.rlim_cur = 5;
			rlim.rlim_max = 5;
			if (setrlimit(RLIMIT_CPU, &rlim) != 0) {
				std::cerr << "failed to set compiler time limit" << std::endl;
				return IE;
			}

			execl("/usr/bin/ld", "/usr/bin/ld", (judge_id + ".o").c_str(), "-o", judge_id.c_str(), NULL);
		} else if (pid > 0) {
			// parent process
			int status;
			waitpid(pid, &status, 0);
			if (WIFEXITED(status)) {
				if (WEXITSTATUS(status) != 0) {
					return CE;
				}
			} else {
				std::cerr << "linker terminated abnormally" << std::endl;
				return CE;
			}
		} else {
			std::cerr << "fork failed" << std::endl;
			return IE;
		}
	} else {
		std::cerr << "website passed unknown language to judge" << std::endl;
		return IE;
	}

	std::fstream init(dir + "/judge.txt", std::ios::in);
	if (!init.is_open()) {
		std::cerr << "failed to open judge file" << std::endl;
		return IE;
	}

	int time_limit, memory_limit; // time limit in milliseconds, memory limit in MB
	std::string checker;
	if (!(init >> time_limit >> memory_limit >> checker)) {
		std::cerr << "corrupted judge file" << std::endl;
		return IE;
	}

	if (strncmp(argv[1], "py", 3) == 0) {
		time_limit *= 2;
	}

	func_ptr check;

	if (checker == "identical") {
		check = &identical_checker;
	} else if (checker == "default") {
		check = &default_checker;
	} else {
		std::cerr << "unknown checker" << std::endl;
		return IE;
	}

	std::vector<std::string> input_files, output_files;

	std::string in, out;
	int numcases = 0;
	while (init >> in >> out) {
		input_files.push_back(dir + "/test/" + in);
		output_files.push_back(dir + "/test/" + out);
		numcases++;
	}
	init.close();

	struct rusage prev_use;

	for (int i = 0; i < numcases; i++) {
		getrusage(RUSAGE_CHILDREN, &prev_use);
		pid_t pid = fork();

		if (pid == 0) {
			// child
			freopen(input_files[i].c_str(), "r", stdin);
			freopen(("output" + judge_id + ".txt").c_str(), "w", stdout);

			chmod(judge_id.c_str(), 0777);

			struct rlimit rlim;
			rlim.rlim_cur = (time_limit + 999) / 1000; // round up to the next second so we dont prematurely kill processes with decimal TLs
			rlim.rlim_max = (time_limit + 999) / 1000 + 1;
			if (setrlimit(RLIMIT_CPU, &rlim) != 0) {
				std::cerr << "failed to set time limit" << std::endl;
				return IE;
			}

			if (run_cmd != "java") {
				rlim.rlim_cur = 1024ULL * 1024ULL * 1024ULL;
				rlim.rlim_max = 1024ULL * 1024ULL * 1024ULL; // 1 GB
				if (setrlimit(RLIMIT_AS, &rlim) != 0) {
					std::cerr << "failed to set memory limit" << std::endl;
					return IE;
				}
			}

			rlim.rlim_cur = 16777216;
			rlim.rlim_max = 16777216;
			if (setrlimit(RLIMIT_FSIZE, &rlim) != 0) {
				std::cerr << "failed to set output limit" << std::endl;
				return IE;
			}

			ptrace(PTRACE_TRACEME, 0, NULL, NULL);

			umask(0);

			if ((setgid(65534) != 0) || (setuid(65534) != 0)) {
				std::cerr << "failed to drop privileges" << std::endl;
				return IE;
			}

			if (run_cmd != "java")
				execlp(run_cmd.c_str(), run_cmd.c_str(), run_args.c_str(), NULL);
			else {
				std::string mem_str = "-Xmx" + std::to_string(memory_limit) + "m";
				execlp(run_cmd.c_str(), run_cmd.c_str(), run_args.c_str(), mem_str.c_str(), "-Xss64m", NULL);
			}
		} else if (pid > 0) {
			// parent
			uint32_t chld_time = 0, chld_mem = 0;
			while (true) {
				int status;
				waitpid(pid, &status, 0);
				if (WIFEXITED(status)) {
					chld_time = get_time(prev_use);
					if (WEXITSTATUS(status) != 0) {
						std::cout << "IR " << chld_mem << ' ' << chld_time << std::endl;
						return IR;
					}
					if (chld_time > time_limit) {
						std::cout << "TLE " << chld_mem << ' ' << chld_time << std::endl;
						return TLE;
					}
					// check output
					std::fstream f(("output" + judge_id + ".txt"), std::ios::in);
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
					buffer = std::stringstream();
					buffer << f.rdbuf();
					tptr2 = buffer.str();
					f.close();

					if (chld_mem > memory_limit * 1024) {
						std::cout << "MLE " << chld_mem << ' ' << chld_time << std::endl;
						return MLE;
					}

					if (!(*check)(tptr1, tptr2)) {
						std::cout << "WA " << chld_mem << ' ' << chld_time << std::endl;
						return WA;
					}

					std::cout << "AC " << chld_mem << ' ' << chld_time << std::endl;
					break;
				} else if (WIFSTOPPED(status)) {
					int sig = WSTOPSIG(status);
					if (sig == SIGTRAP) {
						long long rax = ptrace(PTRACE_PEEKUSER, pid, 8 * ORIG_RAX, NULL);
						if (rax == 231 || rax == 60) {
							// exit
							// look for memory usage in /proc/pid/status
							chld_mem = std::max(get_memory(pid), chld_mem);
						}
						ptrace(PTRACE_SYSCALL, pid, NULL, NULL);
					} else {
						int sig = WEXITSTATUS(status);
						chld_mem = std::max(get_memory(pid), chld_mem);
						chld_time = get_time(prev_use);
						if (sig == SIGXCPU) {
							std::cout << "TLE " << chld_mem << ' ' << time_limit << std::endl;
							return TLE;
						} else if (sig == SIGXFSZ) {
							std::cout << "OLE " << chld_mem << ' ' << chld_time << std::endl;
							return OLE;
						}
						std::cout << "RTE " << chld_mem << ' ' << chld_time << std::endl;
						if (sig == SIGSEGV) {
							return SEGV;
						} else if (sig == SIGFPE) {
							return FPE;
						} else if (sig == SIGABRT) {
							return ABRT;
						} else if (sig == SIGILL) {
							return ILL;
						} else {
							std::cerr << "process exit with signal " << sig << std::endl;
							return RTE;
						}
					}
				}
			}
		} else {
			std::cerr << "fork failed" << std::endl;
			return IE;
		}
	}
	return AC;
}
