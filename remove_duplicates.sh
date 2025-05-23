#!/bin/bash

# Script to remove files with ' 2' suffix in the move/ directory
MOVE_DIR="/Users/angel/Documents/Projects/walgit/move"

# Find and list files with ' 2' in their name
echo "Files that would be removed:"
find "$MOVE_DIR" -name "* 2*" -type f -o -name "* 2*" -type d | sort

echo "Run script with --remove to actually remove these files."

# If --remove flag is provided, remove the files
if [[ "$1" == "--remove" ]]; then
    echo "Removing files..."
    find "$MOVE_DIR" -name "* 2*" -type f -exec rm {} \;
    find "$MOVE_DIR" -name "* 2*" -type d -exec rm -rf {} \;
    echo "Files removed successfully."
fi