#!/bin/bash
if [ "$1" == "--push" ]
then
	echo "Pushing changes to cloud storage..."
	mkdir tmp
	google-drive-ocamlfuse tmp
	# wait for ./tmp/problems/ to exist
	until [ -d "./tmp/problems/" ]
	do 
		sleep 1
	done
	cp -r ./problems/* ./tmp/problems/ --verbose
	cp ./web-backend/db.db ./tmp/db.db
	umount tmp
	rm -rf tmp
	echo "Done!"
elif [ "$1" == "--pull" ]
then
	echo "Pulling changes from cloud storage..."
	mkdir tmp
	google-drive-ocamlfuse tmp
	until [ -d "./tmp/problems/" ]
	do 
		sleep 1
	done
	cp -r ./tmp/problems/* ./problems/
	umount tmp
	rm -rf tmp
	echo "Done!"
else
	echo "Usage: ./update.sh [--push] [--pull]"
	echo "	--push: push changes to cloud storage"
	echo "	--pull: pull changes from cloud storage"
fi