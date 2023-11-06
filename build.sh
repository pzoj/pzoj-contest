#!/bin/bash
if [ "$1" == "--help" ]
then
	echo "Usage: ./build.sh [--first-time]"
	echo "	--first-time: install npm dependencies"
	exit 0
fi
if [ "$1" == "--first-time" ]
then
	echo "Input a key for password hashing or leave blank for default key:"
	read key
	if [ "$key" == "" ]
	then
		echo "Using default key..."
		# randomly generate key
		head -c 32 /dev/urandom | base64 > ./web-backend/key.key
	else
		echo "Using custom key..."
		echo $key > ./web-backend/key.key
fi
# 1. Build judge
echo "Building judge..."
cd judging-backend
# check if judge already exists
g++ checkers.cpp main.cpp -o judge -O3
cd ..
# 2. Install Node.js dependencies
# if --first-time flag is passed, install npm dependencies
if [ "$1" == "--first-time" ]
then
	echo "Installing Node.js dependencies..."
	cd web-backend
	npm i
	cd ..
fi
# 3. Build frontend
echo "Building frontend..."
cd client
if [ "$1" == "--first-time" ]
then
	npm i
fi
npm run build
cd ..
# 4. Connect to cloud storage for problems directory
echo "Connecting to cloud storage..."
mkdir tmp
google-drive-ocamlfuse tmp
# wait for ./tmp/problems/ to exist
until [ -d "./tmp/problems/" ]
do 
	sleep 1
done
cp -r ./tmp/problems/* ./problems/
if [ "$1" == "--first-time" ]
then
	echo "Getting latest database..."
	cp ./tmp/db.db ./web-backend/db.db
fi
umount tmp
rm -rf tmp
# 5. Starting server
echo "Starting server..."
cd web-backend
tmux new-session -d -s "server" "node index.js"
cd ..
# 6. Starting client
echo "Starting client..."
cd client
tmux new-session -d -s "client" "npm start"
cd ..
echo "Done!"