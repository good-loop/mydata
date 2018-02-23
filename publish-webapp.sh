#!/bin/bash

PUBLISHSCRIPTVERSION='1.5.1'
#########
# Skeletal Publish Script For a New Project
#########

#Setting empty Arrays
CLUSTER_NODES=()
DONOTSYNC=()

#################################################################
# For your project,  please change the items below this comment #
#################################################################

#What is your Project's Name?
PROJECT='calstat'
# What is your project's root directory on you local machine?
PROJECTROOT="/home/$USERNAME/winterwell/code/$PROJECT"

#Where will the project be served from, when it is on the test-server and production-server?
DESTINATIONDIR="/home/winterwell/$PROJECT"

#####Do Jars need to be sync'ed?
SYNCJARS='true'
###Where are your project's JARs compiled into?
PROJECT_JARS_DIR="$PROJECTROOT/tmp-lib"
####Where are your JARS going to live?
DESTINATION_JAR_DIR="$DESTINATIONDIR/lib"


#OPTIONAL What files and directories should we NOT sync to production and test ?
DONOTSYNC=" node_modules "
DONOTSYNC+=" src-js "
DONOTSYNC+=" test "
DONOTSYNC+=" build "
DONOTSYNC+=" boblog "
DONOTSYNC+=" README.md "
DONOTSYNC+=" watch.sh "
DONOTSYNC+=" publish-$PROJECT.sh "
DONOTSYNC+=" convert.less.sh "
#DONOTSYNC+=" bin "
#DONOTSYNC+=" src "
#DONOTSYNC+=" .git "

#Where is your project going to be LIVE for production? (add spaces between entries and enclose them in single quotes, if this is a clustered project)
PRODUCTION=('bester.soda.sh')

#Where is your project going to be TEST-ed ?
TEST=('bester.soda.sh')

#Does your project require: ?

NPM='true'
WEBPACK='true'

LESSCONVERSION='true' # This requires you to then specify the directory where your LESS files are held
LESSDIR="$PROJECTROOT/web/style"

JS_TESTING='false' # This requires you to then specify the directory where your JS files are held
#JSDIR="$PROJECTROOT/js"

IMAGEOPTIMISATION='false' # This requires you to then specify the directory where your images are held
#IMAGEDIRECTORY="$PROJECTROOT/img/"

#When your project is sync'ed to the destination server, Should this script attempt to restart a JVM service for you?
RESTARTAFTERSYNC='true'    
#What is the name of the process that is on the target server? e.g. if you were to use `sudo service $PROCESS restart`, what would "$PROCESS" be?
PROJECTPROCESS="calstat-server.sh"

################################################################
# DO NOT edit the stuff beneath this line:					   #
# Unless you are adding new functionality to the script itself #
################################################################





##################################
### HANDLING PUBLISH-TYPE ARGUMENT
##################################
if [[ $1 = '' ]]; then
	echo -e "Error, no publish-type was defined"
	echo -e "re-run with either 'production' or 'test' as the first argument"
	exit 0
fi
case $1 in
	production|PRODUCTION)
	echo "this is a PRODUCTION pushout"
	TARGET=${PRODUCTION[@]}
	TYPEOFPUSHOUT='PRODUCTION'
	;;
	test|TEST)
	echo "this is a TEST pushout"
	TARGET=$TEST
	TYPEOFPUSHOUT='TEST'
	;;
	*)
	echo "The script couldn't discern if this was a production or a test pushout.  EXITING..."
	exit 1
	;;
esac


##############################
#FUNCTIONS
##############################

### File Sync Function
function sync_files {
	FINDOLDDONOTSYNCLIST=$(find /tmp/ -type f -name 'donotsync.list.txt')
	if [[ $FINDOLDDONOTSYNCLIST != '' ]]; then
		rm /tmp/donotsync.list.txt
	else
		touch /tmp/donotsync.list.txt
	fi
	if [[ $DONOTSYNC != '' ]]; then
		for item in ${DONOTSYNC[*]}; do
			echo -e "$item" >> /tmp/donotsync.list.txt
		done
	fi
	for server in ${TARGET[*]}; do
		rsync -rhPe 'ssh -i ~/.ssh/winterwell@soda.sh' --exclude-from '/tmp/donotsync.list.txt' --exclude '*.jar' "$PROJECTROOT"/* winterwell@$server:"$DESTINATIONDIR"
	done
}

### Update NPM dependencies on target server function
function update_npm {
	for server in ${TARGET[*]}; do
		ssh winterwell@$server "cd $DESTINATIONDIR && npm i"
	done
}


### Tell Webpack to create a new bundle.js file
function webpack_project {
	for server in ${TARGET[*]}; do
		ssh winterwell@$server "cd $DESTINATIONDIR && webpack -p"
	done
}


### Convert LESS files to CSS
function convert_less {
	GOTLESSC=$(which lessc)
	if [[ $GOTLESSC = '' ]]; then
		echo -e "This script tried to find your LESS compiler on your system, and couldn't find one."
		echo -e "Install the less compiler with 'sudo npm install -g less'"
		echo -e "...EXITING..."
		exit 0
	fi
	if [[ $LESSCONVERSION = 'true' ]]; then
		if [[ $LESSDIR = '' ]]; then
			echo -e "You have LESSCONVERSION set to 'true' , but you didn't specify a directory where your LESS files are kept."
			echo -e "input the directory where your LESS files are, in the LESSDIR parameter of this script before re-running, or you can turn LESS conversion off if you wish."
			echo -e ""
			echo -e "...exiting..."
			exit 0
		else
			for file in $(find $LESSDIR -type f -name '*.less'); do
				if [ -e "$file" ]; then
					echo -e "converting $file"
					lessc "$file" "${file%.less}.css"
				else
					echo -e "No less files found in $LESSDIR"
					exit 0
				fi
			done
		fi
	fi
}


### Test JS files for errors
function test_js {
	GOTJSHINT=$(which jshint)
	if [[ $GOTJSHINT = '' ]]; then
		echo -e "This script tried to find your installation of jshint on your system, and couldn't find it."
		echo -e "Install jshint with 'sudo npm install -g jshint'"
		echo -e "...exiting...."
		exit 3
	fi
	if [[ $JS_TESTING = 'true' ]]; then
		if [[ $JSDIR = '' ]]; then
			echo -e "You have JS_TESTING set to 'true' , but you didn't specify a directory where your JS files are kept."
			echo -e "input the directory where your JS files are, in the JSDIR parameter of this script before re-running. Or you can turn JS_TESTING off if you wish."
			echo -e ""
			echo -e "...exiting..."
			exit 0
		fi
	else
		JSFILESTOTEST=$(find $JSDIR/ -mindepth 1 \(-name "*.js" !-name "babe*" \) -type f)
		for javascriptfile in ${JSFILESTOTEST[*]}; do
			TESTJSFILE=$(jshint --verbose $javascriptfile | grep -E E[0-9]+.$)
			if [[ $TESTJSFILE = "" ]]; then
				echo -e "$javascriptfile passed the jshint test"
			else
				echo -e "$javascriptfile has syntax errors"
				echo -e "run ... jshint --verbose $javascriptfile ...to see the issue"
				echo -e "publishing has haulted"
				exit 3
			fi
		done
	fi
}


#### Optimise Images based on MD5 checksums of the images (instead of filename comparisons between new images and ones that have already been optimised)
function image_optimisation {
	# check for dependencies
	GOTOPTIPNG=$(which optipng)
	GOTJPEGOPTIM=$(which jpegoptim)
	if [[ $GOTOPTIPNG = '' ]]; then
		echo -e "This script tried to find your installation of optipng on your system, and couldn't find it."
		echo -e "Install optipng with 'sudo apt-get --yes install optipng'"
		echo -e "....exiting..."
		exit 2
	fi
	if [[ $GOTJPEGOPTIM = '' ]]; then
		echo -e "This script tried to find your installation of jpegoptim on your system, and couldn't find it."
		echo -e "Install jpegoptim with 'sudo apt-get --yes install jpegoptim'"
		echo -e "...exiting..."
		exit 2
	fi
	# check to see if the imagedirectory was specified
	if [[ $IMAGEDIRECTORY = '' ]]; then
		echo -e "You must adjust this script and add the directory where your image files are kept if you want them to be optimised"
		echo -e ""
		echo -e "...exiting..."
		exit 2
	fi
	# check to see if there are existing array text files
	EXISTINGPNGARRAYTXT=$(find $IMAGEDIRECTORY/ -type f -name 'pngarray.txt')
	GOTPNGS=$(find $IMAGEDIRECTORY/ -type f -name '*.png')
	if [[ $EXISTINGPNGARRAYTXT = '' ]]; then
		if [[ $GOTPNGS = '' ]]; then
			echo -e "No PNG files found in your specified image directory $IMAGEDIRECTORY"
			echo -e "And no pngarray text file found either, a blank file will be created for future runs of this script."
			touch $IMAGEDIRECTORY/pngarray.txt
			OPTIMISEPNGSTASK='no'
		else
			echo -e "You have PNG files, but no pngarray.txt file yet.  All PNG files will now be optimised as if this is your first run."
			touch $IMAGEDIRECTORY/pngarray.txt
			OPTIMISEPNGSTASK='yes'
		fi
	elif [[ $GOTPNGS = '' ]]; then
			echo -e "No PNG files found to optimise"
			OPTIMISEPNGSTASK='no'
	else
		echo -e "You don't yet have a pngarray.txt file in your specified image directory.  This script will create one now for future runs."
		echo -e "All PNG files will now be optimised and recorded so that they won't be optimised again in the future."
		touch $IMAGEDIRECTORY/pngarray.txt
		OPTIMISEPNGSTASK='yes'
	fi
	EXISTINGJPGARRAYTXT=$(find $IMAGEDIRECTORY/ -type f -name 'jpgarray.txt')
	GOTJPGS=$(find $IMAGEDIRECTORY/ -type f -name '*.jpg')
	if [[ $EXISTINGJPGARRAYTXT = '' ]]; then
		if [[ $GOTJPGS = '' ]]; then
			echo -e "No JPG files found in your specified image directory $IMAGEDIRECTORY"
			echo -e "And no jpgarray.txt file found either, a blank file will be created for future runs of this script"
			touch $IMAGEDIRECTORY/jpgarray.txt
			OPTIMISEJPGSTASK='no'
		else
			echo -e "You have JPG files, but no jpgarray.txt file yet.  All JPG files will now be optimised as if this is your first run."
			touch $IMAGEDIRECTORY/jpgarray.txt
			OPTIMISEJPGSTASK='yes'
		fi
	elif [[ $GOTJPGS = '' ]]; then
			echo -e "No JPG files found to optimise"
			OPTIMISEJPGSTASK='no'
	else
		echo -e "You don't yet have a jpgarray.txt file in your specified image directory. This script will create one now for future runs."
		echo -e "All JPG files will now be optimised and recorded so that they won't be optimised again in the future."
		touch $IMAGEDIRECTORY/jpgarray.txt
		OPTIMISEJPGSTASK='yes'
	fi
	EXISTINGJPEGARRAYTXT=$(find $IMAGEDIRECTORY/ -type -f -name 'jpegarray.txt')
	GOTJPEGS=$(find $IMAGEDIRECTORY/ -type f -name '*.jpeg')
	if [[ $EXISTINGJPEGARRAYTXT = '' ]]; then
		if [[ $GOTJPEGS = '' ]]; then
			echo -e "No JPEG files found in your specifiec image directory $IMAGEDIRECTORY"
			echo -e "And no jpegarray.txt file found either, a blank file will be created for future runs of this script"
			touch $IMAGEDIRECTORY/jpegarray.txt
			OPTIMISEJPEGSTASK='no'
		else
			echo -e "You have JPEG files, but not jpegarray.txt file yet.  All JPEG files will now be optimised as if this is your first run."
			touch $IMAGEDIRECTORY/jpegarray.txt
			OPTIMISEJPEGSTASK='yes'
		fi
	elif [[ $GOTJPEGS = '' ]]; then
			echo -e "No JPEG files found to optimise"
			OPTIMISEJPEGSTASK='no'
	else
		echo -e "You don't yet have a jpegarra.txt file in your specified image directory. This script will create one now for future runs."
		echo -e "All JPEG files will not be optimised and recorded so that they won't be optimised again in the future."
		touch $IMAGEDIRECTORY/jpegarray.txt
		OPTIMISEJPEGSTASK='yes'
	fi

	#check for newarray.txt files to be killed
	GOTNEWPNGARRAYFILE=$(find $IMAGEDIRECTORY/ -type f -name 'newpngarray.txt')
	if [[ $GOTNEWPNGARRAYFILE != '' ]]; then
		rm $IMAGEDIRECTORY/newpngarray.txt
	fi
	GOTNEWJPGARRAYFILE=$(find $IMAGEDIRECTORY/ -type f -name 'newjpgarray.txt')
	if [[ $GOTNEWJPGARRAYFILE != '' ]]; then
		rm $IMAGEDIRECTORY/newjpgarray.txt
	fi
	GOTNEWJPEGARRAYFILE=$(find $IMAGEDIRECTORY/ -type f -name 'newjpegarray.txt')
	if [[ $GOTNEWJPEGARRAYFILE != '' ]]; then
		rm $IMAGEDIRECTORY/newjpegarray.txt
	fi

	#Perform the optimisations and update the array files

	## For PNGs
	if [[ $OPTIMISEPNGSTASK = 'yes' ]]; then
		mapfile -t OPTIMISEDPNGS < $IMAGEDIRECTORY/pngarray.txt
		for file in $(find $IMAGEDIRECTORY/ -type f -name '*.png'); do
			PNGMD5OUTPUT=$(md5sum $file)
			echo -e "$PNGMD5OUTPUT" >> $IMAGEDIRECTORY/newpngarray.txt
		done
		mapfile -t PNGARRAY < $IMAGEDIRECTORY/newpngarray.txt
		UNIQUEPNGS=$(diff $IMAGEDIRECTORY/pngarray.txt $IMAGEDIRECTORY/newpngarray.txt | grep ">" | awk '{print $3}')
		if [[ ${UNIQUEPNGS[*]} = '' ]]; then
			echo -e ""
			echo -e "No new PNG files to optimise"
		else
			for png in ${UNIQUEPNGS[*]}; do
				optipng $png
			done
		fi
		rm $IMAGEDIRECTORY/pngarray.txt
		touch $IMAGEDIRECTORY/pngarray.txt
		for file in $(find $IMAGEDIRECTORY/ -type f -name '*.png'); do
			PNGMD5OUTPUT=$(md5sum $file)
			echo -e "$PNGMD5OUTPUT" >> $IMAGEDIRECTORY/pngarray.txt
		done
	fi

	## For JPGs
	if [[ $OPTIMISEJPGSTASK = 'yes' ]]; then
		mapfile -t OPTIMISEDJPGS < $IMAGEDIRECTORY/jpgarray.txt
		for file in $(find $IMAGEDIRECTORY/ -type f -name '*.jpg'); do
			JPGMD5OUTPUT=$(md5sum $file)
			echo -e "$JPGMD5OUTPUT" >> $IMAGEDIRECTORY/newjpgarray.txt
		done
		mapfile -t JPGARRAY < $IMAGEDIRECTORY/newjpgarray.txt
		UNIQUEJPGS=$(diff $IMAGEDIRECTORY/jpgarray.txt $IMAGEDIRECTORY/newjpgarray.txt | grep ">" | awk '{print $3}')
		if [[ ${UNIQUEJPGS[*]} = '' ]]; then
			echo -e ""
			echo -e "No new JPG files to optimise"
		else
			for jpg in ${UNIQUEJPGS[*]}; do
				jpegoptim $jpg
			done
		fi
		rm $IMAGEDIRECTORY/jpgarray.txt
		touch $IMAGEDIRECTORY/jpgarray.txt
		for file in $(find $IMAGEDIRECTORY/ -type f -name '*.jpg'); do
			JPGMD5OUTPUT=$(md5sum $file)
			echo -e "$JPGMD5OUTPUT" >> $IMAGEDIRECTORY/jpgarray.txt
		done
	fi

	## For JPEGs
	if [[ $OPTIMISEJPEGSTASK = 'yes' ]]; then
		mapfile -t OPTIMISEDJPEGS < $IMAGEDIRECTORY/jpegarray.txt
		for file in $(find $IMAGEDIRECTORY/ -type f -name '*.jpeg'); do
			JPEGMD5OUTPUT=$(md5sum $file)
			echo -e "$JPEGMD5OUTPUT" >> $IMAGEDIRECTORY/newjpegarray.txt
		done
		mapfile -t JPEGARRAY < $IMAGEDIRECTORY/newjpegarray.txt
		UNIQUEJPEGS=$(diff $IMAGEDIRECTORY/jpegarray.txt $IMAGEDIRECTORY/newjpegarray.txt | grep ">" | awk '{print $3}')
		if [[ ${UNIQUEJPEGS[*]} = '' ]]; then
			echo -e ""
			echo -e "No new JPEG files to optimise"
		else
			for jpeg in ${UNIQUEJPEGS[*]}; do
				jpegoptim $jpeg
			done
		fi
		rm $IMAGEDIRECTORY/jpegarray.txt
		touch $IMAGEDIRECTORY/jpegarray.txt
		for file in $(find $IMAGEDIRECTORY/ -type f -name '*.jpeg'); do
			JPEGMD5OUTPUT=$(md5sum $file)
			echo -e "$JPEGMD5OUTPUT" >> $IMAGEDIRECTORY/jpegarray.txt
		done
	fi
}

function restart_process {
	for server in ${TARGET[*]}; do
		ssh winterwell@$server "sudo service $PROJECTPROCESS restart"
	done
}


function sync_jars {
	for server in ${TARGET[*]}; do
		rsync -rhPe 'ssh -i ~/.ssh/winterwell@soda.sh' $PROJECT_JARS_DIR/*.jar winterwell@$server:$DESTINATION_JAR_DIR/
	done
}

###################
## Handle bad Parameters
###################
if [[ $TYPEOFPUSHOUT = 'PRODUCTION' ]]; then
	if [[ $PRODUCTION = 'PRODUCTION.soda.sh' ]]; then
		echo -e "You must configure this script with a valid target production server before running it."
		echo -e "...exiting..."
		exit 3
	elif
		[[ $PRODUCTION = '' ]]; then
		echo -e "You must configure this script with a valid target production server before running it."
		echo -e "...exiting..."
		exit 3
	fi
fi

if [[ $TYPEOFPUSHOUT = 'TEST' ]]; then
	if [[ $TEST = 'TEST.soda.sh' ]]; then
		echo -e "You must configure this script with a valid target TEST server before running it."
		echo -e "...exiting..."
		exit 3
	elif
		[[ $TEST = '' ]]; then
		echo -e "You must configure this script with a valid target TEST server before running it."
		echo -e "...exiting..."
		exit 3
	fi
fi

if [[ $PROJECT = 'MyNewProject' ]]; then
	echo -e ""
	echo -e "Your New Project is called $PROJECT ?  That's a coincidence.  So is mine"
	echo -e ""
	echo -e "You must come up with an original name for your project and put it into this script."
	echo -e "...exiting..."
	exit 0
fi

if [[ $PROJECTROOT = "/home/$USERNAME/winterwell/MyNewProject" ]]; then
	echo -e ""
	echo -e "Your new project is located at $PROJECTROOT ?  That's a coincidence.  That's exactly what the unconfigured parameters of this script come with"
	echo -e ""
	echo -e "Come on, you can do better than that.  Please input an originally named directory into this script for the PROJECTROOT parameter"
	echo -e ""
	echo -e "...exiting..."
	exit 0
fi

case $RESTARTAFTERSYNC in
	false|FALSE)
	RESTARTAFTERSYNC='false'
	;;
	true|TRUE)
	RESTARTAFTERSYNC='true'
	;;
	*)
	echo -e "Bad setting for RESTARTAFTERSYNC parameter of this script.  Value must be either 'true' or 'false'"
	echo -e ""
	echo -e "...exiting..."
	exit 0
	;;
esac

case $NPM in
	false|FALSE)
	NPM='false'
	;;
	true|TRUE)
	NPM='true'
	;;
	*)
	echo -e "Bad setting for the NPM parameter of this script.  Value must be either 'true' or 'false' "
	echo -e ""
	echo -e "...exiting..."
	exit 0
	;;
esac

case $WEBPACK in
	false|FALSE)
	WEBPACK='false'
	;;
	true|TRUE)
	WEBPACK='true'
	;;
	*)
	echo -e "Bad setting for the WEBPACK parameter of this script.  Value must be either 'true' or 'false' "
	echo -e ""
	echo -e "...exiting..."
	exit 0
	;;
esac

case $LESSCONVERSION in
	false|FALSE)
	LESSCONVERSION='false'
	;;
	true|TRUE)
	LESSCONVERSION='true'
	;;
	*)
	echo -e "Bad setting for the LESSCONVERSION parameter of this script.  Value must be either 'true' or 'false' "
	echo -e ""
	echo -e "...exiting..."
	exit 0
	;;
esac

case $JS_TESTING in
	false|FALSE)
	JS_TESTING='false'
	;;
	true|TRUE)
	JS_TESTING='true'
	;;
	*)
	echo -e "Bad setting for the JS_TESTING parameter of this script. Value must be either 'true' or 'false' "
	echo -e ""
	echo -e "...exiting..."
	exit 0
	;;
esac

case $IMAGEOPTIMISATION in
	false|FALSE)
	IMAGEOPTIMISATION='false'
	;;
	true|TRUE)
	IMAGEOPTIMISATION='true'
	;;
	*)
	echo -e "Bad setting for the IMAGEOPTIMISATION parameter of this script.  Value must be either 'true' or 'false' "
	echo -e ""
	echo -e "...exiting..."
	exit 0
	;;
esac

case $SYNCJARS in
	true|TRUE)
	SYNCJARS='true'
	;;
	false|FALSE)
	SYNCJARS='false'
	;;
	*)
	echo -e "Bad setting for the SYNCJARS parameter of this script.  Value must be either 'true' or 'false' "
	echo -e ""
	echo -e "...exiting..."
	exit 0
	;;
esac


###################
## Perform the requested actions
## in a specific order
###################

###JS Testing is done locally before syncing
if [[ $JS_TESTING = 'true' ]]; then
	test_js
fi

###Image optimisation is done locally before syncing
if [[ $IMAGEOPTIMISATION = 'true' ]]; then
	image_optimisation
fi

### LESS conversion is done localy before syncing
if [[ $LESSCONVERSION = 'true' ]]; then
	convert_less
fi

### NOW Perform the sync operation
sync_files

### Update NPM on the target
if [[ $NPM = 'true' ]]; then
	update_npm
fi

### Webpack on the target
if [[ $WEBPACK = 'true' ]]; then
	webpack_project
fi


if [[ $SYNCJARS = 'true' ]]; then
	sync_jars
fi

### Restart the process on the target
if [[ $RESTARTAFTERSYNC = 'true' ]]; then
	restart_process
fi