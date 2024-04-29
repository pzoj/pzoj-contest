# judging backend

- judging should be run with the following command:
./judge <language> <problem_dir>
- each problem directory should have a "problem.md" file "editorial.md", "judge.txt", "meta.txt", and a "test" directory
- the test directory should contain the test cases referenced in judge.txt (without "test/")
- do NOT set the problem directory as the test directory
- test case file names cannot be over 32 characters
- problem.md should contain the problem description
- judge.txt should contain the problem metadata:
	- (time_limit (ms)) (memory_limit (MB)) (checker_type)
	- (input_file) (output_file)
	...
- meta.txt should contain the following metadata:
	- formatted name of problem
	- problem stars
	- problem tag
	- privacy (0 for public, 1 for private)

- web backend MUST remove code_file, output.txt, and a.out after judging