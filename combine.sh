# -f force update
# -l looping check

export CACHE="./cache"

if [ ! -f $CACHE ]; then
	touch $CACHE
fi

check() {
	DIFF=$(diff <(grep "$1" "$CACHE") <(sha1sum "$1"))

	if [ "$DIFF" != "" ]; then
		echo "$1"
	fi
}; export -f check

update() {
  CHANGES=$(find -name '*.js' -exec bash -c 'check "$0"' {} \;)

  if [ "$1" == "-f" ]; then
	  CHANGES="Forcing update..."
  fi

  if [ "$CHANGES" != "" ]; then
    echo "Change detected, rebuilding!"
    echo "$CHANGES"
    echo "----------------------------"
    # ./build.sh
    PROJECT="engine"
    SOURCE="src"
    BUILD="build"
    INDEX="index"

    cd $SOURCE

    DEST="../$BUILD/$PROJECT.js"

    rm -rf $DEST
    while read file
    do
      echo "Appending $file to $DEST..."
      cat $file >> $DEST
      echo >> $DEST
    done < $INDEX
    cd ../

    echo "----------------------------"
    echo "Updating cache..."
    find -name '*.js' -exec sha1sum {} \; > $CACHE
  else
    echo -ne "No changes detected\r"
  fi
}

update
while [ "$1" == "-l" ]; do
  update
  sleep 2
done
echo
