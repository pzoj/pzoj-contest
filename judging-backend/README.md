# judging backend

- judging should be run with the following command:
./judge <language> <problem_dir> <judge_id>
- each problem directory should have a "problem.md" file "editorial.md", "judge.txt", "meta.txt", and a "test" directory
- the test directory should contain the test cases referenced in judge.txt (without "test/")
- do NOT set the problem directory as the test directory
- test case file names cannot be over 32 characters (just why?)
- problem.md should contain the problem description
- judge.txt should contain the problem metadata:
	- (time_limit (ms)) (memory_limit (MB)) (checker_type)
	- (input_file) (output_file)
	...
- meta.txt should contain the following metadata:
	- formatted name of problem
	- problem stars
	- problem tag

- web backend MUST remove code_file after judging
- everything else goes into /tmp so maybe clear that out every once in a while

- judge output in stdout is of the format:
	- (verdict) (memory) (time)
	- ...
- each line is a test case
- judge returns the following codes:
	- 0: accepted
	- 1: wrong answer
	- 2: time limit exceeded
	- 3: memory limit exceeded
	- 4: internal error
	- 5: output limit exceeded
	- 6: compilation error
	- 7: invalid return
	- 8: runtime error
	- 8|16: segmentation fault
	- 8|32: floating point exception
	- 8|64: aborted
	- 8|128: disallowed system call