char table[] = {1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0};

bool syscall_allowed(int syscall) {
	// return table[syscall];
	return true;
	// switch (syscall) {
	// case 0: // read
	// case 1: // wrie
	// case 2: // open
	// case 3: // close
	// case 4: // stat
	// case 5: // fstat
	// case 6: // lstat
	// case 8: // lseek
	// case 9: // mmap
	// case 10: // mprotect
	// case 11: // munmap
	// case 12: // brk
	// case 13: // rt_sigaction
	// case 14: // rt_sigprocmask
	// case 15: // rt_sigreturn
	// case 16: // ioctl
	// case 20: // writev
	// case 21: // access
	// case 25: // mremap
	// case 26: // msync
	// case 39: // getpid
	// case 59: // execve
	// case 63: // uname
	// case 72: // fnctl
	// case 79: // getcwd
	// case 89: // readlink
	// case 102: // getuid
	// case 104: // getgid
	// case 107: // geteuid
	// case 108: // getegid
	// case 158: // arch_prctl
	// case 186: // gettid
	// case 202: // futex
	// case 217: // getdents64
	// case 218: // set_tid_address
	// case 231: // exit_group
	// case 234: // tgkill
	// case 257: // openat
	// case 273: // set_robust_list
	// case 274: // get_robust_list
	// case 302: // prlimit64
	// case 318: // getrandom
	// 	return 1;
	// 	break;
	// default:
	// 	return 0;
	// 	break;
	// }
}