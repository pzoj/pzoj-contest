# Contest format

This is really scuffed but I'll revamp it later.

## Contest format

Each contest must have a folder (with the contest id) containing the following files:
- meta.txt
	- The first line is the contest name
	- The second line is the contest start time in UTC
	- The third line is the contest end time in UTC
	- 0 if the contest is unrated, 1 if it is (not implemented yet)
- problems.txt
	- Each line is a problem id, which should point to a problem in the problems folder
- contest.md
	- The contest description
