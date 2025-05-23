#!/bin/bash

# Script to remove redundant /next/ directory after verifying it contains duplicates

echo "Starting cleanup of redundant /next/ directory..."

# Create a backup of the directory first
echo "Creating backup..."
cp -r "/Users/angel/Documents/Projects/walgit/next" "/Users/angel/Documents/Projects/walgit/next_backup_$(date +%Y%m%d_%H%M%S)"
echo "Backup created successfully."

# Remove the redundant directory
echo "Removing redundant /next/ directory..."
rm -rf "/Users/angel/Documents/Projects/walgit/next"
echo "Directory removed successfully."

echo "Cleanup complete."