# PZOJ Contest Instance

This is the contest instance of PZOJ, built to run contests.

Before running a contest, make sure to clear the database, create your preset users, close registration, then GET /api/reset to initialize the leaderboard.

Make sure that the judge is compiled and also `sudo setcap cap_setuid,cap_setgid=eip ./judge` is run to allow the judge to drop privileges for security reasons.
