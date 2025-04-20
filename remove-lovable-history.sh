#!/bin/bash

echo "WARNING: This script will rewrite git history."
echo "Make sure you have pushed all your changes and have a backup."
echo "This operation cannot be undone."
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Operation cancelled."
    exit 1
fi

# Check if git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null
then
    echo "git-filter-repo is not installed. Would you like to install it via pip?"
    read -p "Install git-filter-repo? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        pip install git-filter-repo
    else
        echo "Please install git-filter-repo first: https://github.com/newren/git-filter-repo"
        exit 1
    fi
fi

# Back up the repository
BACKUP_DIR="../walgit-backup-$(date +%Y%m%d%H%M%S)"
echo "Creating backup in $BACKUP_DIR"
cp -r . $BACKUP_DIR

# Create a file to filter content in files
cat > lovable-filter.py << 'EOF'
#!/usr/bin/env python3
import re
from git_filter_repo import Blob, FilteringOptions

def filter_lovable(blob, callback_metadata):
    # Convert content to string for text files
    try:
        content = blob.data.decode('utf-8')
        # Replace 'lovable' with appropriate alternatives
        new_content = re.sub(r'lovable-tagger', 'component-tagger', content, flags=re.IGNORECASE)
        new_content = re.sub(r'lovable', 'walgit', new_content, flags=re.IGNORECASE)
        
        # Only update if changes were made
        if new_content != content:
            blob.data = new_content.encode('utf-8')
    except UnicodeDecodeError:
        # Not a text file, skip it
        pass
    return True

filter_options = FilteringOptions()
filter_options.blob_callback = filter_lovable
EOF

# Filter commit messages and file content
echo "Rewriting git history to remove 'lovable' references..."
git filter-repo --force --commit-callback "
    commit.message = commit.message.replace(b'lovable', b'walgit')
" --use-credential-hook --source=. --path-glob "*.json" --path-glob "*.js" --path-glob "*.jsx" --path-glob "*.ts" --path-glob "*.tsx" --path-glob "*.html" --path-glob "*.md" --path-glob "*.css" --run-command="python3 lovable-filter.py"

# Clean up
rm lovable-filter.py

echo "Git history has been rewritten."
echo "You will need to force push these changes: git push -f origin main"
echo "WARNING: This will overwrite the repository history on remote. Make sure collaborators are aware."
