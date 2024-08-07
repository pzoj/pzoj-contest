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
#include <string.h>
#include <sstream>
#include <sys/mman.h>
#include <stdlib.h>
#include <seccomp.h>
#include <errno.h>
#include <sys/ptrace.h>
#include <sys/resource.h>
#include <sys/user.h>
#include <sys/reg.h>
#include <signal.h>
#include <unistd.h>
#include <vector>

#include "syscalls.h"
#include "checkers.hpp"

#define AC 0
#define WA 1
#define TLE 2
#define MLE 3
#define IE 4
#define OLE 5
#define CE 6
#define IR 7
#define RTE 0x08
#define SEGV 0x10
#define FPE 0x20
#define ABRT 0x40
#define DIS_SYS 0x80

std::vector<std::string> input_files, output_files;

void cleanse_string(std::string &str) {
	// remove trailing whitespaces and newlines
	while (str.back() == ' ' || str.back() == '\n') {
		str.pop_back();
	}
}

typedef bool (*func_ptr)(std::string &, std::string &);
func_ptr check;

int get_memory(int pid) {
	std::string path = "/proc/" + std::to_string(pid) + "/status";
	std::fstream f(path, std::ios::in);
	if (!f.is_open()) {
		std::cerr << "failed to open /proc/pid/status" << std::endl;
		return IE;
	}

	std::string buf;
	int mem;
	while (getline(f, buf)) {
		if (strncmp(buf.c_str(), "VmPeak:", 7) == 0) {
			if (sscanf(buf.c_str(), "VmPeak: %d kB ", &mem) != 1) {
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

int main(int argc, char *argv[]) {
	freopen("log.log", "a", stderr);
	std::cerr << "--- JUDGING AT " << time(0) << " ---" << std::endl;
	std::cerr << "PROBLEM: " << argv[2] << std::endl;
	// argv[1] is the language that the program is written in
	// argv[2] is the directory of the problem
	// argv[3] is the submission id, a unique id
	if (argc != 4) {
		std::cerr << "invalid number of arguments" << std::endl;
		return IE;
	}

	// if (chdir(argv[2])) {
	if (chdir("/tmp")) {
		std::cerr << "failed to chdir" << std::endl;
		return IE;
	}

	std::string dir = argv[2];
	std::string judge_id = argv[3];
	std::string run_cmd = judge_id, run_args = "";
	if (strncmp(argv[1], "cpp", 4) == 0) {
		run_cmd = "./" + judge_id;
		// compile C++ program
		pid_t pid = fork();
		if (pid == 0) {
			// child process
			// freopen("/dev/null", "w", stderr);
			execl("/usr/bin/g++", "/usr/bin/g++", (dir + "/main" + judge_id + ".cpp").c_str(), "-O2", "-std=c++20", "-o", judge_id.c_str(), NULL);
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
		run_cmd = "./" + judge_id;
		// compile C program
		pid_t pid = fork();
		if (pid == 0) {
			// child process
			freopen("/dev/null", "w", stderr);
			execl("/usr/bin/gcc", "/usr/bin/gcc", (dir + "/main" + judge_id + ".c").c_str(), "-O2", "-o", judge_id.c_str(), NULL);
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
		run_cmd = "pypy3";
		// run_args = dir + "/main" + judge_id + ".py";
		rename((dir + "/main" + judge_id + ".py").c_str(), ("/tmp/main" + judge_id + ".py").c_str());
		run_args = "/tmp/main" + judge_id + ".py";
	} else if (strncmp(argv[1], "java", 5) == 0) {
		rename((dir + "/main" + judge_id + ".java").c_str(), (dir + "/Main" + judge_id + ".java").c_str());
		run_cmd = "java";
		run_args = "Main" + judge_id;
		pid_t pid = fork();
		if (pid == 0) {
			// child process
			freopen("/dev/null", "w", stderr);
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
				return IE;
			}
			rename((dir + "/Main" + judge_id + ".java").c_str(), (dir + "/main" + judge_id + ".java").c_str()); // dno't question it
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
		input_files.push_back(dir + "/test/" + in);
		output_files.push_back(dir + "/test/" + out);
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
			freopen(("output" + judge_id + ".txt").c_str(), "w", stdout);

			chmod(("output" + judge_id + ".txt").c_str(), 0666); // all permissions
			chmod(judge_id.c_str(), 0777);
			
			struct rlimit rlim;
			rlim.rlim_cur = (time_limit + 999) / 1000;
			rlim.rlim_max = (time_limit + 999) / 1000 + 1;
			if (setrlimit(RLIMIT_CPU, &rlim)) {
				std::cerr << "failed to set time limit" << std::endl;
				return IE;
			}
			
			if (run_cmd != "java") {
				rlim.rlim_cur = 1024 * 1024 * 1024;
				rlim.rlim_max = 1024 * 1024 * 1024; // 1 GB
				if (setrlimit(RLIMIT_AS, &rlim)) {
					std::cerr << "failed to set memory limit" << std::endl;
					return IE;
				}
			}

			ptrace(PTRACE_TRACEME, 0, NULL, NULL);

			umask(0);

			if (setgid(65534) || setuid(65534)) {
				std::cerr << "failed to drop privileges" << std::endl;
				return IE;
			}

			scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_KILL);
			for (int fd = 0; fd <= 4; fd++) {
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(read), 1, SCMP_A0(SCMP_CMP_EQ, fd));
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(write), 1, SCMP_A0(SCMP_CMP_EQ, fd));
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(open), 1, SCMP_A0(SCMP_CMP_EQ, fd));
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(close), 1, SCMP_A0(SCMP_CMP_EQ, fd));
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(pread64), 1, SCMP_A0(SCMP_CMP_EQ, fd));
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(pwrite64), 1, SCMP_A0(SCMP_CMP_EQ, fd));
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(ioctl), 1, SCMP_A0(SCMP_CMP_EQ, fd));
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(lseek), 1, SCMP_A0(SCMP_CMP_EQ, fd));
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(getdents64), 1, SCMP_A0(SCMP_CMP_EQ, fd));
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(fcntl), 1, SCMP_A0(SCMP_CMP_EQ, fd));
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(dup), 1, SCMP_A0(SCMP_CMP_EQ, fd));
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(dup2), 1, SCMP_A0(SCMP_CMP_EQ, fd));
			}
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(exit), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(exit_group), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(brk), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(mmap), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(munmap), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(mprotect), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(arch_prctl), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(access), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(set_tid_address), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(set_robust_list), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(get_robust_list), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(futex), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(rseq), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(uname), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(prlimit64), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(readlink), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(getrandom), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(newfstatat), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(openat), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(getuid), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(geteuid), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(getgid), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(getegid), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(rt_sigaction), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(execve), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(rt_sigprocmask), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(sched_getaffinity), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(sched_yield), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(gettid), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(getpid), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(faccessat2), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(faccessat), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(sysinfo), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(madvise), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(getcwd), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(clock_nanosleep), 0);
			seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(clock_getres), 0);

			if (run_cmd == "java") {
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(clone3), 0);
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(connect), 0);
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(unlink), 0);
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(socket), 0);
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(mkdir), 0);
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(ftruncate), 0);
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(getrusage), 0);
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(flock), 0);
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(prctl), 0);
				seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(fchdir), 0);
			}

			if (run_cmd != "java") { // temporary while i figure out how to fix java
				if (seccomp_load(ctx)) {
					std::cerr << "failed to load seccomp" << std::endl;
					seccomp_release(ctx);
					return IE;
				}
			}

			seccomp_release(ctx);

			if (run_cmd != "java")
				execlp(run_cmd.c_str(), run_cmd.c_str(), run_args.c_str(), NULL);
			else {
				std::string mem_str = "-Xmx" + std::to_string(memory_limit) + "m";
				execlp(run_cmd.c_str(), run_cmd.c_str(), run_args.c_str(), mem_str.c_str(), "-Xss64m", NULL);
			}
		} else if (pid > 0) {
			// unsigned long long penalty = 0;
			// parent
			while (1) {
				int status;
				waitpid(pid, &status, 0);
				if (WIFEXITED(status)) {
					if (WEXITSTATUS(status) != 0) {
						std::cout << get_memory(pid) << ' ' << get_time(prev_use) << std::endl;
						return IR;
					}
					uint64_t time = get_time(prev_use);
					if (time > time_limit) {
						std::cout << time_limit+1 << std::endl;
						return TLE;
					}
					std::cout << time << std::endl;
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

					std::cerr << "output: " << tptr1 << std::endl;
					std::cerr << "expected: " << tptr2 << std::endl;

					if (!(*check)(tptr1, tptr2)) {
						return WA;
					}
					break;
				} else if (WIFSTOPPED(status)) {
					int sig = WSTOPSIG(status);
					if (sig == SIGTRAP) {
						long long rax = ptrace(PTRACE_PEEKUSER, pid, 8 * ORIG_RAX, NULL);
						if (rax == 231 || rax == 60) {
							// exit
							// look for memory usage in /proc/pid/status
							if (run_cmd == "java") {
								std::cout << rand()/12345 << ' '; // dummy value because we dont know how to do this
							} else {
								int mem = get_memory(pid);
								if (mem > memory_limit * 1024) {
									std::cout << mem << ' ';
									struct rusage usage;
									getrusage(RUSAGE_CHILDREN, &usage);
									time_t time = (usage.ru_utime.tv_sec - prev_use.ru_utime.tv_sec) * 1000 + (usage.ru_utime.tv_usec - prev_use.ru_utime.tv_usec) / 1000.;
									std::cout << time << std::endl;
									return MLE;
								}
								std::cout << mem << ' ';
							}
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
							std::cout << get_memory(pid) << ' ' << time_limit+1 << std::endl;
							return TLE;
						} else if (sig == SIGSEGV) {
							std::cout << get_memory(pid) << ' ' << get_time(prev_use) << std::endl;
							return RTE | SEGV;
						} else if (sig == SIGFPE) {
							std::cout << get_memory(pid) << ' ' << get_time(prev_use) << std::endl;
							return RTE | FPE;
						} else if (sig == SIGABRT) {
							std::cout << get_memory(pid) << ' ' << get_time(prev_use) << std::endl;
							return RTE | ABRT;
						} else {
							std::cout << get_memory(pid) << ' ' << get_time(prev_use) << std::endl;
							std::cerr << "process exit with signal " << sig << std::endl;
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